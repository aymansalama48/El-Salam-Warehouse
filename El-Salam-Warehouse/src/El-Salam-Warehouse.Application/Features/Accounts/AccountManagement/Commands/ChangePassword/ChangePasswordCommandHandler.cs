namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.ChangePassword;

using El_Salam_Warehouse.Application.Common.Abstractions.Identity.CurrentUser;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Security;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Errors.Users;
using El_Salam_Warehouse.Domain.Common.Results;
using System.Threading;
using System.Threading.Tasks;

// Handler مسؤول عن تغيير كلمة المرور للمستخدم المسجل دخوله حالياً
public sealed class ChangePasswordCommandHandler : ICommandHandler<ChangePasswordCommand>
{
    // خدمة عمليات كلمات المرور
    private readonly IPasswordService _passwordService;

    // خدمة معرفة المستخدم الحالي من التوكن
    private readonly ICurrentUser _currentUser;

    public ChangePasswordCommandHandler(
        IPasswordService passwordService,
        ICurrentUser currentUser)
    {
        _passwordService = passwordService;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(
        ChangePasswordCommand request,
        CancellationToken cancellationToken)
    {
        // 1. التأكد من أن المستخدم الحالي مسجل دخوله وله معرف صالح
        var userId = _currentUser.UserId;

        if (userId is null)
        {
            return Result.Failure(UserErrors.NotFound);
        }

        // 2. التحقق من كلمة المرور القديمة وتغييرها لكلمة المرور الجديدة عبر خدمة الهوية
        var result = await _passwordService.ChangePasswordAsync(
            userId.Value,
            request.CurrentPassword,
            request.NewPassword,
            cancellationToken);

        // 3. لو فيه خطأ (زي كلمة المرور الحالية غلط) بنرجع الفشل
        if (result.IsFailure)
        {
            return result;
        }

        // 4. إرجاع استجابة النجاح
        return Result.Success("تم تغيير كلمة المرور بنجاح");
    }
}
