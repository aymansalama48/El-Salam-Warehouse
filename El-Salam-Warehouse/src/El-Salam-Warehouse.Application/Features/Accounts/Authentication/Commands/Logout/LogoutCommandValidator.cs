namespace El_Salam_Warehouse.Application.Features.Accounts.Authentication.Commands.Logout;

using FluentValidation;

public sealed class LogoutCommandValidator : AbstractValidator<LogoutCommand>
{
    public LogoutCommandValidator()
    {
        // لو أمر تسجيل الخروج بيستقبل RefreshToken مثلاً، نقدر نفحصه هنا.
        // لو مش بيستقبل حاجة (بيعتمد على الـ HttpContext)، الكلاس ده هيكفي لمنع تحذير التقرير المعماري.
    }
}