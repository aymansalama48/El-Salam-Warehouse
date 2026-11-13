using El_Salam_Warehouse.Application.Common.Abstractions.External.Cache;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using System;
using System.Collections.Generic;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.DeactivateUser;

// بياخد الـ ID بتاع اليوزر اللي الآدمن عاوز يوقفه
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Users.Manage)]
public sealed record DeactivateUserCommand(Guid UserId) : ICommand<bool>, ICacheInvalidatorCommand
{
    // هيمسح كاش شاشة الـ CRM عشان حالة اليوزر اتغيرت
    public IReadOnlyCollection<string> CacheKeys => ["users-list"];
}