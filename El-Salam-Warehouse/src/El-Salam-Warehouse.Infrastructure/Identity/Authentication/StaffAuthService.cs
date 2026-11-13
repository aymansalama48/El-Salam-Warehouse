using El_Salam_Warehouse.Application.Common.Abstractions.Core;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authentication;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Tokens;
using El_Salam_Warehouse.Application.Common.Errors.Users;
using El_Salam_Warehouse.Application.Features.Accounts.StaffAuth.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Infrastructure.Persistence.IdentityModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Infrastructure.Identity.Authentication;

// خدمة مصادقة وتسجيل دخول موظفي المخزن عبر البريد الإلكتروني وكلمة المرور
public class StaffAuthService(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    IJwtTokenGenerator jwtTokenGenerator,
    IRefreshTokenService refreshTokenService,
    IPermissionService permissionService,
    IDateTime dateTime,
    ILogger<StaffAuthService> logger) : IStaffAuthService
{
    // تسجيل دخول الموظف بالإيميل والباسورد
    public async Task<Result<StaffAuthResponse>> LoginAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default)
    {
        // 1. البحث عن المستخدم بالبريد الإلكتروني
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            return Result<StaffAuthResponse>.Failure(UserErrors.InvalidCredentials);
        }

        // 2. التحقق من أن الحساب مفعل ونشط
        if (!user.IsActive)
        {
            return Result<StaffAuthResponse>.Failure(UserErrors.AccountDeactivated);
        }

        // 3. التحقق من صحة كلمة المرور وحالة القفل (Lockout) بدون إنشاء كوكيز
        var signInResult = await signInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true);
        if (!signInResult.Succeeded)
        {
            if (signInResult.IsLockedOut)
            {
                return Result<StaffAuthResponse>.Failure(UserErrors.AccountLocked);
            }
            if (signInResult.IsNotAllowed)
            {
                return Result<StaffAuthResponse>.Failure(UserErrors.LoginNotAllowed);
            }
            return Result<StaffAuthResponse>.Failure(UserErrors.InvalidCredentials);
        }

        // 4. جلب الأدوار الخاصة بالمستخدم
        var roles = await userManager.GetRolesAsync(user);

        // 5. جلب الصلاحيات بناءً على أدوار المستخدم
        var permissions = await permissionService.GetUserPermissionsAsync(user.Id, cancellationToken);

        // 6. توليد توكن الـ JWT
        var accessToken = jwtTokenGenerator.GenerateStaffToken(
            user.Id,
            user.Email!,
            user.FullName,
            roles,
            permissions);

        // 7. توليد وحفظ الـ Refresh Token في قاعدة البيانات
        var refreshToken = await refreshTokenService.GenerateAndSaveRefreshTokenAsync(user.Id, cancellationToken);

        // 8. تحديث وقت آخر تسجيل دخول للمستخدم
        user.LastLoginAt = dateTime.Now;
        await userManager.UpdateAsync(user);

        logger.LogInformation("تم تسجيل دخول الموظف {Email} بنجاح", email);

        // 9. إرجاع بيانات الدخول والتوكنات
        return Result<StaffAuthResponse>.Success(new StaffAuthResponse
        {
            UserId = user.Id,
            Email = user.Email!,
            FullName = user.FullName,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresInSeconds = 3600,
            LoggedInAt = dateTime.Now,
            Roles = roles.ToList(),
            Permissions = permissions.ToList()
        });
    }

    // تسجيل الخروج وإلغاء الـ Refresh Token
    public async Task<Result<bool>> LogoutAsync(
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        // 1. إبطال الـ Refresh Token في قاعدة البيانات
        await refreshTokenService.RevokeRefreshTokenAsync(refreshToken, cancellationToken);

        // 2. تسجيل الخروج من سياق Identity
        await signInManager.SignOutAsync();

        logger.LogInformation("تم تسجيل خروج الموظف بنجاح (Refresh Token: {Token})", refreshToken);

        return Result<bool>.Success(true);
    }
}
