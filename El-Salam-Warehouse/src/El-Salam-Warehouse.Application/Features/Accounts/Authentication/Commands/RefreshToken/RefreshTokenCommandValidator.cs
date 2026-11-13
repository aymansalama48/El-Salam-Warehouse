using FluentValidation;

namespace El_Salam_Warehouse.Application.Features.Accounts.Authentication.Commands.RefreshToken;

public sealed class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("الـ Refresh Token مطلوب.");
    }
}