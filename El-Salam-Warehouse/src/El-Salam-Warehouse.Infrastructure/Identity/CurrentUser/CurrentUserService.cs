using El_Salam_Warehouse.Application.Common.Abstractions.Identity.CurrentUser;
using El_Salam_Warehouse.Application.Common.Constants;
using El_Salam_Warehouse.Domain.Constants;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;

namespace El_Salam_Warehouse.Infrastructure.Identity.CurrentUser;

// خدمة قراءة بيانات وصلاحيات المستخدم الحالي من الـ Claims في توكن الـ JWT ديناميكياً
public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    private ClaimsPrincipal? User => httpContextAccessor.HttpContext?.User;

    // فحص هل المستخدم مسجل دخول بالطلب الحالي
    public bool IsAuthenticated =>
        User?.Identity?.IsAuthenticated ?? false;

    // معرف المستخدم المقروء من الـ Claim مع دعم كافة أسماء ومخططات الـ Claims
    public Guid? UserId =>
        ParseGuid(User?.FindFirstValue(CustomClaims.UserId))
        ?? ParseGuid(User?.FindFirstValue(ClaimTypes.NameIdentifier))
        ?? ParseGuid(User?.FindFirstValue("sub"))
        ?? ParseGuid(User?.FindFirstValue("id"))
        ?? ParseGuid(User?.FindFirstValue("nameid"));

    // الاسم الكامل للمستخدم
    public string? FullName =>
        User?.FindFirstValue(ClaimTypes.Name)
        ?? User?.FindFirstValue("name")
        ?? User?.FindFirstValue("unique_name");

    // رقم هاتف المستخدم
    public string? PhoneNumber =>
        User?.FindFirstValue(ClaimTypes.MobilePhone);

    // البريد الإلكتروني للمستخدم
    public string? Email =>
        User?.FindFirstValue(ClaimTypes.Email)
        ?? User?.FindFirstValue("email");

    // أول رول للمستخدم
    public string? Role =>
        User?.FindFirstValue(ClaimTypes.Role)
        ?? User?.FindFirstValue("role");

    // قائمة بجميع الأدوار الممنوحة للمستخدم
    public IReadOnlyList<string> Roles =>
        User?.FindAll(ClaimTypes.Role).Select(c => c.Value)
            .Concat(User?.FindAll("role").Select(c => c.Value) ?? Enumerable.Empty<string>())
            .Distinct()
            .ToList()
        ?? new List<string>();

    // فحص هل المستخدم يحمل دوراً معيناً
    public bool IsInRole(string role) =>
        User?.IsInRole(role)
        ?? Roles.Contains(role, StringComparer.OrdinalIgnoreCase);

    // فحص هل المستخدم يملك صلاحية معينة (مدير النظام يملك كافة الصلاحيات تلقائياً)
    public bool HasPermission(string permission) =>
        IsInRole(El_Salam_Warehouse.Domain.Constants.Roles.Admin) ||
        (User?.FindAll(CustomClaims.Permission).Any(c => c.Value == permission) ?? false);

    // جلب كل الصلاحيات الموجودة في توكن المستخدم
    public IEnumerable<string> GetPermissions() =>
        User?.FindAll(CustomClaims.Permission).Select(c => c.Value)
        ?? Enumerable.Empty<string>();

    // دالة مساعدة لتحويل النص إلى Guid بشكل آمن
    private static Guid? ParseGuid(string? value) =>
        Guid.TryParse(value, out var guid) ? guid : null;
}
