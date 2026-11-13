using El_Salam_Warehouse.Api.Controllers.Base;
using El_Salam_Warehouse.Application.Features.Notifications.Queries.GetNotifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Api.Controllers;

/// <summary>
/// Controller نظام الإشعارات والتنبيهات الحية للمستودع (النواقص والأذونات)
/// </summary>
[Authorize]
[Route("api/notifications")]
public class NotificationsController : BaseApiController
{
    /// <summary>
    /// جلب قائمة الإشعارات والتنبيهات الحية
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IResult> GetAll([FromQuery] int limit = 20, CancellationToken cancellationToken = default)
    {
        var query = new GetNotificationsQuery(limit);
        var result = await Sender.Send(query, cancellationToken);
        return HandleResult(result);
    }
}

