using El_Salam_Warehouse.Domain.Common.Entities;
using El_Salam_Warehouse.Domain.Enums;

namespace El_Salam_Warehouse.Domain.Entities.StockVouchers;

// إذن مخزني (وارد أو صرف) - الهيدر
public class StockVoucher : AuditableEntity
{
    // رقم الإذن (IN-2026-0001 / OUT-2026-0001)
    public string VoucherNumber { get; private set; } = string.Empty;

    // نوع الإذن
    public StockVoucherType Type { get; private set; }

    // اتجاه حركة المرتجع (وارد / منصرف) - خاص بأذونات المرتجع
    public ReturnDirection? ReturnDirection { get; private set; }

    // سبب الإرجاع (خاص بأذونات المرتجع)
    public string? ReturnReason { get; private set; }

    // سبب وبيان العجز (خاص بأذونات العجز والتسويات)
    public string? ShortageReason { get; private set; }

    // تاريخ الإذن (يوم العمل)
    public DateOnly VoucherDate { get; private set; }

    // وقت إنشاء الإذن فعلياً (UTC) - للترتيب جوه اليوم
    public DateTime OccurredAtUtc { get; private set; }

    // المصدر (خارجي / صالة الإنتاج)
    public VoucherSource Source { get; private set; }

    // اسم الجهة الخارجية (مورّد / عميل)
    public string? PartyName { get; private set; }

    // اسم المستلم
    public string ReceiverName { get; private set; } = string.Empty;

    // اسم الجايب (للوارد الخارجي)
    public string? DelivererName { get; private set; }

    // ملاحظات
    public string? Notes { get; private set; }

    // الحالة
    public StockVoucherStatus Status { get; private set; }

    // سبب الإلغاء
    public string? CancelReason { get; private set; }

    // وقت الإلغاء (UTC)
    public DateTime? CancelledAtUtc { get; private set; }

    // بنود الإذن
    private readonly List<StockVoucherItem> _items = new();
    public IReadOnlyCollection<StockVoucherItem> Items => _items;

    // كونستركتور فاضي للـ EF Core
    private StockVoucher() { }

    // إنشاء إذن جديد
    public StockVoucher(
        string voucherNumber,
        StockVoucherType type,
        DateOnly voucherDate,
        VoucherSource source,
        string? partyName,
        string receiverName,
        string? delivererName,
        string? notes,
        ReturnDirection? returnDirection = null,
        string? returnReason = null,
        string? shortageReason = null,
        DateTime? occurredAtUtc = null)
    {
        VoucherNumber = voucherNumber;
        Type = type;
        VoucherDate = voucherDate;
        Source = source;
        PartyName = partyName;
        ReceiverName = receiverName;
        DelivererName = delivererName;
        Notes = notes;
        ReturnDirection = returnDirection;
        ReturnReason = returnReason;
        ShortageReason = shortageReason;
        Status = StockVoucherStatus.Active;
        OccurredAtUtc = occurredAtUtc ?? DateTime.UtcNow;
    }

    // إضافة بند للإذن
    public void AddItem(StockVoucherItem item)
    {
        _items.Add(item);
    }

    // إلغاء الإذن (عكس الرصيد بيتم في الـ Handler)
    public void Cancel(string reason, DateTime? cancelledAtUtc = null)
    {
        Status = StockVoucherStatus.Cancelled;
        CancelReason = reason;
        CancelledAtUtc = cancelledAtUtc ?? DateTime.UtcNow;
    }
}