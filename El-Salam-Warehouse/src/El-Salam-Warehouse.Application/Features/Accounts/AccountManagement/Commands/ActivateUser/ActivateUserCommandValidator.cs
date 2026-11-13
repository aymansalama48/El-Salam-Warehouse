using FluentValidation;
using System;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.ActivateUser;

public sealed class ActivateUserCommandValidator : AbstractValidator<ActivateUserCommand>
{
    public ActivateUserCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("معرف المستخدم مطلوب.")
            .NotEqual(Guid.Empty).WithMessage("معرف المستخدم غير صالح.");
    }
}