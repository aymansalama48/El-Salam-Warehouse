using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.ChangePassword;

/// <summary>
/// أمر تغيير كلمة المرور للمستخدم المسجل حالياً
/// </summary>
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Profile.ChangePassword)]
public sealed record ChangePasswordCommand(
    string CurrentPassword,
    string NewPassword,
    string ConfirmNewPassword) : ICommand;