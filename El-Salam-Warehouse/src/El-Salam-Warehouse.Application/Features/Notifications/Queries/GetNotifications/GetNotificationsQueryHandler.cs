using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using El_Salam_Warehouse.Application.Common.Abstractions.Core;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Features.Notifications.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Domain.Entities.StockVouchers;
using El_Salam_Warehouse.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.Notifications.Queries.GetNotifications;

/// <summary>
/// هاندلر تجميع الإشعارات الحية للمستودع (النواقص والأذونات الملغاة والحديثة)
/// </summary>
internal sealed class GetNotificationsQueryHandler
    : IQueryHandler<GetNotificationsQuery, List<NotificationDto>>
{
    private readonly IReadDbContext _readContext;
    private readonly IDateTime _dateTime;

    public GetNotificationsQueryHandler(IReadDbContext readContext, IDateTime dateTime)
    {
        _readContext = readContext;
        _dateTime = dateTime;
    }

    public async Task<Result<List<NotificationDto>>> Handle(
        GetNotificationsQuery request,
        CancellationToken cancellationToken)
    {
        var notifications = new List<NotificationDto>();

        // 1. تنبيهات النواقص والنفاد من جدول المنتجات
        var products = await _readContext.Products
            .Include(p => p.Category)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        static DateTime EnsureUtc(DateTime dt) =>
            dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);

        foreach (var p in products)
        {
            var isOutOfStock = p.TotalSubUnitStock <= 0;
            var thresholdSubUnits = (p.LowStockThresholdUnit == StockEntryUnit.BaseUnit && p.UnitsPerBaseUnit > 0)
                ? p.LowStockThreshold * p.UnitsPerBaseUnit
                : p.LowStockThreshold;
            var isLowStock = !isOutOfStock && thresholdSubUnits > 0 && p.TotalSubUnitStock <= thresholdSubUnits;

            if (isOutOfStock)
            {
                var eventTime = p.UpdatedAt ?? p.CreatedAt;
                notifications.Add(new NotificationDto(
                    Id: $"prod-out-{p.Id}",
                    Title: $"نفاد رصيد: {p.Name}",
                    Message: $"الصنف منعدم الرصيد تماماً (0 {p.EntryUnitLabel}) في قسم {p.Category?.Name ?? "المستودع"}. يتطلب أمر إنتاج/توريد عاجل.",
                    Type: "danger",
                    OccurredAtUtc: EnsureUtc(eventTime == default ? _dateTime.Now : eventTime),
                    ReferenceNumber: null,
                    LinkUrl: "/finished-goods",
                    IsCritical: true
                ));
            }
            else if (isLowStock)
            {
                var fullBase = p.UnitsPerBaseUnit > 0 ? p.TotalSubUnitStock / p.UnitsPerBaseUnit : 0;
                var eventTime = p.UpdatedAt ?? p.CreatedAt;
                notifications.Add(new NotificationDto(
                    Id: $"prod-low-{p.Id}",
                    Title: $"تنبيه رصيد حرج: {p.Name}",
                    Message: $"المتبقي {fullBase} {p.BaseUnit} فقط بالمستودع (إجمالي: {p.TotalSubUnitStock} {p.SubUnit}). اقترب المخزون من حد النقص.",
                    Type: "warning",
                    OccurredAtUtc: EnsureUtc(eventTime == default ? _dateTime.Now : eventTime),
                    ReferenceNumber: null,
                    LinkUrl: "/finished-goods",
                    IsCritical: false
                ));
            }
        }

        // 2. أحدث الأذونات المسجلة في المستودع (أحدث 15 إذن)
        var recentVouchers = await _readContext.StockVouchers
            .Include(v => v.Items)
            .AsNoTracking()
            .OrderByDescending(v => v.OccurredAtUtc)
            .Take(15)
            .ToListAsync(cancellationToken);

        foreach (var v in recentVouchers)
        {
            if (v.Status == StockVoucherStatus.Cancelled)
            {
                notifications.Add(new NotificationDto(
                    Id: $"voucher-cancel-{v.Id}",
                    Title: $"إلغاء إذن #{v.VoucherNumber}",
                    Message: $"تم إلغاء الإذن {(string.IsNullOrWhiteSpace(v.CancelReason) ? "" : $"بسبب: {v.CancelReason}")} وتم عكس الأرصدة بالمخزن.",
                    Type: "cancelled",
                    OccurredAtUtc: EnsureUtc(v.CancelledAtUtc ?? v.OccurredAtUtc),
                    ReferenceNumber: v.VoucherNumber,
                    LinkUrl: v.Type == StockVoucherType.Inbound ? "/inbound" : "/outbound",
                    IsCritical: false
                ));
            }
            else if (v.Type == StockVoucherType.Inbound)
            {
                var sourceText = v.Source == VoucherSource.ProductionHall
                    ? "صالة الإنتاج والتجليد"
                    : (string.IsNullOrWhiteSpace(v.PartyName) ? "جهة خارجية" : v.PartyName);

                notifications.Add(new NotificationDto(
                    Id: $"voucher-in-{v.Id}",
                    Title: $"إذن وارد جديد #{v.VoucherNumber}",
                    Message: $"تم استلام وتوريد {v.Items.Count} أصناف من {sourceText} بواسطة {v.ReceiverName}.",
                    Type: "inbound",
                    OccurredAtUtc: EnsureUtc(v.OccurredAtUtc),
                    ReferenceNumber: v.VoucherNumber,
                    LinkUrl: "/inbound",
                    IsCritical: false
                ));
            }
            else if (v.Type == StockVoucherType.Outbound)
            {
                var partyText = string.IsNullOrWhiteSpace(v.PartyName) ? "العميل" : v.PartyName;
                notifications.Add(new NotificationDto(
                    Id: $"voucher-out-{v.Id}",
                    Title: $"إذن صرف بضاعة #{v.VoucherNumber}",
                    Message: $"تم صرف {v.Items.Count} أصناف لصالح {partyText} وتسليمها بنجاح.",
                    Type: "outbound",
                    OccurredAtUtc: EnsureUtc(v.OccurredAtUtc),
                    ReferenceNumber: v.VoucherNumber,
                    LinkUrl: "/outbound",
                    IsCritical: false
                ));
            }
        }

        // الترتيب: الإشعارات الحرجة أولاً، ثم الأحدث تاريخاً
        var result = notifications
            .OrderByDescending(n => n.IsCritical)
            .ThenByDescending(n => n.OccurredAtUtc)
            .Take(request.Limit)
            .ToList();

        return Result<List<NotificationDto>>.Success(result);
    }
}

