using El_Salam_Warehouse.Domain.Common.Results;

namespace El_Salam_Warehouse.Application.Common.Errors.Users;

// كلاس بيحتوي على كافة أخطاء المستخدمين والحسابات في السيستم
public static class UserErrors
{
    // المستخدم غير موجود في النظام
    public static readonly Error NotFound = new(
        "USER_NOT_FOUND",
        "المستخدم غير موجود.",
        ErrorType.NotFound);

    // بيانات تسجيل الدخول غير صحيحة
    public static readonly Error InvalidCredentials = new(
        "USER_INVALID_CREDENTIALS",
        "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
        ErrorType.Validation);

    // قفل الحساب بسبب تكرار المحاولات الخاطئة
    public static readonly Error AccountLocked = new(
        "USER_ACCOUNT_LOCKED",
        "تم قفل الحساب مؤقتاً بسبب كثرة المحاولات الفاشلة، يرجى المحاولة لاحقاً.",
        ErrorType.Validation);

    // الحساب معطل أو غير نشط
    public static readonly Error AccountDeactivated = new(
        "USER_ACCOUNT_DEACTIVATED",
        "هذا الحساب غير نشط، يرجى مراجعة إدارة المخزن.",
        ErrorType.Validation);

    // البريد الإلكتروني مسجل بالفعل
    public static readonly Error EmailAlreadyExists = new(
        "USER_EMAIL_ALREADY_EXISTS",
        "البريد الإلكتروني مستخدم بالفعل في حساب آخر.",
        ErrorType.Validation);

    // رقم الهاتف مسجل بالفعل
    public static readonly Error PhoneAlreadyExists = new(
        "USER_PHONE_ALREADY_EXISTS",
        "رقم الهاتف مستخدم بالفعل في حساب آخر.",
        ErrorType.Validation);

    // غير مسموح بالدخول
    public static readonly Error LoginNotAllowed = new(
        "USER_LOGIN_NOT_ALLOWED",
        "تسجيل الدخول غير مسموح لهذا الحساب.",
        ErrorType.Validation);

    // فشل في تحديث البيانات
    public static Error UpdateFailed(string details) => new(
        "USER_UPDATE_FAILED",
        $"فشل تحديث ملف المستخدم: {details}",
        ErrorType.Failure);

    // فشل في إنشاء المستخدم
    public static Error CreationFailed(string details) => new(
        "USER_CREATION_FAILED",
        $"فشل إنشاء المستخدم: {details}",
        ErrorType.Failure);

    // فشل التحقق من صحة المدخلات
    public static Error ValidationFailed(string details) => new(
        "USER_VALIDATION_FAILED",
        $"فشل التحقق من البيانات: {details}",
        ErrorType.Validation);
}
