using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Features.Dashboard.Shared;
using El_Salam_Warehouse.Domain.Constants;

namespace El_Salam_Warehouse.Application.Features.Dashboard.Queries.GetDashboardStats;

// كويري استرجاع إحصائيات الداشبورد الحقيقية لمستودع السلام
[Permission(Permissions.Dashboard.View)]
public record GetDashboardStatsQuery() : IQuery<DashboardStatsDto>;

