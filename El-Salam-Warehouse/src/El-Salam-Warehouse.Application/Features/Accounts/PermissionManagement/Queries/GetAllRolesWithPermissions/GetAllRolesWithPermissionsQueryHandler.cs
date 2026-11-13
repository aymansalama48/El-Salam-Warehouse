using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Models;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Domain.Common.Results;
using System;
using System.Collections.Generic;
using System.Text;

namespace El_Salam_Warehouse.Application.Features.Accounts.PermissionManagement.Queries.GetAllRolesWithPermissions
{
    public sealed class GetAllRolesWithPermissionsQueryHandler(
        IPermissionManagementService permissionManagementService)
        : IQueryHandler<GetAllRolesWithPermissionsQuery, List<RoleWithPermissionsDto>>
    {
        public async Task<Result<List<RoleWithPermissionsDto>>> Handle(
            GetAllRolesWithPermissionsQuery request,
            CancellationToken cancellationToken)
        {
            return await permissionManagementService.GetAllRolesWithPermissionsAsync(cancellationToken);
        }
    }
}
