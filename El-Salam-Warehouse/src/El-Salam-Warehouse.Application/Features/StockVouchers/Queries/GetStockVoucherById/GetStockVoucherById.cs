using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.UserManagement;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Features.StockVouchers.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.StockVouchers.Queries.GetStockVoucherById;

// 1. الـ Query
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Vouchers.View)]
public record GetStockVoucherByIdQuery(Guid Id) : IQuery<StockVoucherDto>;

// 2. الـ Handler
internal sealed class GetStockVoucherByIdQueryHandler : IQueryHandler<GetStockVoucherByIdQuery, StockVoucherDto>
{
    private readonly IReadDbContext _readContext;
    private readonly IUserManagementService _userManagementService;

    public GetStockVoucherByIdQueryHandler(IReadDbContext readContext, IUserManagementService userManagementService)
    {
        _readContext = readContext;
        _userManagementService = userManagementService;
    }

    // جلب الإذن بتفاصيله
    public async Task<Result<StockVoucherDto>> Handle(GetStockVoucherByIdQuery request, CancellationToken cancellationToken)
    {
        var rawVoucher = await _readContext.StockVouchers
            .Where(v => v.Id == request.Id)
            .Select(v => new
            {
                v.Id,
                v.VoucherNumber,
                v.Type,
                v.VoucherDate,
                v.OccurredAtUtc,
                v.Source,
                v.PartyName,
                v.ReceiverName,
                v.DelivererName,
                v.Notes,
                v.Status,
                v.CancelReason,
                v.CancelledAtUtc,
                Items = v.Items.Select(i => new StockVoucherItemDto(
                    i.ProductId,
                    i.ProductName,
                    i.UnitLabel,
                    i.EntryUnit,
                    i.Quantity,
                    i.QuantitySubUnits,
                    i.BalanceBeforeSubUnits,
                    i.BalanceAfterSubUnits)).ToList(),
                v.CreatedAt,
                v.CreatedBy,
                v.UpdatedBy
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (rawVoucher is null)
        {
            return Result<StockVoucherDto>.Failure(StockVoucherErrors.NotFound);
        }

        var userIds = new List<Guid>();
        if (rawVoucher.CreatedBy.HasValue) userIds.Add(rawVoucher.CreatedBy.Value);
        // عند الإلغاء، UpdatedBy يمثل المستخدم الذي قام بإلغاء الإذن
        if (rawVoucher.Status == StockVoucherStatus.Cancelled && rawVoucher.UpdatedBy.HasValue)
        {
            userIds.Add(rawVoucher.UpdatedBy.Value);
        }

        var usersMap = new Dictionary<Guid, string>();
        if (userIds.Count > 0)
        {
            var users = await _userManagementService.GetUsersByIdsAsync(userIds.Distinct(), cancellationToken);
            foreach (var u in users)
            {
                var personName = !string.IsNullOrWhiteSpace(u.FullName)
                    ? u.FullName
                    : (!string.IsNullOrWhiteSpace(u.FirstName) ? $"{u.FirstName} {u.LastName}".Trim() : u.Email);
                usersMap[u.Id] = personName;
            }
        }

        string? defaultPersonName = null;
        if (!rawVoucher.CreatedBy.HasValue)
        {
            var adminUser = (await _userManagementService.GetAllUsersAsync(1, 5, "Admin", null, cancellationToken)).Items.FirstOrDefault()
                ?? (await _userManagementService.GetAllUsersAsync(1, 5, null, null, cancellationToken)).Items.FirstOrDefault();
            if (adminUser != null)
            {
                defaultPersonName = !string.IsNullOrWhiteSpace(adminUser.FullName)
                    ? adminUser.FullName
                    : (!string.IsNullOrWhiteSpace(adminUser.FirstName) ? $"{adminUser.FirstName} {adminUser.LastName}".Trim() : adminUser.Email);
            }
        }

        var createdByName = rawVoucher.CreatedBy.HasValue && usersMap.TryGetValue(rawVoucher.CreatedBy.Value, out var cb)
            ? cb
            : (defaultPersonName ?? "Ayman Salama");
        var cancelledByName = (rawVoucher.Status == StockVoucherStatus.Cancelled && rawVoucher.UpdatedBy.HasValue && usersMap.TryGetValue(rawVoucher.UpdatedBy.Value, out var can))
            ? can
            : (rawVoucher.Status == StockVoucherStatus.Cancelled ? (defaultPersonName ?? "Ayman Salama") : null);

        var voucher = new StockVoucherDto(
            rawVoucher.Id,
            rawVoucher.VoucherNumber,
            rawVoucher.Type,
            rawVoucher.VoucherDate,
            rawVoucher.OccurredAtUtc,
            rawVoucher.Source,
            rawVoucher.PartyName,
            rawVoucher.ReceiverName,
            rawVoucher.DelivererName,
            rawVoucher.Notes,
            rawVoucher.Status,
            rawVoucher.CancelReason,
            rawVoucher.CancelledAtUtc,
            rawVoucher.Items,
            rawVoucher.CreatedAt,
            createdByName,
            cancelledByName);

        return Result<StockVoucherDto>.Success(voucher);
    }
}
