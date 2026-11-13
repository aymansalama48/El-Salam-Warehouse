namespace El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;

using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Models;
using El_Salam_Warehouse.Domain.Common.Results;

public interface IPermissionManagementService
{
    /// <summary>
    /// جلب كل الصلاحيات المسجلة في النظام (لعرضها في الشاشة)
    /// </summary>
    Task<Result<List<PermissionDto>>> GetAllPermissionsAsync(CancellationToken cancellationToken);

    /// <summary>
    /// جلب كل الأدوار مع الصلاحيات المرتبطة بكل دور
    /// </summary>
    Task<Result<List<RoleWithPermissionsDto>>> GetAllRolesWithPermissionsAsync(CancellationToken cancellationToken);

    /// <summary>
    /// جلب صلاحيات دور معين فقط
    /// </summary>
    Task<Result<RoleWithPermissionsDto>> GetRolePermissionsAsync(Guid roleId, CancellationToken cancellationToken);

    /// <summary>
    /// إضافة صلاحية معينة لدور معين
    /// </summary>
    Task<Result> AssignPermissionToRoleAsync(Guid roleId, Guid permissionId, CancellationToken cancellationToken);

    /// <summary>
    /// سحب (حذف) صلاحية معينة من دور معين
    /// </summary>
    Task<Result> RemovePermissionFromRoleAsync(Guid roleId, Guid permissionId, CancellationToken cancellationToken);

    /// <summary>
    /// تحديث جميع صلاحيات الدور دفعة واحدة (مفيدة جداً لشاشات الـ Checkboxes)
    /// </summary>
    Task<Result> UpdateRolePermissionsAsync(Guid roleId, List<Guid> permissionIds, CancellationToken cancellationToken);
}