namespace El_Salam_Warehouse.Application.Features.Accounts.PermissionManagement.Commands.AssignPermissionToRole;

using El_Salam_Warehouse.Application.Common.Abstractions.External.Cache;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Domain.Constants;

[Permission(Permissions.Roles.Manage)]
public sealed record AssignPermissionToRoleCommand(
    Guid RoleId,
    Guid PermissionId) : ICommand, ICacheInvalidatorCommand
{
    // نمسح الكاش الخاص بكل الأدوار، والكاش الخاص بهذا الدور تحديداً
    public IReadOnlyCollection<string> CacheKeys => [
        "Roles:AllWithPermissions",
        $"Roles:{RoleId}:Permissions"
    ];
}