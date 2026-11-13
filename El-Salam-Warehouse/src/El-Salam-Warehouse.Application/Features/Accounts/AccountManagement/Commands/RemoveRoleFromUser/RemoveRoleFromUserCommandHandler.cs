using El_Salam_Warehouse.Application.Common.Abstractions.Identity.UserManagement;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Domain.Common.Results;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.RemoveRoleFromUser;

// Handler مسؤول عن حذف دور معين من مستخدم في السيستم
public sealed class RemoveRoleFromUserCommandHandler : ICommandHandler<RemoveRoleFromUserCommand, bool>
{
    // خدمة إدارة المستخدمين
    private readonly IUserManagementService _userService;

    public RemoveRoleFromUserCommandHandler(IUserManagementService userService)
    {
        _userService = userService;
    }

    public async Task<Result<bool>> Handle(RemoveRoleFromUserCommand request, CancellationToken cancellationToken)
    {
        // 1. حذف الرول من المستخدم عبر UserService
        var result = await _userService.RemoveRoleAsync(request.UserId, request.RoleName, cancellationToken);

        // لو العملية فشلت بنرجع أخطاء الفشل
        if (!result.IsSuccess)
        {
            return Result<bool>.Failure(result.Errors);
        }

        // 2. إرجاع النتيجة بنجاح
        return Result<bool>.Success(true);
    }
}
