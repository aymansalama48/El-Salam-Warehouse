using El_Salam_Warehouse.Application.Common.Abstractions.Core;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Common.Pagination;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Entities.StockVouchers;
using El_Salam_Warehouse.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.Daybook.Queries.GetDaybook;

// سطر في دفتر اليومية (حركة صنف واحد)
public record DaybookEntryDto(
    Guid VoucherId,
    string VoucherNumber,
    StockVoucherType Type,
    DateOnly VoucherDate,
    DateTime OccurredAtUtc,
    VoucherSource Source,
    string? PartyName,
    string ReceiverName,
    Guid ProductId,
    string ProductName,
    string CategoryName,
    string UnitLabel,
    int Quantity,                 // زي ما اتكتبت
    int QuantitySubUnits,         // بأصغر وحدة
    int BalanceAfterSubUnits,     // الرصيد بعد الحركة
    StockVoucherStatus Status,
    ProductUnitType UnitType = ProductUnitType.Notebook,
    int UnitsPerBaseUnit = 1,
    string BaseUnit = "",
    string SubUnit = "",
    ReturnDirection? ReturnDirection = null,
    string? ReturnReason = null);

// إجماليات الفترة (من غير الإذونات الملغية)
public record DaybookTotalsDto(
    int InboundVouchers,
    int OutboundVouchers,
    int InboundNotebooks,         // كشاكيل وكراريس وارد (بالقطعة)
    int OutboundNotebooks,
    int InboundCartons,           // ورق تصوير وارد (بالكرتونة)
    int OutboundCartons,
    int InboundReams = 0,
    int OutboundReams = 0,
    int ReturnVouchers = 0,
    int ReturnNotebooks = 0,
    int ReturnCartons = 0,
    int ReturnReams = 0);

// الرد الكامل باستخدام PagedResult
public record DaybookResponse(DaybookTotalsDto Totals, PagedResult<DaybookEntryDto> Entries);

// 1. الـ Query
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Daybook.View)]
public record GetDaybookQuery(
    DateOnly? FromDate,
    DateOnly? ToDate,
    StockVoucherType? Type,
    Guid? ProductId,
    Guid? CategoryId,
    StockVoucherStatus? Status,
    string? Search,
    int Page = 1,
    int PageSize = 50) : IQuery<DaybookResponse>;

// 2. الـ Handler
internal sealed class GetDaybookQueryHandler : IQueryHandler<GetDaybookQuery, DaybookResponse>
{
    private readonly IReadDbContext _readContext;
    private readonly IDateTime _dateTime;

    // كونستركتور (تم حقن IDateTime)
    public GetDaybookQueryHandler(IReadDbContext readContext, IDateTime dateTime)
    {
        _readContext = readContext;
        _dateTime = dateTime;
    }

    // بناء الدفتر
    public async Task<Result<DaybookResponse>> Handle(GetDaybookQuery request, CancellationToken cancellationToken)
    {
        var page = Math.Max(request.Page, 1);
        var pageSize = Math.Clamp(request.PageSize, 1, 200);

        // الافتراضي: النهاردة بس (لو من بس: لحد النهاردة | لو لحد بس: نفس اليوم)
        // استخدام _dateTime بدلاً من CairoTime
        var to = request.ToDate ?? DateOnly.FromDateTime(_dateTime.Now);
        var from = request.FromDate ?? to;
        if (from > to) (from, to) = (to, from);

        // كل بند في كل إذن = سطر في الدفتر
        var query = _readContext.StockVouchers
            .SelectMany(v => v.Items, (v, i) => new { Voucher = v, Item = i })
            .Where(x => x.Voucher.VoucherDate >= from && x.Voucher.VoucherDate <= to);

        if (request.Type.HasValue)
            query = query.Where(x => x.Voucher.Type == request.Type.Value);

        if (request.Status.HasValue)
            query = query.Where(x => x.Voucher.Status == request.Status.Value);

        if (request.ProductId.HasValue)
            query = query.Where(x => x.Item.ProductId == request.ProductId.Value);

        if (request.CategoryId.HasValue)
            query = query.Where(x => x.Item.Product.CategoryId == request.CategoryId.Value);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim();
            query = query.Where(x => x.Item.ProductName.Contains(s) || x.Voucher.VoucherNumber.Contains(s));
        }

