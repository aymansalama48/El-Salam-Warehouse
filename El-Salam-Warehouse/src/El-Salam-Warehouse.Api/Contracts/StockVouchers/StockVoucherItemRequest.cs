using El_Salam_Warehouse.Domain.Entities.StockVouchers;
using El_Salam_Warehouse.Domain.Enums;

namespace El_Salam_Warehouse.Api.Contracts.StockVouchers;

// صنف في الإذن (يدعم تحديد الوحدة: رزمة أو كرتونة لورق التصوير)
public record StockVoucherItemRequest(
    Guid ProductId,
    int Quantity,
    StockEntryUnit? EntryUnit = null);

// إنشاء إذن
public record CreateStockVoucherRequest(
    StockVoucherType Type,            // 1 وارد | 2 صرف | 3 مرتجع | 4 عجز
    DateOnly? Date,                   // اختياري (الافتراضي النهاردة)
    VoucherSource Source,             // 1 خارجي | 2 صالة الإنتاج
    string? PartyName,
    string ReceiverName,
    string? DelivererName,
    string? Notes,
    List<StockVoucherItemRequest> Items,
    ReturnDirection? ReturnDirection = null,
    string? ReturnReason = null,
    string? ShortageReason = null);

// إلغاء إذن
public record CancelStockVoucherRequest(string Reason);