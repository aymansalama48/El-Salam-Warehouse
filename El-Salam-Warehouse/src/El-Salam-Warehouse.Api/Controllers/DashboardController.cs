using System.Threading.Tasks;
using El_Salam_Warehouse.Api.Controllers.Base;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Application.Features.Dashboard.Queries.GetDashboardStats;
using El_Salam_Warehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace El_Salam_Warehouse.Api.Controllers;

// وحدة التحكم بالداشبورد والإحصائيات الحية للوحة التحكم الرئيسية
[Authorize]
[Route("api/dashboard")]
public class DashboardController : BaseApiController
{
    // جلب الإحصائيات الشاملة الحقيقية للوحة التحكم (مخزون، حركات، كروت، وتنبيهات)
    [HttpGet("stats")]
    [Permission(Permissions.Dashboard.View)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IResult> GetStats()
    {
        var query = new GetDashboardStatsQuery();
        var result = await Sender.Send(query);
        return HandleResult(result);
    }
}
