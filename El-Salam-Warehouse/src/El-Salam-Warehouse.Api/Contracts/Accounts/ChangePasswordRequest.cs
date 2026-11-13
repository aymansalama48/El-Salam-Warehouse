namespace El_Salam_Warehouse.Api.Contracts.Accounts;

// نموذج طلب تغيير كلمة المرور للمستخدم
public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword,
    string ConfirmNewPassword);
