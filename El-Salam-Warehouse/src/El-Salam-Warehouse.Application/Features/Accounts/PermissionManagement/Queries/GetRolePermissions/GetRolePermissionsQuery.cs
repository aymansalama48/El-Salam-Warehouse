namespace El_Salam_Warehouse.Application.Features.Accounts.PermissionManagement.Queries.GetRolePermissions;

using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Models;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Domain.Constants;
using System;

[Permission(Permissions.Roles.View)]
public sealed record GetRolePermissionsQuery(Guid RoleId) : IQuery<RoleWithPermissionsDto>;
