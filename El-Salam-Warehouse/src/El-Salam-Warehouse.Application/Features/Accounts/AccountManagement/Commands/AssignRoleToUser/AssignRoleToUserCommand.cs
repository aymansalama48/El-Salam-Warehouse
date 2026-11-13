using El_Salam_Warehouse.Application.Common.Abstractions.External.Cache;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using System;
using System.Collections.Generic;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.AssignRoleToUser;

[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Users.AssignRoles)]
public sealed record AssignRoleToUserCommand(Guid UserId, string RoleName) : ICommand<bool>, ICacheInvalidatorCommand
{
    // هنمسح كاش الآدمن عشان اللستة تتحدث بالرول الجديد فوراً
    public IReadOnlyCollection<string> CacheKeys => ["users-list"];
}