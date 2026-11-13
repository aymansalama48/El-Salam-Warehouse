using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Common.Pagination; // تم تغيير الـ namespace عشان الـ PagedResult
using El_Salam_Warehouse.Application.Features.StockVouchers.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Domain.Entities.StockVouchers;
using El_Salam_Warehouse.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.StockVouchers.Queries.GetStockVouchers;

// 1. الـ Query (بالفلاتر والصفحات) - تم تعديلها لـ PagedResult
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Vouchers.View)]
public record GetStockVouchersQuery(
    StockVoucherType? Type,
    DateOnly? FromDate,
    DateOnly? ToDate,
    VoucherSource? Source,
    StockVoucherStatus? Status,
    string? Search,
    int Page = 1,
    int PageSize = 20) : IQuery<PagedResult<StockVoucherListItemDto>>;

// 2. الـ Handler - تم تعديلها لـ PagedResult
internal sealed class GetStockVouchersQueryHandler
    : IQueryHandler<GetStockVouchersQuery, PagedResult<StockVoucherListItemDto>>
{
    // الاتصال بالداتابيز (قراءة بس)
    private readonly IReadDbContext _readContext;

    // كونستركتور
    public GetStockVouchersQueryHandler(IReadDbContext readContext)
    {
        _readContext = readContext;
    }

    // تنفيذ البحث
    public async Task<Result<PagedResult<StockVoucherListItemDto>>> Handle(
        GetStockVouchersQuery request, CancellationToken cancellationToken)
    {
        var page = Math.Max(request.Page, 1);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        var query = _readContext.StockVouchers.AsQueryable();

        // فلتر النوع
        if (request.Type.HasValue)
            query = query.Where(v => v.Type == request.Type.Value);

        // فلتر التاريخ
        if (request.FromDate.HasValue)
            query = query.Where(v => v.VoucherDate >= request.FromDate.Value);
        if (request.ToDate.HasValue)
            query = query.Where(v => v.VoucherDate <= request.ToDate.Value);

        // فلتر المصدر والحالة
        if (request.Source.HasValue)
            query = query.Where(v => v.Source == request.Source.Value);
        if (request.Status.HasValue)
            query = query.Where(v => v.Status == request.Status.Value);

        // البحث (رقم الإذن / المستلم / الجايب / الجهة / اسم منتج)
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim();
            query = query.Where(v =>
                v.VoucherNumber.Contains(s) ||
                v.ReceiverName.Contains(s) ||
                (v.DelivererName != null && v.DelivererName.Contains(s)) ||
                (v.PartyName != null && v.PartyName.Contains(s)) ||
                v.Items.Any(i => i.ProductName.Contains(s)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(v => v.VoucherDate)
            .ThenByDescending(v => v.OccurredAtUtc)
            .Skip((page - 1) * pageSize) // تم الإصلاح هنا
            .Take(pageSize)
            .Select(v => new StockVoucherListItemDto(
                v.Id,
                v.VoucherNumber,
                v.Type,
                v.VoucherDate,
                v.OccurredAtUtc,
                v.Source,
                v.PartyName,
                v.ReceiverName,
                v.DelivererName,
                v.Status,
                v.Items.Count(),
                v.ReturnDirection,
                v.ReturnReason))
            .ToListAsync(cancellationToken);

        // إنشاء كائن PaginationMetadata و PagedResult
        var paginationMetadata = new PaginationMetadata
        {
            CurrentPage = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };

        var pagedResult = new PagedResult<StockVoucherListItemDto>
        {
            Items = items,
            Pagination = paginationMetadata
        };

        return Result<PagedResult<StockVoucherListItemDto>>.Success(pagedResult);
    }
}