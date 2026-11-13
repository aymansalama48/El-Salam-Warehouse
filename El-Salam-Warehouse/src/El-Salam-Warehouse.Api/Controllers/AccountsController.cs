using El_Salam_Warehouse.Api.Contracts.Accounts;
using El_Salam_Warehouse.Api.Controllers.Base;
using El_Salam_Warehouse.Api.Extensions;
using El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.ActivateUser;
using El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.AssignRoleToUser;
using El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.ChangePassword;
using El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.CreateUser;
using El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.DeactivateUser;
using El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.RemoveRoleFromUser;
using El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.UpdateMyProfile;
using El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.UpdateMyProfilePicture;
using El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Queries.GetAllUsers;
using El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Queries.GetMyProfile;
using El_Salam_Warehouse.Application.Features.Accounts.Authentication.Commands.Logout;
using El_Salam_Warehouse.Application.Features.Accounts.Authentication.Commands.RefreshToken;
using El_Salam_Warehouse.Application.Features.Accounts.StaffAuth.Commands.StaffLogin;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Api.Controllers;

// Controller مسؤول عن كل ما يخص حسابات الموظفين: تسجيل الدخول، إدارة الجلسات، والبروفايل الشخصي، وإدارة المستخدمين
[Route("api/accounts")]
public class AccountsController : BaseApiController
{
    // تسجيل دخول موظف بالبريد وكلمة المرور مع تطبيق الـ Rate Limiter
    [HttpPost("login")]
    [EnableRateLimiting(RateLimitingExtensions.LoginPolicy)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IResult> Login([FromBody] StaffLoginRequest request, CancellationToken cancellationToken)
    {
        var command = new StaffLoginCommand(request.Email, request.Password);
        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    // تجديد توكن الوصول باستخدام الـ Refresh Token
    [HttpPost("refresh-token")]
    [EnableRateLimiting(RateLimitingExtensions.RefreshPolicy)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IResult> RefreshToken([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var command = new RefreshTokenCommand(request.RefreshToken);
        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    // تسجيل الخروج وإبطال الـ Refresh Token
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IResult> Logout([FromBody] LogoutRequest request, CancellationToken cancellationToken)
    {
        var command = new LogoutCommand(request.RefreshToken);
        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    // تغيير كلمة المرور للمستخدم المسجل دخوله حالياً
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var command = new ChangePasswordCommand(request.CurrentPassword, request.NewPassword, request.ConfirmNewPassword);
        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    // استرجاع بيانات الملف الشخصي للمستخدم الحالي
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IResult> GetMyProfile(CancellationToken cancellationToken)
    {
        var query = new GetMyAccountProfileQuery();
        var result = await Sender.Send(query, cancellationToken);
        return HandleResult(result);
    }

    // تعديل بيانات الملف الشخصي للمستخدم الحالي
    [HttpPut("me")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IResult> UpdateMyProfile([FromBody] UpdateMyAccountProfileRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateMyAccountProfileCommand(request.FirstName, request.MiddleName, request.LastName, request.PhoneNumber);
        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    // تحديث رابط الصورة الشخصية للمستخدم الحالي
    [HttpPatch("me/picture")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IResult> UpdateMyProfilePicture([FromBody] UpdateMyProfilePictureRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateMyProfilePictureCommand(request.AvatarUrl);
        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    // إنشاء حساب موظف جديد في النظام
    [HttpPost]
    [Authorize]
    [Permission(Permissions.Users.Create)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IResult> CreateUser([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
    {
        var command = new CreateUserCommand(
            request.Email,
            request.Password,
            request.FirstName,
            request.MiddleName,
            request.LastName,
            request.PhoneNumber,
            request.Role);

        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    // استرجاع كل مستخدمي النظام مع دعم الفلترة والترقيم
    [HttpGet]
    [Authorize]
    [Permission(Permissions.Users.View)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IResult> GetAllUsers([FromQuery] GetUsersRequest request, CancellationToken cancellationToken)
    {
        var query = new GetAllUsersQuery(request.PageNumber, request.PageSize, request.Role, request.SearchTerm);
        var result = await Sender.Send(query, cancellationToken);
        return HandleResult(result);
    }

    // تفعيل حساب مستخدم
    [HttpPatch("{id:guid}/activate")]
    [Authorize]
    [Permission(Permissions.Users.Manage)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IResult> ActivateUser([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var command = new ActivateUserCommand(id);
        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    // تعطيل حساب مستخدم
    [HttpPatch("{id:guid}/deactivate")]
    [Authorize]
    [Permission(Permissions.Users.Manage)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IResult> DeactivateUser([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var command = new DeactivateUserCommand(id);
        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    // إسناد دور معين لمستخدم
    [HttpPost("{id:guid}/roles")]
    [Authorize]
    [Permission(Permissions.Users.AssignRoles)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IResult> AssignRole([FromRoute] Guid id, [FromBody] AssignRoleRequest request, CancellationToken cancellationToken)
    {
        var command = new AssignRoleToUserCommand(id, request.RoleName);
        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    // إزالة دور معين من مستخدم
    [HttpDelete("{id:guid}/roles/{roleName}")]
    [Authorize]
    [Permission(Permissions.Users.AssignRoles)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IResult> RemoveRole([FromRoute] Guid id, [FromRoute] string roleName, CancellationToken cancellationToken)
    {
        var command = new RemoveRoleFromUserCommand(id, roleName);
        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }
}
