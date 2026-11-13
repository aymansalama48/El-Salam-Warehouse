using FluentValidation;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.UpdateMyProfilePicture;

public sealed class UpdateMyProfilePictureCommandValidator : AbstractValidator<UpdateMyProfilePictureCommand>
{
    public UpdateMyProfilePictureCommandValidator()
    {
        RuleFor(x => x.AvatarUrl)
            .NotEmpty().WithMessage("رابط الصورة مطلوب.");
    }
}