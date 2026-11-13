using El_Salam_Warehouse.Application.Common.Abstractions.External.Cache;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using System.Collections.Generic;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.UpdateMyProfilePicture;

[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Profile.UpdatePicture)]
public sealed record UpdateMyProfilePictureCommand(string AvatarUrl) : ICommand<bool>, ICacheInvalidatorCommand
{
    // هيمسح كاش شاشة الـ CRM عشان صورته الجديدة تظهر للآدمن
    public IReadOnlyCollection<string> CacheKeys => ["users-list"];
}