        // الإجماليات (من غير الملغي)
        var active = query.Where(x => x.Voucher.Status == StockVoucherStatus.Active);

        var voucherCounts = await active
            .GroupBy(x => x.Voucher.Type)
            .Select(g => new { Type = g.Key, Count = g.Select(x => x.Voucher.Id).Distinct().Count() })
            .ToListAsync(cancellationToken);

        var quantities = await active
            .GroupBy(x => new { x.Voucher.Type, x.Item.Product.UnitType, x.Item.EntryUnit })
            .Select(g => new
            {
                g.Key.Type,
                g.Key.UnitType,
                g.Key.EntryUnit,
                Quantity = g.Sum(x => x.Item.Quantity),
                QuantitySubUnits = g.Sum(x => x.Item.QuantitySubUnits),
                FirstUnitsPerBase = g.Select(x => x.Item.Product.UnitsPerBaseUnit).FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        int Vouchers(StockVoucherType t) => voucherCounts.Where(c => c.Type == t).Sum(c => c.Count);
        int QtyNotebooks(StockVoucherType t) =>
            quantities.Where(q => q.Type == t && q.UnitType != ProductUnitType.CopyPaper).Sum(q => q.Quantity);
        int QtyCartons(StockVoucherType t) =>
            quantities.Where(q => q.Type == t && q.UnitType == ProductUnitType.CopyPaper)
                .Sum(q => q.EntryUnit == StockEntryUnit.BaseUnit ? q.Quantity : (q.FirstUnitsPerBase > 0 ? q.Quantity / q.FirstUnitsPerBase : 0));
        int QtyReams(StockVoucherType t) =>
            quantities.Where(q => q.Type == t && q.UnitType == ProductUnitType.CopyPaper).Sum(q => q.QuantitySubUnits);

        var totals = new DaybookTotalsDto(
            Vouchers(StockVoucherType.Inbound),
            Vouchers(StockVoucherType.Outbound),
            QtyNotebooks(StockVoucherType.Inbound),
            QtyNotebooks(StockVoucherType.Outbound),
            QtyCartons(StockVoucherType.Inbound),
            QtyCartons(StockVoucherType.Outbound),
            QtyReams(StockVoucherType.Inbound),
            QtyReams(StockVoucherType.Outbound),
            Vouchers(StockVoucherType.Return),
            QtyNotebooks(StockVoucherType.Return),
            QtyCartons(StockVoucherType.Return),
            QtyReams(StockVoucherType.Return));

        // السطور بالصفحات
        var totalCount = await query.CountAsync(cancellationToken);

        var entries = await query
            .OrderByDescending(x => x.Voucher.VoucherDate)
            .ThenByDescending(x => x.Voucher.OccurredAtUtc)
            .ThenBy(x => x.Item.ProductName)
            .Skip((page - 1) * pageSize) // تم الإصلاح هنا
            .Take(pageSize)
            .Select(x => new DaybookEntryDto(
                x.Voucher.Id,
                x.Voucher.VoucherNumber,
                x.Voucher.Type,
                x.Voucher.VoucherDate,
                x.Voucher.OccurredAtUtc,
                x.Voucher.Source,
                x.Voucher.PartyName,
                x.Voucher.ReceiverName,
                x.Item.ProductId,
                x.Item.ProductName,
                x.Item.Product.Category.Name,
                x.Item.UnitLabel,
                x.Item.Quantity,
                x.Item.QuantitySubUnits,
                x.Item.BalanceAfterSubUnits,
                x.Voucher.Status,
                x.Item.Product.UnitType,
                x.Item.Product.UnitsPerBaseUnit,
                x.Item.Product.BaseUnit,
                x.Item.Product.SubUnit,
                x.Voucher.ReturnDirection,
                x.Voucher.ReturnReason))
            .ToListAsync(cancellationToken);

        // إنشاء كائن PaginationMetadata و PagedResult
        var paginationMetadata = new PaginationMetadata
        {
            CurrentPage = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };

        var pagedEntries = new PagedResult<DaybookEntryDto>
        {
            Items = entries,
            Pagination = paginationMetadata
        };

        return Result<DaybookResponse>.Success(new DaybookResponse(totals, pagedEntries));
    }
}