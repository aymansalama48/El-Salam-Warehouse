using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Domain.Common.Results;


namespace El_Salam_Warehouse.Application.Features.Accounts.PermissionManagement.Commands.UpdateRolePermissions
{
    public sealed class UpdateRolePermissionsCommandHandler(
        IPermissionManagementService permissionManagementService)
        : ICommandHandler<UpdateRolePermissionsCommand>
    {
        public async Task<Result> Handle(
            UpdateRolePermissionsCommand request,
            CancellationToken cancellationToken)
        {
            return await permissionManagementService.UpdateRolePermissionsAsync(
                request.RoleId,
                request.PermissionIds,
                cancellationToken);
        }
    }
}
