using El_Salam_Warehouse.Application.Common.Abstractions.Identity.CurrentUser;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.UserManagement;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Errors.Users;
using El_Salam_Warehouse.Domain.Common.Results;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.UpdateMyProfile;

public sealed class UpdateMyAccountProfileCommandHandler : ICommandHandler<UpdateMyAccountProfileCommand, bool>
{
    private readonly ICurrentUser _currentUser;
    private readonly IUserManagementService _userService;

    public UpdateMyAccountProfileCommandHandler(ICurrentUser currentUser, IUserManagementService userService)
    {
        _currentUser = currentUser;
        _userService = userService;
    }

    public async Task<Result<bool>> Handle(UpdateMyAccountProfileCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUser.UserId.HasValue || _currentUser.UserId.Value == Guid.Empty)
        {
            return Result<bool>.Failure(UserErrors.NotFound);
        }

        string fullName = string.IsNullOrWhiteSpace(request.MiddleName)
            ? $"{request.FirstName} {request.LastName}".Trim()
            : $"{request.FirstName} {request.MiddleName} {request.LastName}".Trim();

        var updateResult = await _userService.UpdateProfileAsync(
            _currentUser.UserId.Value,
            fullName,
            request.PhoneNumber ?? string.Empty,
            cancellationToken);

        if (!updateResult.IsSuccess)
        {
            return Result<bool>.Failure(updateResult.Errors);
        }

        return Result<bool>.Success(true);
    }
}