using El_Salam_Warehouse.Application.Common.Abstractions.Identity.UserManagement;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Domain.Common.Results;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.CreateUser;

// معالج أمر إنشاء حساب موظف جديد
public sealed class CreateUserCommandHandler(IUserManagementService userService) : ICommandHandler<CreateUserCommand, Guid>
{
    public async Task<Result<Guid>> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        return await userService.CreateUserAsync(
            request.Email,
            request.Password,
            request.FirstName,
            request.MiddleName,
            request.LastName,
            request.PhoneNumber,
            request.Role,
            cancellationToken);
    }
}

