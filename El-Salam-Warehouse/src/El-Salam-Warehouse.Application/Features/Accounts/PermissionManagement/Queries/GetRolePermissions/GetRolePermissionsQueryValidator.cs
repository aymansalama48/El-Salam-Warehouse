namespace El_Salam_Warehouse.Application.Features.Accounts.PermissionManagement.Queries.GetRolePermissions;

using FluentValidation;

public sealed class GetRolePermissionsQueryValidator : AbstractValidator<GetRolePermissionsQuery>
{
    public GetRolePermissionsQueryValidator()
    {
        RuleFor(x => x.RoleId)
            .NotEmpty().WithMessage("معرف الدور (RoleId) مطلوب ولا يمكن أن يكون فارغاً.");
    }
}