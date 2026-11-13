using El_Salam_Warehouse.Domain.Constants;
using El_Salam_Warehouse.Infrastructure.Persistence.IdentityModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Infrastructure.Persistence.Seed;

// كلاس مسؤول عن إدخال البيانات الأولية (Seeding) للرولات والصلاحيات وحساب الأدمن الافتراضي
public static class ContextSeed
{
    // دالة لإنشاء الأدوار والصلاحيات وربطها ببعض بأمان وبشكل متكرر (Idempotent)
    public static async Task SeedRolesAndPermissionsAsync(
        RoleManager<ApplicationRole> roleManager,
        DbContext dbContext)
    {
        // 1. إنشاء وتحديث الأدوار الأساسية في النظام باللغة العربية
        var roleDescriptions = new Dictionary<string, string>
        {
            { Roles.Admin, "مدير النظام (كامل الصلاحيات والإدارة)" },
            { Roles.WarehouseKeeper, "أمين المخزن (إدارة المخزون، الوارد والمنصرف، وحركات الدفتر)" }
        };

        foreach (var roleName in Roles.All)
        {
            var roleDesc = roleDescriptions.GetValueOrDefault(roleName, $"دور {roleName}");
            var existingRole = await roleManager.FindByNameAsync(roleName);

            if (existingRole == null)
            {
                var role = new ApplicationRole(roleName, roleDesc)
                {
                    IsSystemRole = true
                };
                await roleManager.CreateAsync(role);
            }
            else if (existingRole.Description != roleDesc)
            {
                existingRole.Description = roleDesc;
                await roleManager.UpdateAsync(existingRole);
            }
        }

        // 2. تعبئة وتحديث جدول الصلاحيات في قاعدة البيانات (TbPermission) باللغة العربية
        var existingPermissions = await dbContext.Set<TbPermission>().ToListAsync();
        var existingDict = existingPermissions.ToDictionary(p => p.Name, StringComparer.OrdinalIgnoreCase);

        var newPermissions = new List<TbPermission>();

        foreach (var meta in Permissions.Catalog)
        {
            if (existingDict.TryGetValue(meta.Name, out var existing))
            {
                // تحديث النصوص لتكون معربة دائماً في قاعدة البيانات
                existing.DisplayName = meta.DisplayName;
                existing.Module = meta.Module;
                existing.Description = meta.Description;
            }
            else
            {
                newPermissions.Add(new TbPermission
                {
                    Name = meta.Name,
                    DisplayName = meta.DisplayName,
                    Module = meta.Module,
                    Description = meta.Description,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        if (newPermissions.Count > 0)
        {
            await dbContext.Set<TbPermission>().AddRangeAsync(newPermissions);
        }

        await dbContext.SaveChangesAsync();

        // 3. ربط جميع الصلاحيات بدور الأدمن (Admin)
        var adminRole = await roleManager.FindByNameAsync(Roles.Admin);
        if (adminRole != null)
        {
            var allPermissions = await dbContext.Set<TbPermission>().ToListAsync();
            var existingAdminPermissionIds = await dbContext.Set<TbRolePermission>()
                .Where(rp => rp.RoleId == adminRole.Id)
                .Select(rp => rp.PermissionId)
                .ToListAsync();

            var newAdminRolePermissions = allPermissions
                .Where(p => !existingAdminPermissionIds.Contains(p.Id))
                .Select(p => new TbRolePermission
                {
                    RoleId = adminRole.Id,
                    PermissionId = p.Id,
                    GrantedAt = DateTime.UtcNow
                })
                .ToList();

            if (newAdminRolePermissions.Count > 0)
            {
                await dbContext.Set<TbRolePermission>().AddRangeAsync(newAdminRolePermissions);
                await dbContext.SaveChangesAsync();
            }
        }

        // 4. ربط صلاحيات العمليات المخزنية بدور أمين المخزن (WarehouseKeeper)
        var keeperRole = await roleManager.FindByNameAsync(Roles.WarehouseKeeper);
        if (keeperRole != null)
        {
            var keeperPermissions = await dbContext.Set<TbPermission>()
                .Where(p => Permissions.WarehouseKeeperPermissions.Contains(p.Name))
                .ToListAsync();

            var existingKeeperPermissionIds = await dbContext.Set<TbRolePermission>()
                .Where(rp => rp.RoleId == keeperRole.Id)
                .Select(rp => rp.PermissionId)
                .ToListAsync();

            var newKeeperRolePermissions = keeperPermissions
                .Where(p => !existingKeeperPermissionIds.Contains(p.Id))
                .Select(p => new TbRolePermission
                {
                    RoleId = keeperRole.Id,
                    PermissionId = p.Id,
                    GrantedAt = DateTime.UtcNow
                })
                .ToList();

            if (newKeeperRolePermissions.Count > 0)
            {
                await dbContext.Set<TbRolePermission>().AddRangeAsync(newKeeperRolePermissions);
                await dbContext.SaveChangesAsync();
            }
        }
    }

    // دالة لإنشاء حساب المدير الافتراضي مع قراءة البيانات من الـ Configuration
    public static async Task SeedDefaultAdminAsync(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        IConfiguration configuration)
    {
        // 1. قراءة بيانات الأدمن من appsettings أو استخدام قيم افتراضية آمنة
        var adminEmail = configuration["InitialAdmin:Email"] ?? "admin@elsalamwarehouse.com";
        var adminPassword = configuration["InitialAdmin:Password"] ?? "Admin@123456";
        var firstName = configuration["InitialAdmin:FirstName"] ?? "System";
        var lastName = configuration["InitialAdmin:LastName"] ?? "Admin";

        // 2. التحقق من وجود الحساب مسبقاً
        var existingAdmin = await userManager.FindByEmailAsync(adminEmail);

        if (existingAdmin == null)
        {
            // إنشاء مستخدم جديد
            var adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true,
                PhoneNumberConfirmed = true,
                FirstName = firstName,
                LastName = lastName,
                IsActive = true
            };

            var result = await userManager.CreateAsync(adminUser, adminPassword);
            if (result.Succeeded)
            {
                if (await roleManager.RoleExistsAsync(Roles.Admin))
                {
                    await userManager.AddToRoleAsync(adminUser, Roles.Admin);
                }
            }
        }
        else
        {
            // إذا كان المستخدم موجوداً، نتأكد إنه واخد رول الأدمن
            if (!await userManager.IsInRoleAsync(existingAdmin, Roles.Admin))
            {
                await userManager.AddToRoleAsync(existingAdmin, Roles.Admin);
            }
        }
    }

    // دالة لإنشاء حساب أمين المخزن الافتراضي
    public static async Task SeedDefaultWarehouseKeeperAsync(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager)
    {
        var keeperEmail = "keeper@elsalamwarehouse.com";
        var existingKeeper = await userManager.FindByEmailAsync(keeperEmail);

        if (existingKeeper == null)
        {
            var keeperUser = new ApplicationUser
            {
                UserName = keeperEmail,
                Email = keeperEmail,
                EmailConfirmed = true,
                PhoneNumberConfirmed = true,
                FirstName = "محمود",
                LastName = "حسن",
                PhoneNumber = "01012345678",
                IsActive = true
            };

            var result = await userManager.CreateAsync(keeperUser, "Keeper@123456");
            if (result.Succeeded)
            {
                if (await roleManager.RoleExistsAsync(Roles.WarehouseKeeper))
                {
                    await userManager.AddToRoleAsync(keeperUser, Roles.WarehouseKeeper);
                }
            }
        }
        else
        {
            if (!await userManager.IsInRoleAsync(existingKeeper, Roles.WarehouseKeeper))
            {
                await userManager.AddToRoleAsync(existingKeeper, Roles.WarehouseKeeper);
            }
        }
    }
}
