using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Features.Notifications.Shared;
using System.Collections.Generic;

namespace El_Salam_Warehouse.Application.Features.Notifications.Queries.GetNotifications;

/// <summary>
/// استعلام جلب الإشعارات والتنبيهات الحية للمستودع (النواقص والأذونات الحديثة)
/// </summary>
public sealed record GetNotificationsQuery(int Limit = 20) : IQuery<List<NotificationDto>>;

