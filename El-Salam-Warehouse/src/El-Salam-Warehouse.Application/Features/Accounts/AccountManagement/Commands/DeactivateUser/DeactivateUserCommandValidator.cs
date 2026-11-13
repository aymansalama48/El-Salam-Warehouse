using FluentValidation;
using System;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.DeactivateUser;

public sealed class DeactivateUserCommandValidator : AbstractValidator<DeactivateUserCommand>
{
    public DeactivateUserCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("معرف المستخدم مطلوب.")
            .NotEqual(Guid.Empty).WithMessage("معرف المستخدم غير صالح.");
    }
}