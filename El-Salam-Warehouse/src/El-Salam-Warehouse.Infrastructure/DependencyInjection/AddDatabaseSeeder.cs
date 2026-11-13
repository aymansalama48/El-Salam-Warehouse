using El_Salam_Warehouse.Infrastructure.Persistence.Data;
using El_Salam_Warehouse.Infrastructure.Persistence.IdentityModels;
using El_Salam_Warehouse.Infrastructure.Persistence.Seed;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Infrastructure.DependencyInjection;

public static partial class DependencyInjection
{
    // تشغيل عملية الـ Seeding للـ Database والـ Roles والـ Permissions ومستخدم الأدمن عند بداية تشغيل التطبيق
    public static async Task SeedDatabaseAsync(this IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var services = scope.ServiceProvider;
        var logger = services.GetRequiredService<ILogger<AppDbContext>>();

        try
        {
            var dbContext = services.GetRequiredService<AppDbContext>();
            var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();
            var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
            var configuration = services.GetRequiredService<IConfiguration>();

            // 1. تطبيق أي Migrations معلقة تلقائياً على قاعدة البيانات
            await dbContext.Database.MigrateAsync();

            // 2. تشغيل الـ Seed الخاص بالـ Roles والـ Permissions
            await ContextSeed.SeedRolesAndPermissionsAsync(roleManager, dbContext);

            // 3. تشغيل الـ Seed الخاص بإنشاء مستخدم الـ Admin الافتراضي بقراءة بياناته من الإعدادات
            await ContextSeed.SeedDefaultAdminAsync(userManager, roleManager, configuration);

            // 4. تشغيل الـ Seed الخاص بإنشاء مستخدم أمين المخزن الافتراضي
            await ContextSeed.SeedDefaultWarehouseKeeperAsync(userManager, roleManager);

            // 5. ربط أي سجلات قديمة ليس لها CreatedBy بحساب المسؤول الفعلي تلقائياً
            var adminUser = await userManager.FindByEmailAsync(configuration["InitialAdmin:Email"] ?? "admin@elsalamwarehouse.com")
                ?? await userManager.Users.FirstOrDefaultAsync();
            if (adminUser != null)
            {
                await dbContext.Database.ExecuteSqlRawAsync(
                    "UPDATE Categories SET CreatedBy = {0} WHERE CreatedBy IS NULL", adminUser.Id);
                await dbContext.Database.ExecuteSqlRawAsync(
                    "UPDATE Products SET CreatedBy = {0} WHERE CreatedBy IS NULL", adminUser.Id);
                await dbContext.Database.ExecuteSqlRawAsync(
                    "UPDATE StockVouchers SET CreatedBy = {0} WHERE CreatedBy IS NULL", adminUser.Id);
            }

            logger.LogInformation("تم تشغيل تهيئة قاعدة البيانات والـ Seeding بنجاح.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "حدث خطأ أثناء إجراء الـ Seeding لقاعدة البيانات.");
            throw;
        }
    }
}
