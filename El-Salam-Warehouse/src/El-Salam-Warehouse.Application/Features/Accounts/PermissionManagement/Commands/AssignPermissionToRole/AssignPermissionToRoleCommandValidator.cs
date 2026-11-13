namespace El_Salam_Warehouse.Application.Features.Accounts.PermissionManagement.Commands.AssignPermissionToRole;

using FluentValidation;

public sealed class AssignPermissionToRoleCommandValidator : AbstractValidator<AssignPermissionToRoleCommand>
{
    public AssignPermissionToRoleCommandValidator()
    {
        RuleFor(x => x.RoleId)
            .NotEmpty().WithMessage("معرف الدور (RoleId) مطلوب ولا يمكن أن يكون فارغاً.");

        RuleFor(x => x.PermissionId)
            .NotEmpty().WithMessage("معرف الصلاحية (PermissionId) مطلوب ولا يمكن أن يكون فارغاً.");
    }
}