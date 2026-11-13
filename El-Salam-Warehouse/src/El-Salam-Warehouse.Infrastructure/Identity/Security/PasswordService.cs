using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Security;
using El_Salam_Warehouse.Application.Common.Errors.Identity;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Infrastructure.Persistence.IdentityModels;
using Microsoft.AspNetCore.Identity;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Infrastructure.Identity.Security;

// خدمة إدارة وتغيير كلمة المرور للمستخدمين
public class PasswordService(
    UserManager<ApplicationUser> userManager) : IPasswordService
{
    // تغيير كلمة المرور للمستخدم بعد التأكد من صحة كلمة المرور الحالية
    public async Task<Result> ChangePasswordAsync(
        Guid userId,
        string currentPassword,
        string newPassword,
        CancellationToken cancellationToken = default)
    {
        // 1. البحث عن المستخدم بالمعرف
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Result.Failure(PasswordErrors.UserNotFound);
        }

        // 2. محاولة تغيير كلمة المرور عبر الـ UserManager
        var result = await userManager.ChangePasswordAsync(user, currentPassword, newPassword);

        // 3. التحقق من النتيجة ومعالجة خطأ عدم تطابق كلمة المرور الحالية
        if (!result.Succeeded)
        {
            var isWrongCurrentPassword = result.Errors
                .Any(e => e.Code == nameof(IdentityErrorDescriber.PasswordMismatch));

            return Result.Failure(isWrongCurrentPassword
                ? PasswordErrors.IncorrectCurrentPassword
                : PasswordErrors.ChangeFailed);
        }

        // 4. إرجاع نتيجة النجاح
        return Result.Success();
    }
}
