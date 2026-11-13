using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using El_Salam_Warehouse.Application.Common.Abstractions.Core;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.UserManagement;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Common.Abstractions.Reports;
using El_Salam_Warehouse.Application.Common.Models;
using El_Salam_Warehouse.Application.Features.Products.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.Products.Queries.GetProductPdf;

[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Products.View)]
public record GetProductPdfQuery(Guid Id) : IQuery<ReportFileDto>;

internal sealed class GetProductPdfQueryHandler : IQueryHandler<GetProductPdfQuery, ReportFileDto>
{
    private readonly IReadDbContext _readContext;
    private readonly IReportGenerator _reportGenerator;
    private readonly IUserManagementService _userManagementService;
    private readonly IDateTime _dateTime;

    public GetProductPdfQueryHandler(
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

    public async Task<Result<ReportFileDto>> Handle(GetProductPdfQuery request, CancellationToken cancellationToken)
    {
        var rawProduct = await _readContext.Products
            .Include(p => p.Category)
            .Where(p => p.Id == request.Id)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.CategoryId,
                CategoryName = p.Category != null ? p.Category.Name : "عام",
                CategoryColor = p.Category != null ? p.Category.ColorHex : null,
                p.BaseUnit,
                p.SubUnit,
                p.UnitsPerBaseUnit,
                p.EntryUnit,
                p.UnitType,
                p.TotalSubUnitStock,
                FullBaseUnits = p.UnitsPerBaseUnit > 0 ? p.TotalSubUnitStock / p.UnitsPerBaseUnit : 0,
                RemainingSubUnits = p.UnitsPerBaseUnit > 0 ? p.TotalSubUnitStock % p.UnitsPerBaseUnit : 0,
                p.LowStockThreshold,
                p.LowStockThresholdUnit,
                LowStockThresholdSubUnits = (p.LowStockThresholdUnit == StockEntryUnit.BaseUnit && p.UnitsPerBaseUnit > 0)
                    ? p.LowStockThreshold * p.UnitsPerBaseUnit
                    : p.LowStockThreshold,
                p.StorageLocation,
                p.CreatedAt,
                p.UpdatedAt,
                p.CreatedBy,
                p.UpdatedBy
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (rawProduct is null)
        {
            return Result<ReportFileDto>.Failure(ProductErrors.NotFound);
        }

        // حساب حالة الصنف
        var stockStatus = ProductRules.CalculateStockStatus(
            rawProduct.UnitType,
            rawProduct.TotalSubUnitStock,
            rawProduct.UnitsPerBaseUnit,
            rawProduct.LowStockThresholdSubUnits);

        var statusLabel = stockStatus switch
        {
            ProductStockStatus.OutOfStock => "نفد",
            ProductStockStatus.LowStock => "منخفض",
            _ => "متوفر"
        };

        // أسماء المستخدمين (المنشئ والمعدل)
        var userIds = new List<Guid>();
        if (rawProduct.CreatedBy.HasValue) userIds.Add(rawProduct.CreatedBy.Value);
        if (rawProduct.UpdatedBy.HasValue) userIds.Add(rawProduct.UpdatedBy.Value);

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

        string createdByName = rawProduct.CreatedBy.HasValue && usersMap.TryGetValue(rawProduct.CreatedBy.Value, out var cb)
            ? cb
            : "مسؤول النظام";

        string? updatedByName = rawProduct.UpdatedBy.HasValue && usersMap.TryGetValue(rawProduct.UpdatedBy.Value, out var ub)
            ? ub
            : null;

        // توقيت القاهرة الموحد عبر IDateTime
        var nowCairo = _dateTime.Now;
        DateTime createdAtCairo = _dateTime.ToCairoTime(rawProduct.CreatedAt);
        DateTime? updatedAtCairo = rawProduct.UpdatedAt.HasValue
            ? _dateTime.ToCairoTime(rawProduct.UpdatedAt.Value)
            : null;

        var model = new ProductCardPdfModel(
            ProductId: rawProduct.Id,
            Name: rawProduct.Name,
            CategoryName: rawProduct.CategoryName,
            CategoryColor: rawProduct.CategoryColor,
            BaseUnit: rawProduct.BaseUnit,
            SubUnit: rawProduct.SubUnit,
            UnitsPerBaseUnit: rawProduct.UnitsPerBaseUnit,
            FullBaseUnits: rawProduct.FullBaseUnits,
            RemainingSubUnits: rawProduct.RemainingSubUnits,
            TotalSubUnits: rawProduct.TotalSubUnitStock,
            StorageLocation: rawProduct.StorageLocation ?? "المستودع الرئيسي",
            StatusLabel: statusLabel,
            CreatedByName: createdByName,
            CreatedAtCairo: createdAtCairo,
            UpdatedByName: updatedByName,
            UpdatedAtCairo: updatedAtCairo,
            PrintedAtCairo: nowCairo
        );

        var pdfBytes = _reportGenerator.GenerateProductCardPdf(model);
        var fileName = $"product_card_{rawProduct.Id}.pdf";

        return Result<ReportFileDto>.Success(new ReportFileDto(pdfBytes, fileName, "application/pdf"));
    }
}
