namespace El_Salam_Warehouse.Api.Contracts.Accounts;

// نموذج طلب إنشاء حساب موظف جديد
public sealed record CreateUserRequest(
    string Email,
    string Password,
    string FirstName,
    string? MiddleName,
    string LastName,
    string? PhoneNumber,
    string Role
);

