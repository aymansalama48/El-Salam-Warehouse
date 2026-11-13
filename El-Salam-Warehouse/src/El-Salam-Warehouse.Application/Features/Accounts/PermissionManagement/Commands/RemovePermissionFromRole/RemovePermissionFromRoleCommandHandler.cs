using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Domain.Common.Results;
using System;
using System.Collections.Generic;
using System.Text;

namespace El_Salam_Warehouse.Application.Features.Accounts.PermissionManagement.Commands.RemovePermissionFromRole
{
    public sealed class RemovePermissionFromRoleCommandHandler(
        IPermissionManagementService permissionManagementService)
        : ICommandHandler<RemovePermissionFromRoleCommand>
    {
        public async Task<Result> Handle(
            RemovePermissionFromRoleCommand request,
            CancellationToken cancellationToken)
        {
            return await permissionManagementService.RemovePermissionFromRoleAsync(
                request.RoleId,
                request.PermissionId,
                cancellationToken);
        }
    }
}
