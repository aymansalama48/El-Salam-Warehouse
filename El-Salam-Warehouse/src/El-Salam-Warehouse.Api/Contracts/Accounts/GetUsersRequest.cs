namespace El_Salam_Warehouse.Api.Contracts.Accounts;

// نموذج طلب استرجاع قائمة المستخدمين مع الترقيم والفلترة
public record GetUsersRequest(
    int PageNumber = 1,
    int PageSize = 10,
    string? Role = null,
    string? SearchTerm = null);
