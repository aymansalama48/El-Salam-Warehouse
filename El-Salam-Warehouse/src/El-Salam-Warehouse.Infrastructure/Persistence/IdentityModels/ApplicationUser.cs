using Microsoft.AspNetCore.Identity;
using System;

namespace El_Salam_Warehouse.Infrastructure.Persistence.IdentityModels;

// كيان المستخدم في السيستم الخاص بتسجيل الدخول وإدارة الهوية
public class ApplicationUser : IdentityUser<Guid>
{
    // الاسم الأول
    public string FirstName { get; set; } = string.Empty;

    // الاسم الأوسط (اختياري)
    public string? MiddleName { get; set; }

    // اسم العائلة
    public string LastName { get; set; } = string.Empty;

    // خاصية محسوبة بترجع الاسم بالكامل
    public string FullName => string.IsNullOrWhiteSpace(MiddleName)
        ? $"{FirstName} {LastName}".Trim()
        : $"{FirstName} {MiddleName} {LastName}".Trim();

    // رابط صورة الملف الشخصي
    public string? AvatarUrl { get; set; }

    // حالة تنشيط وتفعيل الحساب
    public bool IsActive { get; set; } = true;

    // تاريخ ووقت إنشاء الحساب
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // تاريخ ووقت آخر تسجيل دخول للمستخدم
    public DateTime? LastLoginAt { get; set; }
}
