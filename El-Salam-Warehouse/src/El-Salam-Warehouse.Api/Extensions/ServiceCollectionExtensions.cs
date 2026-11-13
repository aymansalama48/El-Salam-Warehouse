using El_Salam_Warehouse.Api.Middlewares;
using El_Salam_Warehouse.Application;
using El_Salam_Warehouse.Infrastructure.DependencyInjection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace El_Salam_Warehouse.Api.Extensions;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// تسجيل كافة خدمات التطبيق والطبقات الخارجية في حاوية DI
    /// </summary>
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        // 1. Security & Rate Limiting
        services.ValidateSecurityConfiguration(configuration, environment);
        services.AddApplicationRateLimiting();

        // 2. تسجيل طبقات البنية التحتية والتطبيقات
        services.AddInfrastructure(configuration);
        services.AddApplication();

        // 2. إعداد الـ Controllers وتوحيد أخطاء الـ Model Binding مع ProblemDetails وتفعيل فحص الصلاحيات المركزي
        services.AddControllers(options =>
        {
            options.Filters.Add<El_Salam_Warehouse.Api.Filters.PermissionAuthorizationFilter>();
        })
            .ConfigureApiBehaviorOptions(options =>
            {
                options.InvalidModelStateResponseFactory = context =>
                {
                    var problemDetails = new ValidationProblemDetails(context.ModelState)
                    {
                        Status = StatusCodes.Status400BadRequest,
                        Title = "Validation Error",
                        Detail = "توجد أخطاء في البيانات المدخلة في الـ Payload.",
                        Instance = $"{context.HttpContext.Request.Method} {context.HttpContext.Request.Path}"
                    };

                    problemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;

                    return new BadRequestObjectResult(problemDetails);
                };
            });

        // 3. إضافة دعم الـ ProblemDetails والـ Global Exception Handler
        services.AddProblemDetails();
        services.AddExceptionHandler<GlobalExceptionHandler>();

        // 4. الصلاحيات والتوثيق المكتبي والـ CORS
        services.AddAuthorization();
        services.AddOpenApiDocumentation();
        services.AddCorsPolicy(configuration);

        return services;
    }
}