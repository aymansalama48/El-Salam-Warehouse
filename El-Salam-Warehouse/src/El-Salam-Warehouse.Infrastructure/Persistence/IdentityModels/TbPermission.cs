using System;
using System.Collections.Generic;

namespace El_Salam_Warehouse.Infrastructure.Persistence.IdentityModels;

// جدول الصلاحيات في النظام (كتالوج الصلاحيات)
public class TbPermission
{
    // المعرف الفريد للصلاحية
    public Guid Id { get; set; } = Guid.NewGuid();

    // كود الصلاحية البرمجي (مثال: "Users.View", "Profile.Update")
    public string Name { get; set; } = string.Empty;

    // الاسم المعروض للصلاحية في شاشات الإدارة
    public string DisplayName { get; set; } = string.Empty;

    // القسم أو الموديول التابعة له الصلاحية (مثال: "Users", "Profile", "Roles", "Settings")
    public string Module { get; set; } = string.Empty;

    // وصف تفصيلي لما تمنحه الصلاحية
    public string? Description { get; set; }

    // تاريخ إضافة الصلاحية للنظام
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // علاقة الربط مع جدول صلاحيات الأدوار (TbRolePermission)
    public ICollection<TbRolePermission> RolePermissions { get; set; } = new List<TbRolePermission>();
}
