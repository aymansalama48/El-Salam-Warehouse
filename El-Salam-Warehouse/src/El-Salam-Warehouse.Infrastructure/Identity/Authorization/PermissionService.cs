using El_Salam_Warehouse.Application.Common.Abstractions.External.Cache;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Infrastructure.Persistence.Data;
using El_Salam_Warehouse.Infrastructure.Persistence.IdentityModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Infrastructure.Identity.Authorization;

/// <summary>
/// تنفيذ خدمة الصلاحيات اللحظية (Role-based Permissions).
/// مزودة بكاش ذاكرة ذكي فائق السرعة لمنع استنزاف الاتصالات بقاعدة البيانات السحابية مع السريان الفوري للتعديلات.
/// </summary>
public class PermissionService(
    UserManager<ApplicationUser> userManager,
    AppDbContext context,
    ICacheService cacheService) : IPermissionService
{
    private const string CachePrefix = "user_permissions_";

    /// <summary>
    /// التحقق اللحظي من امتلاك المستخدم للصلاحية مع استرجاعها من الكاش الداخلي عالي السرعة
    /// </summary>
    public async Task<bool> HasPermissionAsync(
        Guid userId,
        string permissionName,
        CancellationToken cancellationToken)
    {
        var permissions = await GetUserPermissionsAsync(userId, cancellationToken);
        return permissions.Contains(permissionName, StringComparer.OrdinalIgnoreCase);
    }

    /// <summary>
    /// جلب كافة الصلاحيات الحالية للمستخدم مع التخزين المؤقت بالذاكرة لتفادي استعلامات الـ DB المتكررة
    /// </summary>
    public async Task<IList<string>> GetUserPermissionsAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var cacheKey = $"{CachePrefix}{userId}";

        var permissions = await cacheService.GetOrCreateAsync<List<string>>(
            cacheKey,
            async ct =>
            {
                return await (
                    from userRole in context.UserRoles
                    where userRole.UserId == userId
                    join rolePermission in context.Set<TbRolePermission>() on userRole.RoleId equals rolePermission.RoleId
                    join permission in context.Set<TbPermission>() on rolePermission.PermissionId equals permission.Id
                    select permission.Name
                ).Distinct().ToListAsync(ct);
            },
            slidingExpiration: TimeSpan.FromMinutes(2),
            absoluteExpiration: TimeSpan.FromMinutes(5),
            cancellationToken: cancellationToken);

        return permissions ?? new List<string>();
    }

    /// <summary>
    /// فحص هل الصلاحية مسجلة بالفعل في جدول الصلاحيات بقاعدة البيانات
    /// </summary>
    public async Task<bool> IsPermissionDefinedInDbAsync(
        string permissionName,
        CancellationToken cancellationToken)
    {
        var cacheKey = "all_defined_permissions_in_db";
        var allDefined = await cacheService.GetOrCreateAsync<HashSet<string>>(
            cacheKey,
            async ct =>
            {
                var list = await context.Set<TbPermission>()
                    .AsNoTracking()
                    .Select(p => p.Name)
                    .ToListAsync(ct);
                return new HashSet<string>(list, StringComparer.OrdinalIgnoreCase);
            },
            slidingExpiration: TimeSpan.FromMinutes(5),
            absoluteExpiration: TimeSpan.FromMinutes(15),
            cancellationToken: cancellationToken);

        return allDefined != null && allDefined.Contains(permissionName);
    }
}
