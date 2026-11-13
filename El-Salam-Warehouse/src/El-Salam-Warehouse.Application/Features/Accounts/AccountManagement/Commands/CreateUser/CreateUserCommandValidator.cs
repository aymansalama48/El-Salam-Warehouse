using FluentValidation;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.CreateUser;

// التحقق من صحة مدخلات أمر إنشاء المستخدم
public sealed class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("البريد الإلكتروني مطلوب.")
            .EmailAddress().WithMessage("صيغة البريد الإلكتروني غير صحيحة.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("كلمة المرور مطلوبة.")
            .MinimumLength(6).WithMessage("يجب ألا تقل كلمة المرور عن 6 أحرف.");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("الاسم الأول مطلوب.")
            .MaximumLength(50).WithMessage("يجب ألا يتعدى الاسم الأول 50 حرفاً.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("اسم العائلة مطلوب.")
            .MaximumLength(50).WithMessage("يجب ألا يتعدى اسم العائلة 50 حرفاً.");

        RuleFor(x => x.Role)
            .NotEmpty().WithMessage("يرجى تحديد الدور الوظيفي للموظف.");
    }
}

