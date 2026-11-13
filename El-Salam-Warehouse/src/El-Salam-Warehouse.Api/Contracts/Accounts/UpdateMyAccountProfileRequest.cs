namespace El_Salam_Warehouse.Api.Contracts.Accounts;

// نموذج طلب تعديل بيانات الملف الشخصي
public record UpdateMyAccountProfileRequest(
    string FirstName,
    string? MiddleName,
    string LastName,
    string? PhoneNumber);
