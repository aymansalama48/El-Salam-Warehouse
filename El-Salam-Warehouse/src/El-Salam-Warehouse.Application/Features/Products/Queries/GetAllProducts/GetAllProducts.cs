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

namespace El_Salam_Warehouse.Application.Features.Products.Queries.GetAllProducts;

// 1. Query (مع دعم البحث والتصفية بالفئة)
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Products.View)]
public record GetAllProductsQuery(string? SearchTerm, Guid? CategoryId) : IQuery<List<ProductDto>>;

// 2. Handler
internal sealed class GetAllProductsQueryHandler : IQueryHandler<GetAllProductsQuery, List<ProductDto>>
{
    private readonly IReadDbContext _readContext;
    private readonly IUserManagementService _userManagementService;

    public GetAllProductsQueryHandler(IReadDbContext readContext, IUserManagementService userManagementService)
    {
        _readContext = readContext;
        _userManagementService = userManagementService;
    }

    public async Task<Result<List<ProductDto>>> Handle(GetAllProductsQuery request, CancellationToken cancellationToken)
    {
        // جلب المنتجات مع تضمين الفئة لعرض اسمها
        var query = _readContext.Products.Include(p => p.Category).AsQueryable();

        // فلترة بالبحث النصي
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(searchTerm));
        }

        // فلترة بتحديد الفئة (Category)
        if (request.CategoryId.HasValue && request.CategoryId != Guid.Empty)
        {
            query = query.Where(p => p.CategoryId == request.CategoryId.Value);
        }

        var rawProducts = await query
            .OrderBy(p => p.DisplayOrder)
            .ThenBy(p => p.CreatedAt)
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
                FullBaseUnits = p.UnitsPerBaseUnit > 0 ? p.TotalSubUnitStock / p.UnitsPerBaseUnit : 0,
                RemainingSubUnits = p.UnitsPerBaseUnit > 0 ? p.TotalSubUnitStock % p.UnitsPerBaseUnit : 0,
                p.LowStockThreshold,
                p.LowStockThresholdUnit,
                LowStockThresholdSubUnits = (p.LowStockThresholdUnit == StockEntryUnit.BaseUnit && p.UnitsPerBaseUnit > 0)
                    ? p.LowStockThreshold * p.UnitsPerBaseUnit
                    : p.LowStockThreshold,
                p.DisplayOrder,
                p.StorageLocation,
                p.CreatedAt,
                p.UpdatedAt,
                p.CreatedBy,
                p.UpdatedBy
            })
            .ToListAsync(cancellationToken);

        // جلب أسماء المستخدمين دفعة واحدة
        var userIds = rawProducts
            .Select(p => p.CreatedBy)
            .Concat(rawProducts.Select(p => p.UpdatedBy))
            .Where(id => id.HasValue)
            .Select(id => id!.Value)
            .Distinct()
            .ToList();

        var usersMap = new Dictionary<Guid, string>();
        if (userIds.Count > 0)
        {
            var users = await _userManagementService.GetUsersByIdsAsync(userIds, cancellationToken);
            foreach (var u in users)
            {
                var personName = !string.IsNullOrWhiteSpace(u.FullName)
                    ? u.FullName
                    : (!string.IsNullOrWhiteSpace(u.FirstName) ? $"{u.FirstName} {u.LastName}".Trim() : u.Email);
                usersMap[u.Id] = personName;
            }
        }

        // جلب اسم المسؤول الافتراضي إذا كانت هناك منتجات قديمة ليس لها CreatedBy
        string? defaultPersonName = null;
        if (rawProducts.Any(p => !p.CreatedBy.HasValue))
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

        var products = rawProducts.Select(p => new ProductDto(
            p.Id,
            p.Name,
            p.CategoryId,
            p.CategoryName,
            p.BaseUnit,
            p.SubUnit,
            p.UnitsPerBaseUnit,
            p.EntryUnit,
            p.UnitType,
            p.TotalSubUnitStock,
            p.FullBaseUnits,
            p.RemainingSubUnits,
            ProductRules.CalculateStockStatus(p.UnitType, p.TotalSubUnitStock, p.UnitsPerBaseUnit, p.LowStockThresholdSubUnits),
            p.StorageLocation,
            p.CreatedAt,
            p.UpdatedAt,
            p.CreatedBy.HasValue && usersMap.TryGetValue(p.CreatedBy.Value, out var cb) ? cb : (defaultPersonName ?? "Ayman Salama"),
            p.UpdatedBy.HasValue && usersMap.TryGetValue(p.UpdatedBy.Value, out var ub) ? ub : null,
            p.LowStockThreshold,
            p.LowStockThresholdUnit,
            p.LowStockThresholdSubUnits,
            p.DisplayOrder
        )).ToList();

        return Result<List<ProductDto>>.Success(products);
    }
}
