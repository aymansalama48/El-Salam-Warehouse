namespace El_Salam_Warehouse.Domain.Constants;

// كلاس ثابت بيحدد كل الـ Roles المتاحة في سيستم المخزن
public static class Roles
{
    // رول الأدمن - معاه كل الصلاحيات في السيستم
    public const string Admin = "Admin";

    // رول أمين المخزن - المسؤول عن حركة واستلام وصرف البضاعة
    public const string WarehouseKeeper = "WarehouseKeeper";

    // TODO: صلاحيات المخزن الخاصة بأمين المخزن (زي المنتجات والمخزون وأذونات الصرف) هتتضاف أول ما نبدأ نبني الـ Features الخاصة بيهم

    // قائمة فيها كل الرولات المعرفة في السيستم عشان نستعملها في الـ Seed أو التحقق
    public static readonly IReadOnlyList<string> All = new[]
    {
        Admin,
        WarehouseKeeper
    };
}
