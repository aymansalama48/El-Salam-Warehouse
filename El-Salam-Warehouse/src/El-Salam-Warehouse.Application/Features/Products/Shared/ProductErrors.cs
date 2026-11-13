using El_Salam_Warehouse.Domain.Common.Results;

namespace El_Salam_Warehouse.Application.Features.Products.Shared;

// رسائل وأكواد أخطاء المنتجات
public static class ProductErrors
{
    // المنتج مش موجود في الداتابيز
    public static readonly Error NotFound = new(
        "Product.NotFound", "المنتج المحدد غير موجود في النظام.", ErrorType.NotFound);

    // اسم المنتج متسجل قبل كده
    public static readonly Error NameAlreadyExists = new(
        "Product.NameAlreadyExists", "اسم المنتج مسجل بالفعل، يرجى اختيار اسم آخر.", ErrorType.Conflict);

    // مينفعش نحذف منتج عليه حركات
    public static readonly Error HasMovements = new(
        "Product.HasMovements", "لا يمكن حذف المنتج لأنه مرتبط بإذونات وارد أو صرف.", ErrorType.Conflict);

    // مينفعش نغير بين كشكول/كراس وورق التصوير لاختلاف وحدة الإدخال وطريقة حساب الرصيد
    public static readonly Error UnitTypeChangeNotAllowed = new(
        "Product.UnitTypeChangeNotAllowed",
        "لا يمكن تغيير نوع المنتج بين (كشكول / كراس) و (ورق التصوير) لأن طريقة تسجيل الرصيد مختلفة.",
        ErrorType.Conflict);
}
