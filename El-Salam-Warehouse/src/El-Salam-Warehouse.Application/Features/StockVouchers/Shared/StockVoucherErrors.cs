using El_Salam_Warehouse.Domain.Common.Results;

namespace El_Salam_Warehouse.Application.Features.StockVouchers.Shared;

// أخطاء الإذونات
public static class StockVoucherErrors
{
    // الإذن مش موجود
    public static readonly Error NotFound = new(
        "StockVoucher.NotFound", "الإذن المحدد غير موجود.", ErrorType.NotFound);

    // الإذن ملغي قبل كده
    public static readonly Error AlreadyCancelled = new(
        "StockVoucher.AlreadyCancelled", "هذا الإذن ملغي بالفعل.", ErrorType.Conflict);

    // حصل تعديل في نفس اللحظة
    public static readonly Error ConcurrencyConflict = new(
        "StockVoucher.ConcurrencyConflict", "تم تعديل رصيد أحد الأصناف في نفس اللحظة، يرجى المحاولة مرة أخرى.", ErrorType.Conflict);

    // الرصيد مش كفاية للصرف
    public static Error InsufficientStock(string productName, int available, int requested, string unit) => new(
        "StockVoucher.InsufficientStock",
        $"الرصيد المتاح من «{productName}» هو {available} {unit} والمطلوب {requested} {unit}.",
        ErrorType.Conflict);

    // صالة الإنتاج بتورد كشاكيل وكراريس بس
    public static Error ProductionHallNotebooksOnly(string productName) => new(
        "StockVoucher.ProductionHallNotebooksOnly",
        $"صالة الإنتاج تورّد الكشاكيل والكراريس فقط، والصنف «{productName}» غير مسموح.",
        ErrorType.Conflict);

    // مينفعش نلغي وارد لأن بضاعته اتصرفت
    public static Error CannotCancelInbound(string productName) => new(
        "StockVoucher.CannotCancelInbound",
        $"لا يمكن إلغاء الإذن لأن رصيد «{productName}» الحالي أقل من الكمية الواردة (تم صرف جزء منها).",
        ErrorType.Conflict);
}