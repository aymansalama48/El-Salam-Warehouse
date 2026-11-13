using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.UserManagement;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Features.Products.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.Products.Queries.GetProductById;

// 1. Query
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Products.View)]
public record GetProductByIdQuery(Guid Id) : IQuery<ProductDto>;

// 2. Handler
internal sealed class GetProductByIdQueryHandler : IQueryHandler<GetProductByIdQuery, ProductDto>
{
    private readonly IReadDbContext _readContext;
    private readonly IUserManagementService _userManagementService;

    public GetProductByIdQueryHandler(IReadDbContext readContext, IUserManagementService userManagementService)
    {
        _readContext = readContext;
        _userManagementService = userManagementService;
    }

    public async Task<Result<ProductDto>> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
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
                p.BaseUnit,
                p.SubUnit,
                p.UnitsPerBaseUnit,
                p.EntryUnit,
                p.UnitType,
                p.TotalSubUnitStock,
                FullBaseUnits = p.UnitsPerBaseUnit > 0 ? p.TotalSubUnitStock / p.UnitsPerBaseUnit : 0,   // الباكو الكامل
                RemainingSubUnits = p.UnitsPerBaseUnit > 0 ? p.TotalSubUnitStock % p.UnitsPerBaseUnit : 0,   // القطع السايبة
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
            return Result<ProductDto>.Failure(ProductErrors.NotFound);
        }

        var stockStatus = ProductRules.CalculateStockStatus(
            rawProduct.UnitType,
            rawProduct.TotalSubUnitStock,
            rawProduct.UnitsPerBaseUnit,
            rawProduct.LowStockThresholdSubUnits);

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

        string? defaultPersonName = null;
        if (!rawProduct.CreatedBy.HasValue)
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

        var product = new ProductDto(
            rawProduct.Id,
            rawProduct.Name,
            rawProduct.CategoryId,
            rawProduct.CategoryName,
            rawProduct.BaseUnit,
            rawProduct.SubUnit,
            rawProduct.UnitsPerBaseUnit,
            rawProduct.EntryUnit,
            rawProduct.UnitType,
            rawProduct.TotalSubUnitStock,
            rawProduct.FullBaseUnits,
            rawProduct.RemainingSubUnits,
            stockStatus,
            rawProduct.StorageLocation,
            rawProduct.CreatedAt,
            rawProduct.UpdatedAt,
            rawProduct.CreatedBy.HasValue && usersMap.TryGetValue(rawProduct.CreatedBy.Value, out var cb) ? cb : (defaultPersonName ?? "Ayman Salama"),
            rawProduct.UpdatedBy.HasValue && usersMap.TryGetValue(rawProduct.UpdatedBy.Value, out var ub) ? ub : null,
            rawProduct.LowStockThreshold,
            rawProduct.LowStockThresholdUnit,
            rawProduct.LowStockThresholdSubUnits
        );

        return Result<ProductDto>.Success(product);
    }
}
