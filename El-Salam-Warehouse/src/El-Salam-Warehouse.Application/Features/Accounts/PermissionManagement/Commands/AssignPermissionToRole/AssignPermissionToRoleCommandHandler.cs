using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Domain.Common.Results;


namespace El_Salam_Warehouse.Application.Features.Accounts.PermissionManagement.Commands.AssignPermissionToRole
{
    public sealed class AssignPermissionToRoleCommandHandler(
       IPermissionManagementService permissionManagementService)
       : ICommandHandler<AssignPermissionToRoleCommand>
    {
        public async Task<Result> Handle(
            AssignPermissionToRoleCommand request,
            CancellationToken cancellationToken)
        {
            return await permissionManagementService.AssignPermissionToRoleAsync(
                request.RoleId,
                request.PermissionId,
                cancellationToken);
        }
    }
}
