using El_Salam_Warehouse.Application.Common.Abstractions.Identity.UserManagement;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Domain.Common.Results;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.DeactivateUser;

// Handler مسؤول عن تعطيل حساب المستخدم وإيقافه عن العمل
public sealed class DeactivateUserCommandHandler : ICommandHandler<DeactivateUserCommand, bool>
{
    // خدمة إدارة المستخدمين
    private readonly IUserManagementService _userService;

    public DeactivateUserCommandHandler(IUserManagementService userService)
    {
        _userService = userService;
    }

    public async Task<Result<bool>> Handle(DeactivateUserCommand request, CancellationToken cancellationToken)
    {
        // 1. تنفيذ عملية تعطيل الحساب
        var result = await _userService.DeactivateUserAsync(request.UserId, cancellationToken);

        // لو العملية فشلت بنرجع أخطاء الفشل
        if (!result.IsSuccess)
        {
            return Result<bool>.Failure(result.Errors);
        }

        // 2. إرجاع النتيجة بنجاح
        return Result<bool>.Success(true);
    }
}
