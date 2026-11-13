using El_Salam_Warehouse.Application.Common.Abstractions.External.Cache;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using System;
using System.Collections.Generic;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.CreateUser;

// أمر لإنشاء حساب موظف جديد في النظام
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Users.Create)]
public sealed record CreateUserCommand(
    string Email,
    string Password,
    string FirstName,
    string? MiddleName,
    string LastName,
    string? PhoneNumber,
    string Role) : ICommand<Guid>, ICacheInvalidatorCommand
{
    public IReadOnlyCollection<string> CacheKeys => ["users-list"];
}
