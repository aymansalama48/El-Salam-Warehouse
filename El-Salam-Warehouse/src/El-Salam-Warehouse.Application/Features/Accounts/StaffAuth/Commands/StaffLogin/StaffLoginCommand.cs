using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Features.Accounts.StaffAuth.Shared;

namespace El_Salam_Warehouse.Application.Features.Accounts.StaffAuth.Commands.StaffLogin;

public sealed record StaffLoginCommand(
    string Email,
    string Password) : ICommand<StaffAuthResponse>;