using El_Salam_Warehouse.Application.Common.Abstractions.External.Cache;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using System;
using System.Collections.Generic;
using System.Text;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.UpdateMyProfile
{
    [El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Profile.Update)]
    public sealed record UpdateMyAccountProfileCommand(
        string FirstName,
        string? MiddleName,
        string LastName,
        string? PhoneNumber
    ) : ICommand<bool>, ICacheInvalidatorCommand
    {
        // هيمسح كاش شاشة الـ CRM عشان لو الآدمن فاتح اللستة يشوف اسمه أو رقمه الجديد
        public IReadOnlyCollection<string> CacheKeys => ["users-list"];
    }
}