using El_Salam_Warehouse.Application.Common.Abstractions.Identity.UserManagement;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Features.Categories.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Application.Features.Categories.Queries.GetAllCategories;

// 1. Query (معامل البحث)
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Categories.View)]
public record GetAllCategoriesQuery(string? SearchTerm) : IQuery<List<CategoryDto>>;

// 2. Handler
internal sealed class GetAllCategoriesQueryHandler : IQueryHandler<GetAllCategoriesQuery, List<CategoryDto>>
{
    private readonly IReadDbContext _readContext;
    private readonly IUserManagementService _userManagementService;

    public GetAllCategoriesQueryHandler(IReadDbContext readContext, IUserManagementService userManagementService)
    {
        _readContext = readContext;
        _userManagementService = userManagementService;
    }

    public async Task<Result<List<CategoryDto>>> Handle(GetAllCategoriesQuery request, CancellationToken cancellationToken)
    {
        var query = _readContext.Categories.AsQueryable();

        // تطبيق البحث لو فيه نص مبعوت
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(searchTerm) ||
                (c.Description != null && c.Description.ToLower().Contains(searchTerm)));
        }

        var rawCategories = await query
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Description,
                c.ColorHex,
                c.DisplayOrder,
                c.CreatedAt,
                c.UpdatedAt,
                c.CreatedBy,
                c.UpdatedBy
            })
            .ToListAsync(cancellationToken);

        var categoryIds = rawCategories.Select(c => c.Id).ToList();
        var countsMap = new Dictionary<Guid, int>();
        if (categoryIds.Count > 0)
        {
            var productCounts = await _readContext.Products
                .Where(p => categoryIds.Contains(p.CategoryId))
                .GroupBy(p => p.CategoryId)
                .Select(g => new { CategoryId = g.Key, Count = g.Count() })
                .ToListAsync(cancellationToken);

            foreach (var pc in productCounts)
            {
                countsMap[pc.CategoryId] = pc.Count;
            }
        }

        // جلب أسماء المستخدمين الذين أنشأوا أو عدلوا الفئات دفعة واحدة
        var userIds = rawCategories
            .Select(c => c.CreatedBy)
            .Concat(rawCategories.Select(c => c.UpdatedBy))
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

        string? defaultPersonName = null;
        if (rawCategories.Any(c => !c.CreatedBy.HasValue))
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

        var categories = rawCategories.Select(c => new CategoryDto(
            c.Id,
            c.Name,
            c.Description,
            c.ColorHex,
            countsMap.TryGetValue(c.Id, out var count) ? count : 0,
            c.CreatedAt,
            c.UpdatedAt,
            c.CreatedBy.HasValue && usersMap.TryGetValue(c.CreatedBy.Value, out var cb) ? cb : (defaultPersonName ?? "Ayman Salama"),
            c.UpdatedBy.HasValue && usersMap.TryGetValue(c.UpdatedBy.Value, out var ub) ? ub : null,
            c.DisplayOrder
        )).ToList();

        return Result<List<CategoryDto>>.Success(categories);
    }
}
