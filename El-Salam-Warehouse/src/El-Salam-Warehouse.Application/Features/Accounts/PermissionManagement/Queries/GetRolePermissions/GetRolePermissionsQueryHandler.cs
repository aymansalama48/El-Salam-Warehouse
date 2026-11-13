using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Models;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Domain.Common.Results;
using System;
using System.Collections.Generic;
using System.Text;

namespace El_Salam_Warehouse.Application.Features.Accounts.PermissionManagement.Queries.GetRolePermissions
{
    public sealed class GetRolePermissionsQueryHandler(
        IPermissionManagementService permissionManagementService)
        : IQueryHandler<GetRolePermissionsQuery, RoleWithPermissionsDto>
    {
        public async Task<Result<RoleWithPermissionsDto>> Handle(
            GetRolePermissionsQuery request,
            CancellationToken cancellationToken)
        {
            return await permissionManagementService.GetRolePermissionsAsync(request.RoleId, cancellationToken);
        }
    }
}
