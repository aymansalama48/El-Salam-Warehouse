using El_Salam_Warehouse.Application.Common.Abstractions.Core; // ضفنا الـ IDateTime
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Features.StockVouchers.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Domain.Entities.StockVouchers;
using El_Salam_Warehouse.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.StockVouchers.Queries.GetStockVouchersSummary;

// 1. الـ Query
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Vouchers.View)]
public record GetStockVouchersSummaryQuery() : IQuery<StockVouchersSummaryDto>;

// 2. الـ Handler
internal sealed class GetStockVouchersSummaryQueryHandler
    : IQueryHandler<GetStockVouchersSummaryQuery, StockVouchersSummaryDto>
{
    // الاتصال بالداتابيز (قراءة بس)
    private readonly IReadDbContext _readContext;
    private readonly IDateTime _dateTime;

    // كونستركتور (حقن IDateTime)
    public GetStockVouchersSummaryQueryHandler(IReadDbContext readContext, IDateTime dateTime)
    {
        _readContext = readContext;
        _dateTime = dateTime;
    }

    // حساب الملخص
    public async Task<Result<StockVouchersSummaryDto>> Handle(
        GetStockVouchersSummaryQuery request, CancellationToken cancellationToken)
    {
        // النهاردة وأول الشهر باستخدام IDateTime
        var today = DateOnly.FromDateTime(_dateTime.Now);
        var monthStart = new DateOnly(today.Year, today.Month, 1);

        // إذونات الشهر (عددها صغير فبنجيبها مرة واحدة ونحسب في الذاكرة)
        var monthVouchers = await _readContext.StockVouchers
            .Where(v => v.VoucherDate >= monthStart && v.VoucherDate <= today)
            .Select(v => new { v.Type, v.Status, v.VoucherDate })
            .ToListAsync(cancellationToken);

        var active = monthVouchers.Where(v => v.Status == StockVoucherStatus.Active).ToList();

        // آخر إذن اتعمل
        var last = await _readContext.StockVouchers
            .OrderByDescending(v => v.OccurredAtUtc)
            .Select(v => new { v.VoucherNumber, v.OccurredAtUtc })
            .FirstOrDefaultAsync(cancellationToken);

        var summary = new StockVouchersSummaryDto(
            InboundToday: active.Count(v => v.Type == StockVoucherType.Inbound && v.VoucherDate == today),
            OutboundToday: active.Count(v => v.Type == StockVoucherType.Outbound && v.VoucherDate == today),
            InboundThisMonth: active.Count(v => v.Type == StockVoucherType.Inbound),
            OutboundThisMonth: active.Count(v => v.Type == StockVoucherType.Outbound),
            CancelledToday: monthVouchers.Count(v => v.Status == StockVoucherStatus.Cancelled && v.VoucherDate == today),
            LastVoucherNumber: last?.VoucherNumber,
            LastVoucherAtUtc: last?.OccurredAtUtc,
            ReturnsToday: active.Count(v => v.Type == StockVoucherType.Return && v.VoucherDate == today),
            ReturnsThisMonth: active.Count(v => v.Type == StockVoucherType.Return));

        return Result<StockVouchersSummaryDto>.Success(summary);
    }
}