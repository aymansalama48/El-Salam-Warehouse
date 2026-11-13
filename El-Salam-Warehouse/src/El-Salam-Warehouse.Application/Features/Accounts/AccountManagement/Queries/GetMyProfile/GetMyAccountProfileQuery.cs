using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Queries.GetMyProfile;

[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Profile.View)]
public sealed record GetMyAccountProfileQuery() : IQuery<MyAccountProfileResponse>;