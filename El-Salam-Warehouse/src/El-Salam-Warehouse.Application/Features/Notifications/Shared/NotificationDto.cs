using System;

namespace El_Salam_Warehouse.Application.Features.Notifications.Shared;

/// <summary>
/// نموذج الإشعار الحي المعروض في شريط الإشعارات
/// </summary>
public record NotificationDto(
    string Id,
    string Title,
    string Message,
    string Type, // "danger", "warning", "inbound", "outbound", "cancelled"
    DateTime OccurredAtUtc,
    string? ReferenceNumber,
    string? LinkUrl,
    bool IsCritical
);

