using El_Salam_Warehouse.Api.Contracts.StockVouchers;
using El_Salam_Warehouse.Api.Controllers.Base;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.CurrentUser;
using El_Salam_Warehouse.Application.Features.StockVouchers.Commands.CancelStockVoucher;
using El_Salam_Warehouse.Application.Features.StockVouchers.Commands.CreateStockVoucher;
using El_Salam_Warehouse.Application.Features.StockVouchers.Queries.GetStockVoucherById;
using El_Salam_Warehouse.Application.Features.StockVouchers.Queries.GetStockVouchers;
using El_Salam_Warehouse.Application.Features.StockVouchers.Queries.GetStockVouchersSummary;
using El_Salam_Warehouse.Domain.Constants;
using El_Salam_Warehouse.Domain.Entities.StockVouchers;
using El_Salam_Warehouse.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Api.Controllers;

// إذونات الوارد والصرف
[Microsoft.AspNetCore.Authorization.Authorize]
[Route("api/stock-vouchers")]
public class StockVouchersController : BaseApiController
{
    // 1. قايمة الإذونات بالفلاتر
    [HttpGet]
    [Permission(Permissions.Vouchers.View)]
    public async Task<IResult> GetAll(
        [FromQuery] StockVoucherType? type,
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        [FromQuery] VoucherSource? source,
        [FromQuery] StockVoucherStatus? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = new GetStockVouchersQuery(type, fromDate, toDate, source, status, search, page, pageSize);
        var result = await Sender.Send(query);
        return HandleResult(result);
    }

    // 2. الملخص (الشريط الجانبي + الكروت)
    [HttpGet("summary")]
    [Permission(Permissions.Vouchers.View)]
    public async Task<IResult> GetSummary()
    {
        var result = await Sender.Send(new GetStockVouchersSummaryQuery());
        return HandleResult(result);
    }

    // 3. تفاصيل إذن (للعرض والطباعة)
    [HttpGet("{id:guid}")]
    [Permission(Permissions.Vouchers.View)]
    public async Task<IResult> GetById(Guid id)
    {
        var result = await Sender.Send(new GetStockVoucherByIdQuery(id));
        return HandleResult(result);
    }

    // 4. إنشاء إذن
    [HttpPost]
    public async Task<IResult> Create(
        [FromBody] CreateStockVoucherRequest request,
        [FromServices] ICurrentUser currentUser,
        [FromServices] IPermissionService permissionService,
        CancellationToken cancellationToken)
    {
        var requiredPermission = request.Type switch
        {
            StockVoucherType.Inbound => Permissions.Vouchers.CreateInbound,
            StockVoucherType.Outbound => Permissions.Vouchers.CreateOutbound,
            StockVoucherType.Return => Permissions.Vouchers.CreateReturn,
            _ => Permissions.Vouchers.CreateInbound
        };

        if (currentUser.UserId.HasValue)
        {
            var hasPerm = await permissionService.HasPermissionAsync(currentUser.UserId.Value, requiredPermission, cancellationToken);
            if (!hasPerm)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status403Forbidden,
                    title: "Forbidden",
                    detail: $"عفواً، لا تمتلك الصلاحية المطلوبة ({requiredPermission}) لإصدار هذا الإذن.");
            }
        }

        var command = new CreateStockVoucherCommand(
            request.Type,
            request.Date,
            request.Source,
            request.PartyName,
            request.ReceiverName,
            request.DelivererName,
            request.Notes,
            request.Items.Select(i => new StockVoucherItemInput(i.ProductId, i.Quantity, i.EntryUnit)).ToList(),
            request.ReturnDirection,
            request.ReturnReason);

        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    // 5. إلغاء إذن
    [HttpPost("{id:guid}/cancel")]
    [Permission(Permissions.Vouchers.Cancel)]
    public async Task<IResult> Cancel(Guid id, [FromBody] CancelStockVoucherRequest request)
    {
        var result = await Sender.Send(new CancelStockVoucherCommand(id, request.Reason));
        return HandleResult(result);
    }

    // 6. تحميل وطباعة ملف PDF للإذن
    [HttpGet("{id:guid}/pdf")]
    [Permission(Permissions.Vouchers.View)]
    public async Task<IResult> GetPdf(Guid id)
    {
        var result = await Sender.Send(new El_Salam_Warehouse.Application.Features.StockVouchers.Queries.GetStockVoucherPdf.GetStockVoucherPdfQuery(id));
        if (!result.IsSuccess) return HandleResult(result);
        var file = result.Data;
        return Results.File(file.Content, file.ContentType, file.FileName);
    }
}
