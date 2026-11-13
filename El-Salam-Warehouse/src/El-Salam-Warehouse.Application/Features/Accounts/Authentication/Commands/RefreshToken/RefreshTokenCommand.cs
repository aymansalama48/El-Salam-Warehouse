using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Features.Accounts.StaffAuth.Shared;

namespace El_Salam_Warehouse.Application.Features.Accounts.Authentication.Commands.RefreshToken;

public sealed record RefreshTokenCommand(
    string RefreshToken) : ICommand<StaffAuthResponse>;