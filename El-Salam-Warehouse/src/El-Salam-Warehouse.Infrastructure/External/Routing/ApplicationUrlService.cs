using El_Salam_Warehouse.Application.Common.Abstractions.External.Routing;
using El_Salam_Warehouse.Infrastructure.Options;
using Microsoft.Extensions.Options;

namespace El_Salam_Warehouse.Infrastructure.External.Routing;

public sealed class ApplicationUrlService : IApplicationUrlService
{
    private readonly BaseUrlOptions _options;

    public ApplicationUrlService(
        IOptions<BaseUrlOptions> options)
    {
        _options = options.Value;
    }

    public string GeneratePasswordResetUrl(
        string email,
        string token)
    {
        return string.Concat(
            _options.Frontend.TrimEnd('/'),
            "/reset-password",
            "?email=",
            Uri.EscapeDataString(email),
            "&token=",
            Uri.EscapeDataString(token));
    }
}