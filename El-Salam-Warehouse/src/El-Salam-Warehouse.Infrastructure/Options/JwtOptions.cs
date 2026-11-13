namespace El_Salam_Warehouse.Infrastructure.Options;

// إعدادات توكنات الـ JWT الخاصة بالنظام
public class JwtOptions
{
    // اسم السيكشن في ملف appsettings.json
    public const string SectionName = "Jwt";

    // المفتاح السري لتوقيع التوكن (لازم يكون مشفر وقوي)
    public string Key { get; set; } = string.Empty;

    // جهة إصدار التوكن
    public string Issuer { get; set; } = string.Empty;

    // الجمهور المستهدف بالتوكن
    public string Audience { get; set; } = string.Empty;

    // مدة صلاحية توكن الموظف بالدقائق (افتراضي 60 دقيقة)
    public int ExpiryMinutes { get; set; } = 60;
}
