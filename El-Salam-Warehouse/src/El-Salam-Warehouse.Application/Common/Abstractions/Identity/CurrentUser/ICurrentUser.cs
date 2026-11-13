namespace El_Salam_Warehouse.Application.Common.Abstractions.Identity.CurrentUser;

// واجهة بتوفر بيانات وصلاحيات المستخدم الحالي اللي باعت الطلب من الـ JWT
public interface ICurrentUser
{
    // هل المستخدم مسجل دخول وموثق؟
    bool IsAuthenticated { get; }

    // معرف المستخدم في السيستم
    Guid? UserId { get; }

    // الاسم الكامل للمستخدم
    string? FullName { get; }

    // رقم هاتف المستخدم
    string? PhoneNumber { get; }

    // البريد الإلكتروني للمستخدم
    string? Email { get; }

    // الدور الأساسي للمستخدم (أول دور)
    string? Role { get; }

    // كل الأدوار اللي واخدها المستخدم
    IReadOnlyList<string> Roles { get; }

    // فحص هل المستخدم عنده رول معين
    bool IsInRole(string role);

    // فحص هل المستخدم يملك صلاحية معينة
    bool HasPermission(string permission);

    // الحصول على كل الصلاحيات الممنوحة للمستخدم
    IEnumerable<string> GetPermissions();
}
