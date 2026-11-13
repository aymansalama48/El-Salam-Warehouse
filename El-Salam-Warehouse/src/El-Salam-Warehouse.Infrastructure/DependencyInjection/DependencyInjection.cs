using El_Salam_Warehouse.Application.Common.Abstractions.Core;
using El_Salam_Warehouse.Application.Common.Abstractions.External.FileStorage;
using El_Salam_Warehouse.Application.Common.Abstractions.External.Routing;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.CurrentUser;
using El_Salam_Warehouse.Application.Common.Abstractions.Reports;
using El_Salam_Warehouse.Infrastructure.Core;
using El_Salam_Warehouse.Infrastructure.External.FileStorage;
using El_Salam_Warehouse.Infrastructure.External.Routing;
using El_Salam_Warehouse.Infrastructure.Identity.CurrentUser;
using El_Salam_Warehouse.Infrastructure.Options;
using El_Salam_Warehouse.Infrastructure.Reports;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace El_Salam_Warehouse.Infrastructure.DependencyInjection;

// الكلاس المسؤول عن تجميع وتسجيل كافة خدمات طبقة الـ Infrastructure في الـ DI Container
public static partial class DependencyInjection
{
    // دالة لتسجيل كل مكونات الـ Infrastructure في السيستم
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services
            .AddCoreServices(configuration)                    // تسجيل الخدمات الأساسية وسياق الطلب
            .AddCaching(configuration)                         // تسجيل خدمة الكاش الداخلي في الذاكرة
            .AddPersistence(configuration)                     // تسجيل قاعدة البيانات و EF Core
            .AddIdentityServices()                             // تسجيل خدمات الهوية والـ Identity Stores
            .AddJwtAuthentication(configuration)               // تسجيل توثيق الـ JWT
            .AddBaseUrl(configuration);                        // تسجيل خدمة الروابط الأساسية

        // إعداد وتسجيل خدمة التخزين المحلي للملفات
        services.Configure<FileStorageOptions>(configuration.GetSection(FileStorageOptions.SectionName));
        services.AddScoped<IFileStorage, LocalFileStorage>();

        return services;
    }

    // تسجيل خدمات السياق والبيانات الأساسية للنظام
    private static IServiceCollection AddCoreServices(this IServiceCollection services, IConfiguration configuration)
    {
        // تمكين قراءة الـ HttpContext من أي خدمة داخل التطبيق
        services.AddHttpContextAccessor();

        // تسجيل خدمة الوقت الموحدة للنظام
        services.AddTransient<IDateTime, DateTimeProvider>();

        // تسجيل خدمة الوصول لبيانات وهوية المستخدم الحالي من توكن الـ JWT
        services.AddScoped<ICurrentUser, CurrentUserService>();

        // تسجيل خدمة تتبع معرف الطلب الفريد (Correlation ID) عبر مسار الطلب
        services.AddScoped<ICorrelationContext, CorrelationContext>();

        // تسجيل خدمة توليد الروابط الأساسية للتطبيق
        services.AddScoped<IApplicationUrlService, ApplicationUrlService>();
        // مولّد تقارير الـ PDF
                // تسجيل خدمة إعدادات المنشأة والنظام
        services.AddSingleton<El_Salam_Warehouse.Application.Common.Abstractions.Settings.ISettingsService, El_Salam_Warehouse.Infrastructure.Services.Settings.SettingsService>();

        // مولّد تقارير الـ PDF
        services.AddSingleton<IReportGenerator, QuestPdfReportGenerator>();

        return services;
    }
}
