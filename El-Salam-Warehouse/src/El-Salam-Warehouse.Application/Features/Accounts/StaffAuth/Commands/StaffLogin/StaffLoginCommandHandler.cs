using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authentication;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Features.Accounts.StaffAuth.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Application.Features.Accounts.StaffAuth.Commands.StaffLogin;

// Handler مسؤول عن تسجيل دخول موظف المخزن بالبريد وكلمة المرور
public sealed class StaffLoginCommandHandler(IStaffAuthService staffAuthService)
    : ICommandHandler<StaffLoginCommand, StaffAuthResponse>
{
    public async Task<Result<StaffAuthResponse>> Handle(
        StaffLoginCommand request,
        CancellationToken cancellationToken)
    {
        // 1. تنفيذ عملية تسجيل الدخول عبر StaffAuthService والتحقق من صحة البيانات
        var result = await staffAuthService.LoginAsync(
            request.Email,
            request.Password,
            cancellationToken);

        // 2. إذا فشل تسجيل الدخول بنرجع الخطأ فوراً
        if (result.IsFailure)
        {
            return result;
        }

        // 3. إرجاع بيانات التوثيق والتوكن بنجاح
        return result;
    }
}
