using El_Salam_Warehouse.Application.Common.Abstractions.Identity.UserManagement;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Domain.Common.Results;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.AssignRoleToUser;

// Handler مسؤول عن إسناد دور جديد لمستخدم في السيستم
public sealed class AssignRoleToUserCommandHandler : ICommandHandler<AssignRoleToUserCommand, bool>
{
    // خدمة إدارة المستخدمين
    private readonly IUserManagementService _userService;

    public AssignRoleToUserCommandHandler(IUserManagementService userService)
    {
        _userService = userService;
    }

    public async Task<Result<bool>> Handle(AssignRoleToUserCommand request, CancellationToken cancellationToken)
    {
        // 1. إسناد الرول للمستخدم عبر UserService
        var result = await _userService.AssignRoleAsync(request.UserId, request.RoleName, cancellationToken);

        // لو العملية فشلت بنرجع أخطاء الفشل
        if (!result.IsSuccess)
        {
            return Result<bool>.Failure(result.Errors);
        }

        // 2. إرجاع النتيجة بنجاح
        return Result<bool>.Success(true);
    }
}
