namespace El_Salam_Warehouse.Application.Features.Accounts.PermissionManagement.Queries.GetAllPermissions;

using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Models;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Domain.Constants;
using System.Collections.Generic;

[Permission(Permissions.Roles.View)]
public sealed record GetAllPermissionsQuery() : IQuery<List<PermissionDto>>;
