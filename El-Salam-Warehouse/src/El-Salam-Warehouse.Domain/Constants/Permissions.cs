using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace El_Salam_Warehouse.Domain.Constants;

// كلاس بيجمع كل الصلاحيات (Permissions) المعرفة في السيستم بطريقة شجرية ومترجمة للعربية
public static class Permissions
{
    // تعريف الصلاحية بكامل تفاصيلها بالعربي
    public record PermissionMeta(string Name, string DisplayName, string Module, string Description);

    // 1. صلاحيات لوحة التحكم
    public static class Dashboard
    {
        public const string View = "Dashboard.View";
    }

    // 2. صلاحيات المنتجات والأصناف التامة
    public static class Products
    {
        public const string View = "Products.View";
        public const string Create = "Products.Create";
        public const string Update = "Products.Update";
        public const string Delete = "Products.Delete";
        public const string Export = "Products.Export";
    }

    // 3. صلاحيات فئات وتصنيفات الأصناف
    public static class Categories
    {
        public const string View = "Categories.View";
        public const string Create = "Categories.Create";
        public const string Update = "Categories.Update";
        public const string Delete = "Categories.Delete";
    }

    // 4. صلاحيات أذونات المخزن (الوارد والمنصرف والمرتجع)
    public static class Vouchers
    {
        public const string View = "Vouchers.View";
        public const string CreateInbound = "Vouchers.CreateInbound";
        public const string CreateOutbound = "Vouchers.CreateOutbound";
        public const string CreateReturn = "Vouchers.CreateReturn";
        public const string Cancel = "Vouchers.Cancel";
    }

    // 5. صلاحيات دفتر اليومية وسجل الحركات
    public static class Daybook
    {
        public const string View = "Daybook.View";
        public const string Export = "Daybook.Export";
    }

    // 6. صلاحيات إدارة المستخدمين وحسابات الموظفين
    public static class Users
    {
        public const string View = "Users.View";
        public const string Create = "Users.Create";
        public const string Manage = "Users.Manage";
        public const string AssignRoles = "Users.AssignRoles";
    }

    // 7. صلاحيات إدارة الأدوار ومصفوفة الصلاحيات (RBAC)
    public static class Roles
    {
        public const string View = "Roles.View";
        public const string Manage = "Roles.Manage";
    }

    // 8. صلاحيات الملف الشخصي والحساب
    public static class Profile
    {
        public const string View = "Profile.View";
        public const string Update = "Profile.Update";
        public const string UpdatePicture = "Profile.UpdatePicture";
        public const string ChangePassword = "Profile.ChangePassword";
    }

    // 9. صلاحيات إعدادات السيستم
    public static class Settings
    {
        public const string View = "Settings.View";
        public const string Manage = "Settings.Manage";
    }

