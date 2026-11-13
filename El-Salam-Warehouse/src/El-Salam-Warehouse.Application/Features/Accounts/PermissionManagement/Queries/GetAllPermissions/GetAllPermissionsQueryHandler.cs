using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Models;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Domain.Common.Results;
using System;
using System.Collections.Generic;
using System.Text;

namespace El_Salam_Warehouse.Application.Features.Accounts.PermissionManagement.Queries.GetAllPermissions
{
    public sealed class GetAllPermissionsQueryHandler(
        IPermissionManagementService permissionManagementService)
        : IQueryHandler<GetAllPermissionsQuery, List<PermissionDto>>
    {
        public async Task<Result<List<PermissionDto>>> Handle(
            GetAllPermissionsQuery request,
            CancellationToken cancellationToken)
        {
            return await permissionManagementService.GetAllPermissionsAsync(cancellationToken);
        }
    }
}
