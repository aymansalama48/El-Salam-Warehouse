using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Serilog;
using Serilog.Events;

namespace El_Salam_Warehouse.Api.Extensions;

public static class LoggingExtensions
{
    public static WebApplicationBuilder AddSerilogLogging(this WebApplicationBuilder builder)
    {
        Log.Logger = new LoggerConfiguration()
            .ReadFrom.Configuration(builder.Configuration)
            .Enrich.FromLogContext()
            .CreateLogger();

        builder.Host.UseSerilog();

        return builder;
    }

    public static IApplicationBuilder UseSerilogLogging(this IApplicationBuilder app)
    {
        app.UseSerilogRequestLogging(options =>
        {
            // فلتر ذكي للتحكم في ظهور الـ Logs
            options.GetLevel = (httpContext, elapsed, ex) =>
            {
                // 1. تسجيل الأخطاء
                if (ex != null || httpContext.Response.StatusCode >= 500)
                    return LogEventLevel.Error;

                // 2. إخفاء الطلبات المزعجة (CORS OPTIONS والتحويلات 307/301)
                if (httpContext.Request.Method == HttpMethods.Options ||
                    httpContext.Response.StatusCode == 307 ||
                    httpContext.Response.StatusCode == 301)
                {
                    return LogEventLevel.Verbose; // مش هتظهر في الـ Console خالص
                }

                // 3. عرض الطلبات المهمة (GET, POST, PUT, DELETE)
                return LogEventLevel.Information;
            };

            // إرفاق معرف التتبع
            options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
            {
                diagnosticContext.Set("TraceId", httpContext.TraceIdentifier);
            };
        });

        return app;
    }
}