using El_Salam_Warehouse.Application.Common.Abstractions.Identity.UserManagement;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Domain.Common.Results;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.ActivateUser;

// Handler مسؤول عن تفعيل حساب المستخدم المعطل
public sealed class ActivateUserCommandHandler : ICommandHandler<ActivateUserCommand, bool>
{
    // خدمة إدارة المستخدمين
    private readonly IUserManagementService _userService;

    public ActivateUserCommandHandler(IUserManagementService userService)
    {
        _userService = userService;
    }

    public async Task<Result<bool>> Handle(ActivateUserCommand request, CancellationToken cancellationToken)
    {
        // 1. تنفيذ عملية التفعيل للحساب عن طريق الـ UserService
        var result = await _userService.ActivateUserAsync(request.UserId, cancellationToken);

        // لو العملية فشلت بنرجع أخطاء الفشل
        if (!result.IsSuccess)
        {
            return Result<bool>.Failure(result.Errors);
        }

        // 2. إرجاع النتيجة بنجاح
        return Result<bool>.Success(true);
    }
}
