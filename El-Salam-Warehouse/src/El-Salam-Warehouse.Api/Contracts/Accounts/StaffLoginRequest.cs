namespace El_Salam_Warehouse.Api.Contracts.Accounts;

// نموذج طلب تسجيل دخول موظف بالبريد وكلمة المرور
public record StaffLoginRequest(string Email, string Password);
