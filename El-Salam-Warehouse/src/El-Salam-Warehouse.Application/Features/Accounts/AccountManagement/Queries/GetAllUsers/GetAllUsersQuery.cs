using El_Salam_Warehouse.Application.Common.Abstractions.Identity.UserManagement;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Pagination;
using System;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Queries.GetAllUsers;

[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Users.View)]
public sealed record GetAllUsersQuery(
    int PageNumber,
    int PageSize,
    string? Role,
    string? SearchTerm
) : IQuery<PagedResult<UserDto>>;