    // كتالوج الصلاحيات الكامل ببياناته المعربة
    public static readonly IReadOnlyList<PermissionMeta> Catalog = new List<PermissionMeta>
    {
        // لوحة التحكم
        new(Dashboard.View, "عرض لوحة التحكم والمؤشرات", "لوحة التحكم", "الاطلاع على الإحصائيات العامة للمخزون، حركات اليوم، والتنبيهات السريعة"),

        // المنتجات التامة
        new(Products.View, "استعراض الأصناف والمنتجات التامة", "المنتجات التامة", "عرض قائمة المنتجات، تفاصيل الأصناف، والأرصدة المخزنية المتاحة"),
        new(Products.Create, "إضافة صنف جديد", "المنتجات التامة", "تسجيل أصناف ومنتجات جديدة بالمستودع وتحديد وحداتها ورصيدها الافتتاحي"),
        new(Products.Update, "تعديل بيانات صنف", "المنتجات التامة", "تعديل تفاصيل الصنف كالفئة أو مكان التخزين أو مواصفات المنتج"),
        new(Products.Delete, "حذف أو تعطيل صنف", "المنتجات التامة", "إمكانية إزالة صنف من النظام (في حالة عدم وجود حركات مرتبطة)"),
        new(Products.Export, "تصدير تقرير الأصناف", "المنتجات التامة", "طباعة وتصدير كشف جرد المنتجات التامة إلى ملفات PDF وExcel"),

        // فئات الأصناف
        new(Categories.View, "عرض فئات وتصنيفات المنتجات", "فئات الأصناف", "استعراض قائمة فئات الأصناف وتصنيفاتها المخزنية"),
        new(Categories.Create, "إضافة فئة تصنيف جديدة", "فئات الأصناف", "إنشاء أقسام وفئات جديدة لترتيب وتصنيف المنتجات"),
        new(Categories.Update, "تعديل فئة تصنيف", "فئات الأصناف", "تعديل أسماء وبيانات الفئات المسجلة"),
        new(Categories.Delete, "حذف فئة تصنيف", "فئات الأصناف", "إزالة فئة تصنيف لا تحتوي على منتجات مرتبطة"),

        // أذونات المخزن
        new(Vouchers.View, "عرض أذونات الوارد والمنصرف والمرتجع", "أذونات المخزن", "استعراض سجلات أذونات الاستلام والصرف والمرتجعات المخزنية وتفاصيل كل إذن"),
        new(Vouchers.CreateInbound, "تسجيل إذن وارد (استلام إنتاج)", "أذونات المخزن", "إنشاء وتوثيق إذن استلام بضاعة جديدة أو وارد إنتاج للمستودع"),
        new(Vouchers.CreateOutbound, "تسجيل إذن منصرف (صرف بضاعة)", "أذونات المخزن", "إنشاء وتوثيق إذن صرف بضاعة للعملاء أو جهات التسليم"),
        new(Vouchers.CreateReturn, "تسجيل إذن مرتجع", "أذونات المخزن", "إنشاء وتوثيق إذن استلام بضاعة مرتجعة أو رد بضاعة وضبط أرصدة المخزن"),
        new(Vouchers.Cancel, "إلغاء إذن مخزني", "أذونات المخزن", "إلغاء إذن وارد أو منصرف أو مرتجع وعكس تأثيره على رصيد المخزون"),

        // دفتر اليومية
        new(Daybook.View, "تصفح دفتر اليومية", "دفتر اليومية", "استعراض السجل الزمني لكافة حركات الوارد والمنصرف اليومية بالمستودع"),
        new(Daybook.Export, "تصدير وطباعة دفتر اليومية", "دفتر اليومية", "توليد وتصدير تقرير دفتر اليومية الشامل بصيغة PDF الرسمية"),

        // إدارة المستخدمين
        new(Users.View, "عرض حسابات الموظفين", "إدارة المستخدمين", "الاطلاع على قائمة مستخدمي النظام وحالة كل حساب"),
        new(Users.Create, "إضافة حساب موظف جديد", "إدارة المستخدمين", "إنشاء حسابات جديدة للموظفين وأمناء المخازن وتعيين بيانات الدخول"),
        new(Users.Manage, "تفعيل وتعطيل الحسابات", "إدارة المستخدمين", "التحكم في تنشيط أو إيقاف وصول الموظفين للنظام"),
        new(Users.AssignRoles, "إسناد وتغيير أدوار الموظفين", "إدارة المستخدمين", "تحديد الدور الوظيفي للموظف (مدير نظام / أمين مخزن)"),

        // الأدوار والصلاحيات
        new(Roles.View, "عرض مصفوفة الأدوار والصلاحيات", "الأدوار والصلاحيات", "استعراض الأدوار الوظيفية والصلاحيات الممنوحة لكل دور"),
        new(Roles.Manage, "تعديل وحفظ صلاحيات الأدوار", "الأدوار والصلاحيات", "منح أو سحب صلاحيات محددة من الأدوار الوظيفية في النظام"),

        // الملف الشخصي
        new(Profile.View, "عرض الملف الشخصي", "الملف الشخصي", "الاطلاع على بيانات المستخدم والبريد والصلاحيات الشخصية"),
        new(Profile.Update, "تعديل الملف الشخصي", "الملف الشخصي", "تحديث الاسم ورقم الهاتف والمعلومات الشخصية"),
        new(Profile.UpdatePicture, "تغيير الصورة الشخصية", "الملف الشخصي", "تحديث وتعيين الصورة الرمزية للمستخدم"),
        new(Profile.ChangePassword, "تغيير كلمة المرور", "الملف الشخصي", "تغيير كلمة المرور الخاصة بحساب المستخدم المسجل"),

        // إعدادات النظام
        new(Settings.View, "عرض إعدادات النظام", "إعدادات النظام", "استعراض الإعدادات العامة لتهيئة النظام"),
        new(Settings.Manage, "تعديل إعدادات النظام", "إعدادات النظام", "حفظ وتعديل المتغيرات الأساسية للنظام والمستودع")
    };

    // قائمة الصلاحيات الافتراضية لأمين المخزن
    public static readonly IReadOnlyList<string> WarehouseKeeperPermissions = new[]
    {
        Dashboard.View,
        Products.View,
        Products.Create,
        Products.Update,
        Products.Export,
        Categories.View,
        Vouchers.View,
        Vouchers.CreateInbound,
        Vouchers.CreateOutbound,
        Vouchers.CreateReturn,
        Daybook.View,
        Daybook.Export,
        Profile.View,
        Profile.Update,
        Profile.ChangePassword
    };

    // ميثود بتجيب كل الصلاحيات المعرفة في الكلاس ده باستخدام الـ Reflection عشان نستخدمها في الـ Seed
    public static IReadOnlyList<string> GetAllPermissions()
    {
        return Catalog.Select(c => c.Name).ToList().AsReadOnly();
    }
}
