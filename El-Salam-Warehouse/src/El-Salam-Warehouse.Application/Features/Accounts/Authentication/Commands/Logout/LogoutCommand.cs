using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;

namespace El_Salam_Warehouse.Application.Features.Accounts.Authentication.Commands.Logout;

public sealed record LogoutCommand(
    string RefreshToken) : ICommand<bool>;