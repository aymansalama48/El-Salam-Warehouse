using El_Salam_Warehouse.Api.Controllers.Base;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Application.Features.Daybook.Queries.GetDaybook;
using El_Salam_Warehouse.Application.Features.Daybook.Queries.GetDaybookReport;
using El_Salam_Warehouse.Domain.Constants;
using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Entities.StockVouchers;
using El_Salam_Warehouse.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Api.Controllers;

// دفتر اليومية
[Microsoft.AspNetCore.Authorization.Authorize]
[Route("api/daybook")]
public class DaybookController : BaseApiController
{
    // دفتر اليومية بالفلاتر (الافتراضي: النهاردة)
    [HttpGet]
    [Permission(Permissions.Daybook.View)]
    public async Task<IResult> Get(
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        [FromQuery] StockVoucherType? type,
        [FromQuery] Guid? productId,
        [FromQuery] Guid? categoryId,
        [FromQuery] StockVoucherStatus? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = new GetDaybookQuery(fromDate, toDate, type, productId, categoryId, status, search, page, pageSize);
        var result = await Sender.Send(query);
        return HandleResult(result);
    }

    // تقرير دفتر اليومية PDF (بفلترة كاملة: تاريخ، نوع الحركة، المصدر، نوع الصنف، الفئة)
    [HttpGet("report")]
    [Permission(Permissions.Daybook.Export)]
    public async Task<IResult> Report(
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        [FromQuery] StockVoucherType? type,
        [FromQuery] VoucherSource? source,
        [FromQuery] ProductUnitType? unitType,
        [FromQuery] Guid? categoryId)
    {
        var result = await Sender.Send(new GetDaybookReportQuery(fromDate, toDate, type, source, unitType, categoryId));

        if (!result.IsSuccess) return HandleResult(result);

        var file = result.Data;
        return Results.File(file.Content, file.ContentType, file.FileName);
    }
}
