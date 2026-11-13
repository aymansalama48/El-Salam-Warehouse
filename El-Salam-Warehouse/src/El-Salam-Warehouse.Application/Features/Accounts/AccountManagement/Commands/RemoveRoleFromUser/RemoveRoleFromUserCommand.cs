using El_Salam_Warehouse.Application.Common.Abstractions.External.Cache;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using System;
using System.Collections.Generic;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.RemoveRoleFromUser;

[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Users.AssignRoles)]
public sealed record RemoveRoleFromUserCommand(Guid UserId, string RoleName) : ICommand<bool>, ICacheInvalidatorCommand
{
    public IReadOnlyCollection<string> CacheKeys => ["users-list"];
}