using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using El_Salam_Warehouse.Application.Common.Abstractions.Core;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.UserManagement;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Common.Abstractions.Reports;
using El_Salam_Warehouse.Application.Common.Models;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Domain.Entities.StockVouchers;
using El_Salam_Warehouse.Domain.Enums;
using El_Salam_Warehouse.Application.Features.StockVouchers.Shared;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.StockVouchers.Queries.GetStockVoucherPdf;

[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Vouchers.View)]
public record GetStockVoucherPdfQuery(Guid Id) : IQuery<ReportFileDto>;

internal sealed class GetStockVoucherPdfQueryHandler : IQueryHandler<GetStockVoucherPdfQuery, ReportFileDto>
{
    private readonly IReadDbContext _readContext;
    private readonly IReportGenerator _reportGenerator;
    private readonly IUserManagementService _userManagementService;
    private readonly IDateTime _dateTime;

    public GetStockVoucherPdfQueryHandler(
        IReadDbContext readContext,
        IReportGenerator reportGenerator,
        IUserManagementService userManagementService,
        IDateTime dateTime)
    {
        _readContext = readContext;
        _reportGenerator = reportGenerator;
        _userManagementService = userManagementService;
        _dateTime = dateTime;
    }

    public async Task<Result<ReportFileDto>> Handle(GetStockVoucherPdfQuery request, CancellationToken cancellationToken)
    {
        var voucher = await _readContext.StockVouchers
            .Include(v => v.Items)
            .FirstOrDefaultAsync(v => v.Id == request.Id, cancellationToken);

        if (voucher is null)
        {
            return Result<ReportFileDto>.Failure(StockVoucherErrors.NotFound);
        }

        // جلب أسماء المستخدمين (المنشئ والملغي)
        var userIds = new List<Guid>();
        if (voucher.CreatedBy.HasValue) userIds.Add(voucher.CreatedBy.Value);
        if (voucher.Status == StockVoucherStatus.Cancelled && voucher.UpdatedBy.HasValue)
        {
            userIds.Add(voucher.UpdatedBy.Value);
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
        if (!voucher.CreatedBy.HasValue)
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

        var createdByName = voucher.CreatedBy.HasValue && usersMap.TryGetValue(voucher.CreatedBy.Value, out var cb)
            ? cb
            : (defaultPersonName ?? "Ayman Salama");

        var cancelledByName = (voucher.Status == StockVoucherStatus.Cancelled && voucher.UpdatedBy.HasValue && usersMap.TryGetValue(voucher.UpdatedBy.Value, out var can))
            ? can
            : (voucher.Status == StockVoucherStatus.Cancelled ? (defaultPersonName ?? "Ayman Salama") : null);

        // جلب تفاصيل المنتجات والفئات للأصناف الموجودة بالإذن
        var productIds = voucher.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _readContext.Products
            .Include(p => p.Category)
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        var pdfItems = new List<StockVoucherPdfItem>();
        int index = 1;
        foreach (var it in voucher.Items)
        {
            products.TryGetValue(it.ProductId, out var prod);

            var categoryName = prod?.Category?.Name ?? "عام";
            var baseUnit = prod?.BaseUnit ?? (it.EntryUnit == StockEntryUnit.BaseUnit ? "كرتونة" : "باكو");
            var subUnit = prod?.SubUnit ?? (baseUnit == "كرتونة" ? "رزمة" : "كشكول");
            var unitsPerBase = prod?.UnitsPerBaseUnit ?? (baseUnit == "كرتونة" ? 5 : 10);

            int fullBase;
            int remSub;
            int totalSub;

            if (it.EntryUnit == StockEntryUnit.BaseUnit)
            {
                fullBase = it.Quantity;
                remSub = 0;
                totalSub = it.QuantitySubUnits > 0 ? it.QuantitySubUnits : it.Quantity * unitsPerBase;
            }
            else
            {
                fullBase = unitsPerBase > 0 ? it.Quantity / unitsPerBase : 0;
                remSub = unitsPerBase > 0 ? it.Quantity % unitsPerBase : 0;
                totalSub = it.Quantity;
            }

            pdfItems.Add(new StockVoucherPdfItem(
                Index: index++,
                ProductName: it.ProductName,
                CategoryName: categoryName,
                UnitLabel: it.UnitLabel,
                Quantity: it.Quantity,
                FullBaseUnits: fullBase,
                RemainingSubUnits: remSub,
                TotalSubUnits: totalSub,
                BaseUnit: baseUnit,
                SubUnit: subUnit
            ));
        }

        var partyName = voucher.Source == VoucherSource.ProductionHall
            ? "صالة الإنتاج والتجليد"
            : (!string.IsNullOrWhiteSpace(voucher.PartyName) ? voucher.PartyName : (voucher.Type == StockVoucherType.Shortage ? "لجنة الجرد والمطابقة" : (voucher.Type == StockVoucherType.Return ? "عميل / جهة المرتجع" : (voucher.Type == StockVoucherType.Inbound ? "مورد خارجي" : "عميل تجاري"))));

        var pdfModel = new StockVoucherPdfModel(
            VoucherId: voucher.Id,
            VoucherNumber: voucher.VoucherNumber,
            Type: voucher.Type,
            Status: voucher.Status,
            Source: voucher.Source,
            VoucherDate: voucher.VoucherDate,
            OccurredAtCairo: voucher.OccurredAtUtc.ToLocalTime(),
            PartyName: partyName,
            ReceiverName: voucher.ReceiverName,
            DelivererName: voucher.DelivererName,
            Notes: voucher.Notes,
            CreatedByName: createdByName,
            CancelledByName: cancelledByName,
            CancelledAtCairo: voucher.CancelledAtUtc?.ToLocalTime(),
            CancellationReason: voucher.CancelReason,
            Items: pdfItems,
            ReturnDirection: voucher.ReturnDirection,
            ReturnReason: voucher.ReturnReason,
            ShortageReason: voucher.ShortageReason
        );

        var bytes = _reportGenerator.GenerateStockVoucherPdf(pdfModel);
        var fileName = $"voucher_{voucher.VoucherNumber}.pdf";

        return Result<ReportFileDto>.Success(new ReportFileDto(bytes, fileName, "application/pdf"));
    }
}
