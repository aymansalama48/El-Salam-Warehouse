using El_Salam_Warehouse.Application.Common.Abstractions.Core;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Common.Abstractions.Reports;
using El_Salam_Warehouse.Application.Common.Models;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Entities.StockVouchers;
using El_Salam_Warehouse.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.Daybook.Queries.GetDaybookReport;

// تم إضافة الفلاتر الكاملة للتقرير (النوع، المصدر، نوع الصنف، الفئة)
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Daybook.Export)]
public record GetDaybookReportQuery(
    DateOnly? FromDate,
    DateOnly? ToDate,
    StockVoucherType? Type = null,
    VoucherSource? Source = null,
    ProductUnitType? UnitType = null,
    Guid? CategoryId = null) : IQuery<ReportFileDto>;

internal sealed class GetDaybookReportQueryHandler : IQueryHandler<GetDaybookReportQuery, ReportFileDto>
{
    private const int MaxDays = 366;
    private static readonly Error PeriodTooLong = new("Report.PeriodTooLong", "الفترة المحددة طويلة جداً، الحد الأقصى سنة واحدة.", ErrorType.Conflict);

    private readonly IReadDbContext _readContext;
    private readonly IReportGenerator _reportGenerator;
    private readonly IDateTime _dateTime;

    public GetDaybookReportQueryHandler(
        IReadDbContext readContext,
        IReportGenerator reportGenerator,
        IDateTime dateTime)
    {
        _readContext = readContext;
        _reportGenerator = reportGenerator;
        _dateTime = dateTime;
    }

    public async Task<Result<ReportFileDto>> Handle(GetDaybookReportQuery request, CancellationToken cancellationToken)
    {
        var to = request.ToDate ?? DateOnly.FromDateTime(_dateTime.Now);
        var from = request.FromDate ?? to;
        if (from > to) (from, to) = (to, from);

        if (to.DayNumber - from.DayNumber > MaxDays) return Result<ReportFileDto>.Failure(PeriodTooLong);

        // بناء استعلام الداتابيز
        var query = _readContext.StockVouchers
            .Where(v => v.Status == StockVoucherStatus.Active && v.VoucherDate >= from && v.VoucherDate <= to);

        // تطبيق فلتر النوع (وارد / منصرف)
        if (request.Type.HasValue)
        {
            query = query.Where(v => v.Type == request.Type.Value);
        }

        // تطبيق فلتر المصدر (صالة الإنتاج / جهات خارجية)
        if (request.Source.HasValue)
        {
            query = query.Where(v => v.Source == request.Source.Value);
        }

        var rowsQuery = query
            .SelectMany(v => v.Items, (v, i) => new
            {
                v.VoucherDate,
                v.OccurredAtUtc,
                v.VoucherNumber,
                v.Type,
                v.Source,
                v.PartyName,
                v.ReceiverName,
                i.ProductName,
                i.UnitLabel,
                i.EntryUnit,
                i.Quantity,
                i.Product.UnitType,
                i.Product.CategoryId,
                i.QuantitySubUnits,
                UnitsPerBaseUnit = i.Product.UnitsPerBaseUnit
            });

        // فلترة بنوع الصنف (ورق تصوير / كشاكيل...)
        if (request.UnitType.HasValue)
        {
            rowsQuery = rowsQuery.Where(r => r.UnitType == request.UnitType.Value);
        }

        // فلترة بالفئة المحددة
        if (request.CategoryId.HasValue)
        {
            rowsQuery = rowsQuery.Where(r => r.CategoryId == request.CategoryId.Value);
        }

        var rows = await rowsQuery
            .OrderBy(x => x.VoucherDate)
            .ThenBy(x => x.OccurredAtUtc)
            .ThenBy(x => x.ProductName)
            .ToListAsync(cancellationToken);

        int Vouchers(StockVoucherType t) => rows.Where(r => r.Type == t).Select(r => r.VoucherNumber).Distinct().Count();
        int QtyNotebooks(StockVoucherType t) => rows.Where(r => r.Type == t && r.UnitType != ProductUnitType.CopyPaper).Sum(r => r.Quantity);
        int QtyReams(StockVoucherType t) => rows.Where(r => r.Type == t && r.UnitType == ProductUnitType.CopyPaper).Sum(r => r.QuantitySubUnits);
        int QtyCartons(StockVoucherType t) => rows.Where(r => r.Type == t && r.UnitType == ProductUnitType.CopyPaper).Sum(r => r.EntryUnit == StockEntryUnit.BaseUnit ? r.Quantity : (r.UnitsPerBaseUnit > 0 ? r.Quantity / r.UnitsPerBaseUnit : 0));

        var totals = new DaybookReportTotals(
            Vouchers(StockVoucherType.Inbound), Vouchers(StockVoucherType.Outbound),
            QtyNotebooks(StockVoucherType.Inbound), QtyNotebooks(StockVoucherType.Outbound),
            QtyCartons(StockVoucherType.Inbound), QtyCartons(StockVoucherType.Outbound),
            QtyReams(StockVoucherType.Inbound), QtyReams(StockVoucherType.Outbound),
            Vouchers(StockVoucherType.Return),
            QtyNotebooks(StockVoucherType.Return),
            QtyCartons(StockVoucherType.Return),
            QtyReams(StockVoucherType.Return));

        var days = rows.GroupBy(r => r.VoucherDate).Select(g => new DaybookReportDay(
            g.Key,
            g.Select(r => new DaybookReportRow(
                r.VoucherNumber, r.Type, r.Source == VoucherSource.ProductionHall ? "صالة الإنتاج" : (string.IsNullOrWhiteSpace(r.PartyName) ? "-" : r.PartyName),
                r.ReceiverName, r.ProductName, r.UnitLabel, r.Quantity,
                r.UnitType, r.QuantitySubUnits, r.UnitsPerBaseUnit)).ToList())).ToList();

        // تحديد اسم التقرير وتفاصيل الفلتر بناءً على المدخلات
        var reportTitle = request.Type switch
        {
            StockVoucherType.Inbound => "حركات الوارد",
            StockVoucherType.Outbound => "حركات الصرف",
            StockVoucherType.Return => "حركات المرتجع",
            _ => "جميع الحركات (الوارد والصرف والمرتجع)"
        };

        var filterParts = new List<string>();

        if (request.Source.HasValue)
        {
            filterParts.Add(request.Source.Value == VoucherSource.ProductionHall 
                ? "صالة الإنتاج والتجليد" 
                : "جهات خارجية / موردين وعملاء");
        }

        if (request.UnitType.HasValue)
        {
            filterParts.Add(request.UnitType.Value switch
            {
                ProductUnitType.CopyPaper => "ورق تصوير",
                ProductUnitType.Notebook => "كشاكيل",
                ProductUnitType.Booklet => "كراريس",
                _ => ""
            });
        }
        else if (request.CategoryId.HasValue)
        {
            var category = await _readContext.Categories.FirstOrDefaultAsync(c => c.Id == request.CategoryId.Value, cancellationToken);
            if (category != null)
            {
                filterParts.Add($"فئة: {category.Name}");
            }
        }

        var filterDetails = filterParts.Count > 0 ? string.Join(" • ", filterParts.Where(p => !string.IsNullOrEmpty(p))) : null;

        var model = new DaybookReportModel(from, to, _dateTime.Now, reportTitle, totals, days, filterDetails);
        var bytes = _reportGenerator.GenerateDaybookReport(model);

        return Result<ReportFileDto>.Success(new ReportFileDto(bytes, $"daybook_{from:yyyy-MM-dd}_{to:yyyy-MM-dd}.pdf", "application/pdf"));
    }
}