using El_Salam_Warehouse.Application.Common.Abstractions.External.Cache;
using El_Salam_Warehouse.Infrastructure.Caching;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace El_Salam_Warehouse.Infrastructure.DependencyInjection;

public static partial class DependencyInjection
{
    // تسجيل خدمة الكاش الداخلي في الذاكرة (In-Memory Cache) فقط بدون Redis
    private static IServiceCollection AddCaching(this IServiceCollection services, IConfiguration configuration)
    {
        // 1. تسجيل الـ MemoryCache الأساسي الخاص بـ .NET مع تحديد حد أقصى للحجم
        services.AddMemoryCache(options =>
        {
            options.SizeLimit = 1024;
        });

        // 2. تسجيل خدمة الكاش الخاصة بنا كـ Singleton
        services.AddSingleton<ICacheService, MemoryCacheService>();

        return services;
    }
}
