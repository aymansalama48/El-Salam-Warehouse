using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authentication;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Domain.Common.Results;

namespace El_Salam_Warehouse.Application.Features.Accounts.Authentication.Commands.Logout;

public sealed class LogoutCommandHandler(IStaffAuthService staffAuthService)
    : ICommandHandler<LogoutCommand, bool>
{
    public async Task<Result<bool>> Handle(
        LogoutCommand request,
        CancellationToken cancellationToken)
    {
        return await staffAuthService.LogoutAsync(
            request.RefreshToken,
            cancellationToken);
    }
}