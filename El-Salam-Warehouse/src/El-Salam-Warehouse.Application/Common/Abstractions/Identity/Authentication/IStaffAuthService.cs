using El_Salam_Warehouse.Application.Features.Accounts.StaffAuth.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authentication;

// واجهة مسؤولة عن عمليات تسجيل الدخول والخروج لموظفي المخزن
public interface IStaffAuthService
{
    // تسجيل دخول موظف عبر البريد الإلكتروني وكلمة المرور
    Task<Result<StaffAuthResponse>> LoginAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default);

    // تسجيل الخروج وإبطال الـ Refresh Token لمنع تجديد الجلسة
    Task<Result<bool>> LogoutAsync(
        string refreshToken,
        CancellationToken cancellationToken = default);
}
