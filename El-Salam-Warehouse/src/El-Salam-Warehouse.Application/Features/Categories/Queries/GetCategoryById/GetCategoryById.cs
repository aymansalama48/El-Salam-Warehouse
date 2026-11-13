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

namespace El_Salam_Warehouse.Application.Features.Categories.Queries.GetCategoryById;

// 1. Query
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Categories.View)]
public record GetCategoryByIdQuery(Guid Id) : IQuery<CategoryDto>;

// 2. Handler
internal sealed class GetCategoryByIdQueryHandler : IQueryHandler<GetCategoryByIdQuery, CategoryDto>
{
    private readonly IReadDbContext _readContext;
    private readonly IUserManagementService _userManagementService;

    public GetCategoryByIdQueryHandler(IReadDbContext readContext, IUserManagementService userManagementService)
    {
        _readContext = readContext;
        _userManagementService = userManagementService;
    }

    public async Task<Result<CategoryDto>> Handle(GetCategoryByIdQuery request, CancellationToken cancellationToken)
    {
        var rawCategory = await _readContext.Categories
            .Where(c => c.Id == request.Id)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Description,
                c.ColorHex,
                c.CreatedAt,
                c.UpdatedAt,
                c.CreatedBy,
                c.UpdatedBy
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (rawCategory is null)
        {
            return Result<CategoryDto>.Failure(CategoryErrors.NotFound);
        }

        var productsCount = await _readContext.Products
            .CountAsync(p => p.CategoryId == request.Id, cancellationToken);

        var userIds = new List<Guid>();
        if (rawCategory.CreatedBy.HasValue) userIds.Add(rawCategory.CreatedBy.Value);
        if (rawCategory.UpdatedBy.HasValue) userIds.Add(rawCategory.UpdatedBy.Value);

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
        if (!rawCategory.CreatedBy.HasValue)
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

        var category = new CategoryDto(
            rawCategory.Id,
            rawCategory.Name,
            rawCategory.Description,
            rawCategory.ColorHex,
            productsCount,
            rawCategory.CreatedAt,
            rawCategory.UpdatedAt,
            rawCategory.CreatedBy.HasValue && usersMap.TryGetValue(rawCategory.CreatedBy.Value, out var cb) ? cb : (defaultPersonName ?? "Ayman Salama"),
            rawCategory.UpdatedBy.HasValue && usersMap.TryGetValue(rawCategory.UpdatedBy.Value, out var ub) ? ub : null
        );

        return Result<CategoryDto>.Success(category);
    }
}
