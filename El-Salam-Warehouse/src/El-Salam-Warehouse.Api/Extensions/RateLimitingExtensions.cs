namespace El_Salam_Warehouse.Api.Extensions;

using System;
using System.Threading.RateLimiting;
using El_Salam_Warehouse.Api.Middlewares;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

// كلاس بيحدد سياسات تحديد معدل الطلبات (Rate Limiting) لحماية الـ API من الهجمات والضغط الزائد
public static class RateLimitingExtensions
{
    // سياسة تسجيل الدخول (5 محاولات كل 15 دقيقة لكل IP وبريد إلكتروني)
    public const string LoginPolicy = "login-policy";

    // سياسة تجديد التوكن (20 طلب في الدقيقة)
    public const string RefreshPolicy = "refresh-policy";

    // إضافة وإعداد الـ Rate Limiter في خدمات التطبيق
    public static IServiceCollection AddApplicationRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            // كود الاستجابة عند تخطي الحد المسموح (429 Too Many Requests)
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            // 1. سياسة محاولات تسجيل الدخول: 5 محاولات لكل 15 دقيقة
            options.AddPolicy(LoginPolicy, context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    BuildKey(context, "email"),
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(15),
                        QueueLimit = 0
                    }));

            // 2. سياسة تجديد التوكن: 20 محاولة كل دقيقة
            options.AddPolicy(RefreshPolicy, context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    BuildKey(context, null),
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 20,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    }));

            // معالجة الرد لما المستخدم يتخطى الحد المسموح
            options.OnRejected = async (context, cancellationToken) =>
            {
                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;

                TimeSpan? retryAfter = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retry)
                    ? retry
                    : null;

                context.HttpContext.Response.Headers["Retry-After"] =
                    retryAfter?.TotalSeconds.ToString("0") ?? "60";

                await context.HttpContext.Response.WriteAsJsonAsync(new
                {
                    type = "https://httpstatuses.com/429",
                    title = "طلبات كثيرة جداً (Too Many Requests)",
                    status = StatusCodes.Status429TooManyRequests,
                    detail = "لقد تجاوزت الحد المسموح من الطلبات، يرجى المحاولة بعد قليل."
                }, cancellationToken);
            };
        });

        return services;
    }

    // تكوين مفتاح التمييز للـ Rate Limiting بالاعتماد على IP والبريد إن وجد
    private static string BuildKey(HttpContext context, string? identityField)
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        if (identityField is null)
        {
            return ip;
        }

        var identity = context.Items.TryGetValue(
                RateLimitIdentityMiddleware.ItemKey + identityField,
                out var fromBody) && fromBody is string bodyIdentity
            ? bodyIdentity
            : context.Request.Query[identityField].ToString();

        if (string.IsNullOrWhiteSpace(identity))
        {
            return ip;
        }

        var normalized = identity.Trim().ToLowerInvariant();

        return normalized.Length > 128 ? ip : $"{ip}|{normalized}";
    }
}
