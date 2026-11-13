namespace El_Salam_Warehouse.Domain.Entities.Settings;

using El_Salam_Warehouse.Domain.Common.Entities;

// كيان الإعدادات العامة لسيستم إدارة المخزن
public class SiteSetting : AuditableEntity
{
    // اسم المخزن أو المنشأة
    public string WarehouseName { get; set; } = "El_Salam_Warehouse";

    // البريد الإلكتروني للتواصل
    public string ContactEmail { get; set; } = string.Empty;

    // رقم هاتف التواصل
    public string PhoneNumber { get; set; } = string.Empty;

    // عنوان المخزن الرئيسي
    public string Address { get; set; } = string.Empty;

    // العملة الافتراضية للمعاملات (مثلاً EGP)
    public string Currency { get; set; } = "EGP";
    
    // لون الثيم الأساسي للواجهة
    public string ThemeColor { get; set; } = "#1E88E5";

    // رابط شعار المخزن أو المصنع
    public string? LogoUrl { get; set; }
}
