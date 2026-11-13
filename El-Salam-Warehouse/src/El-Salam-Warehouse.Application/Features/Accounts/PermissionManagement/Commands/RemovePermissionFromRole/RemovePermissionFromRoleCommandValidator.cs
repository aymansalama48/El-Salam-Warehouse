namespace El_Salam_Warehouse.Application.Features.Accounts.PermissionManagement.Commands.RemovePermissionFromRole;

using FluentValidation;

public sealed class RemovePermissionFromRoleCommandValidator : AbstractValidator<RemovePermissionFromRoleCommand>
{
    public RemovePermissionFromRoleCommandValidator()
    {
        RuleFor(x => x.RoleId)
            .NotEmpty().WithMessage("معرف الدور (RoleId) مطلوب ولا يمكن أن يكون فارغاً.");

        RuleFor(x => x.PermissionId)
            .NotEmpty().WithMessage("معرف الصلاحية (PermissionId) مطلوب ولا يمكن أن يكون فارغاً.");
    }
}