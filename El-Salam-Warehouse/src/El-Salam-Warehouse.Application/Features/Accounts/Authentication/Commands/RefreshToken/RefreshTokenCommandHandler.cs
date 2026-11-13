using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authentication;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Tokens;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Features.Accounts.StaffAuth.Shared;
using El_Salam_Warehouse.Domain.Common.Results;

namespace El_Salam_Warehouse.Application.Features.Accounts.Authentication.Commands.RefreshToken;

public sealed class RefreshTokenCommandHandler(IRefreshTokenService refreshTokenService)
    : ICommandHandler<RefreshTokenCommand, StaffAuthResponse>
{
    public async Task<Result<StaffAuthResponse>> Handle(
        RefreshTokenCommand request,
        CancellationToken cancellationToken)
    {
        return await refreshTokenService.RefreshTokenAsync(
            request.RefreshToken,
            cancellationToken);
    }
}