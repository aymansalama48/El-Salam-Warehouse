using System;
using System.Collections.Generic;

namespace El_Salam_Warehouse.Application.Features.Accounts.StaffAuth.Shared;

// كائن بيرجع بعد تسجيل الدخول فيه التوكنز وبيانات الموظف
public record StaffAuthResponse
{
    // معرف المستخدم
    public Guid UserId { get; init; }

    // البريد الإلكتروني للموظف
    public string Email { get; init; } = string.Empty;

    // الاسم الكامل للموظف
    public string FullName { get; init; } = string.Empty;

    // توكن الوصول الـ JWT
    public string AccessToken { get; init; } = string.Empty;

    // توكن تجديد الجلسة
    public string RefreshToken { get; init; } = string.Empty;

    // مدة صلاحية توكن الوصول بالثواني
    public int ExpiresInSeconds { get; init; } = 3600;

    // وقت وتاريخ تسجيل الدخول بتوقيت UTC
    public DateTime LoggedInAt { get; init; }

    // قائمة الأدوار الممنوحة للمستخدم
    public List<string> Roles { get; init; } = new();

    // قائمة كودات الصلاحيات الممنوحة للمستخدم
    public List<string> Permissions { get; init; } = new();
}
