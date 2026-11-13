using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authentication;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Security;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Tokens;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.UserManagement;
using El_Salam_Warehouse.Infrastructure.Identity.Authentication;
using El_Salam_Warehouse.Infrastructure.Identity.Authorization;
using El_Salam_Warehouse.Infrastructure.Identity.Security;
using El_Salam_Warehouse.Infrastructure.Identity.Tokens;
using El_Salam_Warehouse.Infrastructure.Identity.UserManagement;
using El_Salam_Warehouse.Infrastructure.Persistence.Data;
using El_Salam_Warehouse.Infrastructure.Persistence.IdentityModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using System;

namespace El_Salam_Warehouse.Infrastructure.DependencyInjection;

public static partial class DependencyInjection
{
    // تسجيل خدمات الهوية والـ Identity وإعدادات كلمات المرور والحسابات
    private static IServiceCollection AddIdentityServices(this IServiceCollection services)
    {
        // 1. تسجيل Identity مع كلاسات المستخدم والدور الخاصة بنا
        services
            .AddIdentity<ApplicationUser, ApplicationRole>(options =>
            {
                // إعدادات كلمة المرور (قوية ومعقدة للأمان)
                options.Password.RequireDigit = true;                   // رقم على الأقل
                options.Password.RequireLowercase = true;               // حرف صغير على الأقل
                options.Password.RequireNonAlphanumeric = true;         // رمز خاص على الأقل
                options.Password.RequireUppercase = true;               // حرف كبير على الأقل
                options.Password.RequiredLength = 8;                    // الحد الأدنى للطول 8 خانات
                options.Password.RequiredUniqueChars = 1;               // عدد الحروف المختلفة

                // إعدادات قفل الحساب عند تكرار الفشل (Lockout)
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);  // مدة القفل 5 دقائق
                options.Lockout.MaxFailedAccessAttempts = 5;                      // 5 محاولات فاشلة قبل القفل
                options.Lockout.AllowedForNewUsers = true;                        // تفعيل القفل لأي مستخدم جديد

                // إعدادات اسم المستخدم والبريد
                options.User.RequireUniqueEmail = true;                // البريد الإلكتروني لا يتكرر
                options.User.AllowedUserNameCharacters =
                    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";

                // إعدادات تسجيل الدخول
                options.SignIn.RequireConfirmedEmail = false;          // لا يشترط تأكيد البريد بما أن الإيميل ملغي
                options.SignIn.RequireConfirmedPhoneNumber = false;
            })
            .AddEntityFrameworkStores<AppDbContext>()                  // ربط Identity بجداول قاعدة البيانات
            .AddDefaultTokenProviders()                                // موفرو التوكن الأساسيون
            .AddRoles<ApplicationRole>();                              // تفعيل الأدوار

        // 2. تسجيل خدمات المصادقة والتوكنات الخاصة بالنظام
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IRefreshTokenService, RefreshTokenService>();

        // 3. تسجيل خدمات إدارة كلمات المرور والصلاحيات
        services.AddScoped<IPasswordService, PasswordService>();
        services.AddScoped<IPermissionService, PermissionService>();
        services.AddScoped<IPermissionManagementService, PermissionManagementService>();

        // 4. تسجيل خدمة مصادقة موظفي المخزن
        services.AddScoped<IStaffAuthService, StaffAuthService>();

        // 5. تسجيل خدمة إدارة المستخدمين
        services.AddScoped<IUserManagementService, UserManagementService>();

        return services;
    }
}
