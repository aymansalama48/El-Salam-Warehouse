using System.Collections.Generic;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Queries.GetMyProfile;

public record MyAccountProfileResponse(
    string FirstName,
    string? MiddleName,
    string LastName,
    string FullName,
    string Email,
    string? PhoneNumber,
    string? AvatarUrl,
    List<string> Roles,
    List<string> Permissions
);
