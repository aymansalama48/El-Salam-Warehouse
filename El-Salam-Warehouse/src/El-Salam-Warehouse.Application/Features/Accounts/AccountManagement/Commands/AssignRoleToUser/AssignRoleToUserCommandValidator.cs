using El_Salam_Warehouse.Domain.Constants;
using FluentValidation;
using System;
using System.Linq;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.AssignRoleToUser;

// فئات التحقق من صحة بيانات أمر إسناد دور لمستخدم
public sealed class AssignRoleToUserCommandValidator : AbstractValidator<AssignRoleToUserCommand>
{
    public AssignRoleToUserCommandValidator()
    {
        // التحقق من وجود معرف المستخدم
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("معرف المستخدم مطلوب.")
            .NotEqual(Guid.Empty).WithMessage("معرف المستخدم غير صالح.");

        // التحقق من صحة اسم الدور ووجوده ضمن الأدوار المسموح بها في النظام
        RuleFor(x => x.RoleName)
            .NotEmpty().WithMessage("اسم الدور مطلوب.")
            .Must(role => Roles.All.Contains(role))
            .WithMessage($"الدور غير صالح. الأدوار المتاحة هي: {string.Join(", ", Roles.All)}");
    }
}
