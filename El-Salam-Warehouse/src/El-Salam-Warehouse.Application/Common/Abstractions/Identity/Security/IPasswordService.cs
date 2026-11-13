using El_Salam_Warehouse.Domain.Common.Results;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Application.Common.Abstractions.Identity.Security;

// واجهة مسؤولة عن عمليات كلمات المرور للمستخدمين
public interface IPasswordService
{
    // تغيير كلمة المرور للمستخدم الحالي عن طريق التحقق من كلمة المرور القديمة أولاً
    Task<Result> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword, CancellationToken cancellationToken = default);
}
