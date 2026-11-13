using System;
using System.Text;
using El_Salam_Warehouse.Infrastructure.Options;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace El_Salam_Warehouse.Infrastructure.DependencyInjection;

public static partial class DependencyInjection
{
    /// <summary>
    /// تسجيل إعدادات وخدمات التوثيق والـ JWT Bearer
    /// </summary>
    private static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // 1. ربط ملف الإعدادات appsettings بكلاس JwtOptions
        services.Configure<JwtOptions>(
            configuration.GetSection(JwtOptions.SectionName));

        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
                         ?? new JwtOptions();

        // 2. إعداد الـ Authentication Scheme والتحقق من التوكن
        services
            .AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,

                    ValidIssuer = jwtOptions.Issuer,
                    ValidAudience = jwtOptions.Audience,

                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtOptions.Key)),

                    ClockSkew = TimeSpan.Zero
                };
            });

        return services; // إرجاع الخدمات لتمكين الـ Method Chaining
    }
}