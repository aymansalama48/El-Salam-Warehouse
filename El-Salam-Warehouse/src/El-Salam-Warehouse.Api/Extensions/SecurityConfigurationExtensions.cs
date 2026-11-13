namespace El_Salam_Warehouse.Api.Extensions;

public static class SecurityConfigurationExtensions
{
    private static readonly string[] KnownCompromisedPlaceholders =
    [
        "your-secret-key-goes-here",
        "YourSuper46854Secre45tOtpHashingSec56645retKeyHere_Minimum465645132Characters!",
        "kjh4df467gdshk-fjg69fdk6745385-fg7t5fgi-f7t1ifg674-d5hni7th6iet-76cbv4fgh-ds,jkf7"
    ];

    public static IServiceCollection ValidateSecurityConfiguration(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        var failures = new List<string>();

        // 1. JWT Key
        var jwtKey = configuration["Jwt:Key"];
        ValidateSecret(
            failures,
            "Jwt:Key",
            jwtKey,
            minimumLength: 32,
            environment,
            instructions: "Use a secure 32+ byte string via user-secrets or env vars.");

        if (!string.IsNullOrWhiteSpace(jwtKey))
        {
            var staffExpiry = configuration.GetValue("Jwt:StaffExpiryMinutes", 60);
            if (staffExpiry <= 0 || staffExpiry > 60)
            {
                failures.Add($"Jwt:StaffExpiryMinutes is {staffExpiry} but must be > 0 and <= 60.");
            }
        }

        // 2. OTP Hashing Secret
        ValidateSecret(
            failures,
            "OtpSettings:HashingSecret",
            configuration["OtpSettings:HashingSecret"],
            minimumLength: 32,
            environment,
            instructions: "Use a secure string. Previous placeholder is compromised.");

        // 3. CORS
        var allowedOrigins = configuration.GetSection("CorsSettings:AllowedOrigins").Get<string[]>() ?? [];
        if (allowedOrigins.Length == 0)
        {
            failures.Add("CorsSettings:AllowedOrigins is empty.");
        }

        foreach (var origin in allowedOrigins)
        {
            if (origin == "*")
            {
                failures.Add("CorsSettings:AllowedOrigins contains wildcard '*'.");
            }

            if (Uri.TryCreate(origin, UriKind.Absolute, out var parsedOrigin))
            {
                if (parsedOrigin.Scheme != Uri.UriSchemeHttps && !environment.IsDevelopment() && !IsLoopback(parsedOrigin))
                {
                    failures.Add($"CORS origin '{origin}' uses plain HTTP outside Development.");
                }
            }
        }

        // 4. DB Connection
        if (string.IsNullOrWhiteSpace(configuration.GetConnectionString("DefaultConnection")))
        {
            failures.Add("ConnectionStrings:DefaultConnection is missing.");
        }

        // 5. Production Checks
        if (!environment.IsDevelopment())
        {
            foreach (var origin in allowedOrigins.Where(o => Uri.TryCreate(o, UriKind.Absolute, out var uri) && IsLoopback(uri)))
            {
                failures.Add($"CORS loopback origin '{origin}' found in non-Development environment.");
            }
        }

        if (failures.Count > 0 && !environment.IsDevelopment()) // Enforce strictly on production
        {
            var message = "Security config failed:\n" + string.Join("\n", failures.Select(f => " - " + f));
            throw new InvalidOperationException(message);
        }

        return services;
    }

    private static void ValidateSecret(
        ICollection<string> failures,
        string key,
        string? value,
        int minimumLength,
        IWebHostEnvironment environment,
        string instructions)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            failures.Add($"{key} is missing. {instructions}");
            return;
        }

        if (value.Length < minimumLength)
        {
            failures.Add($"{key} is too short ({value.Length} chars). Must be at least {minimumLength}.");
        }

        var normalized = value.Trim().ToLowerInvariant();
        if (KnownCompromisedPlaceholders.Any(p => normalized == p.ToLowerInvariant()))
        {
            failures.Add($"{key} holds a known compromised placeholder. MUST REPLACE.");
        }
    }

    private static bool IsLoopback(Uri uri) =>
        uri.IsLoopback || uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
        uri.Host.Equals("127.0.0.1") || uri.Host.Equals("::1");
}
