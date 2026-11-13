using El_Salam_Warehouse.Application.Common.Abstractions.Identity.CurrentUser;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.UserManagement;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Errors.Users;
using El_Salam_Warehouse.Domain.Common.Results;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.UpdateMyProfilePicture;

public sealed class UpdateMyProfilePictureCommandHandler : ICommandHandler<UpdateMyProfilePictureCommand, bool>
{
    private readonly ICurrentUser _currentUser;
    private readonly IUserManagementService _userService;

    public UpdateMyProfilePictureCommandHandler(ICurrentUser currentUser, IUserManagementService userService)
    {
        _currentUser = currentUser;
        _userService = userService;
    }

    public async Task<Result<bool>> Handle(UpdateMyProfilePictureCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUser.UserId.HasValue || _currentUser.UserId.Value == Guid.Empty)
        {
            return Result<bool>.Failure(UserErrors.NotFound);
        }

        var updateResult = await _userService.UpdateProfilePictureAsync(
            _currentUser.UserId.Value,
            request.AvatarUrl,
            cancellationToken);

        if (!updateResult.IsSuccess)
        {
            return Result<bool>.Failure(updateResult.Errors);
        }

        return Result<bool>.Success(true);
    }
}