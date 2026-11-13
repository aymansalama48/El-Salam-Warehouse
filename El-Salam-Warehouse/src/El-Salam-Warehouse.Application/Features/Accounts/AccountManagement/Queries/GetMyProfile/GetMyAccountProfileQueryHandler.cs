using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.CurrentUser;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.UserManagement;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Errors.Users;
using El_Salam_Warehouse.Domain.Common.Results;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Queries.GetMyProfile;

// Handler مسؤول عن استرجاع بيانات الملف الشخصي للمستخدم الحالي مع أدواره وصلاحياته
public sealed class GetMyAccountProfileQueryHandler : IQueryHandler<GetMyAccountProfileQuery, MyAccountProfileResponse>
{
    private readonly ICurrentUser _currentUser;
    private readonly IUserManagementService _userService;
    private readonly IPermissionService _permissionService;

    public GetMyAccountProfileQueryHandler(
        ICurrentUser currentUser,
        IUserManagementService userService,
        IPermissionService permissionService)
    {
        _currentUser = currentUser;
        _userService = userService;
        _permissionService = permissionService;
    }

    public async Task<Result<MyAccountProfileResponse>> Handle(GetMyAccountProfileQuery request, CancellationToken cancellationToken)
    {
        // 1. التحقق من وجود معرف للمستخدم الحالي
        if (!_currentUser.UserId.HasValue || _currentUser.UserId.Value == Guid.Empty)
        {
            return Result<MyAccountProfileResponse>.Failure(UserErrors.NotFound);
        }

        // 2. جلب تفاصيل المستخدم من الداتابيز
        var userResult = await _userService.GetByIdAsync(_currentUser.UserId.Value, cancellationToken);

        if (!userResult.IsSuccess || userResult.Data is null)
        {
            return Result<MyAccountProfileResponse>.Failure(UserErrors.NotFound);
        }

        var userDetails = userResult.Data;

        // 3. جلب صلاحيات المستخدم الحالية
        var permissions = await _permissionService.GetUserPermissionsAsync(_currentUser.UserId.Value, cancellationToken);

        // 4. تجهيز الـ Response بالبيانات المطلوبة
        return Result<MyAccountProfileResponse>.Success(new MyAccountProfileResponse(
            userDetails.FirstName,
            userDetails.MiddleName,
            userDetails.LastName,
            userDetails.FullName,
            userDetails.Email,
            userDetails.PhoneNumber,
            userDetails.AvatarUrl,
            userDetails.Roles,
            permissions.ToList()
        ));
    }
}
