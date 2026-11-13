using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Infrastructure.Persistence.Data;
using El_Salam_Warehouse.Infrastructure.Persistence.Interceptors;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace El_Salam_Warehouse.Infrastructure.DependencyInjection;

public static partial class DependencyInjection
{
    // تسجيل خدمات قاعدة البيانات والـ Interceptors الخاصة بها
    public static IServiceCollection AddPersistence(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // 1. تسجيل الـ Interceptors الخاصة بـ Entity Framework
        services.AddScoped<SoftDeleteInterceptor>();
        services.AddScoped<AuditableEntityInterceptor>();

        // 2. تسجيل الـ DbContext وربطه بقاعدة بيانات SQL Server والـ Interceptors
        services.AddDbContext<AppDbContext>((sp, options) =>
        {
            var softDeleteInterceptor = sp.GetRequiredService<SoftDeleteInterceptor>();
            var auditableInterceptor = sp.GetRequiredService<AuditableEntityInterceptor>();

            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                sqlOptions =>
                {
                    sqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 6,
                        maxRetryDelay: TimeSpan.FromSeconds(5),
                        errorNumbersToAdd: new[] { -1, -2, 2, 19, 53, 64, 121 });
                    sqlOptions.CommandTimeout(60);
                })
                   .AddInterceptors(
                       softDeleteInterceptor,
                       auditableInterceptor);
        });

        // 3. ربط واجهات الـ DbContext (للقراءة والكتابة) بنفس سياق AppDbContext
        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<AppDbContext>());
        services.AddScoped<IReadDbContext>(provider => provider.GetRequiredService<AppDbContext>());

        return services;
    }
}
