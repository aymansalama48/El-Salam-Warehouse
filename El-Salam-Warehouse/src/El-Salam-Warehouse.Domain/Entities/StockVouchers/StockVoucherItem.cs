using El_Salam_Warehouse.Domain.Common.Entities;
using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Enums;

namespace El_Salam_Warehouse.Domain.Entities.StockVouchers;

// بند في إذن مخزني (صنف واحد)
public class StockVoucherItem : AuditableEntity
{
    // رقم الإذن
    public Guid VoucherId { get; private set; }

    // الإذن نفسه
    public StockVoucher Voucher { get; private set; } = null!;

    // رقم المنتج
    public Guid ProductId { get; private set; }

    // المنتج نفسه
    public Product Product { get; private set; } = null!;

    // اسم المنتج وقت الإذن (نسخة ثابتة للطباعة)
    public string ProductName { get; private set; } = string.Empty;

    // اسم وحدة الإذن وقتها (كشكول / كرتونة)
    public string UnitLabel { get; private set; } = string.Empty;

    // الإذن اتسجل بأنهي وحدة
    public StockEntryUnit EntryUnit { get; private set; }

    // الكمية زي ما اتكتبت (500 كشكول / 50 كرتونة)
    public int Quantity { get; private set; }

    // الكمية بأصغر وحدة (دايماً موجبة، الاتجاه من نوع الإذن)
    public int QuantitySubUnits { get; private set; }

    // رصيد المنتج قبل الإذن (بأصغر وحدة)
    public int BalanceBeforeSubUnits { get; private set; }

    // رصيد المنتج بعد الإذن (بأصغر وحدة)
    public int BalanceAfterSubUnits { get; private set; }

    // كونستركتور فاضي للـ EF Core
    private StockVoucherItem() { }

    // إنشاء بند جديد
    public StockVoucherItem(
        Guid productId,
        string productName,
        string unitLabel,
        StockEntryUnit entryUnit,
        int quantity,
        int quantitySubUnits,
        int balanceBeforeSubUnits,
        int balanceAfterSubUnits)
    {
        ProductId = productId;
        ProductName = productName;
        UnitLabel = unitLabel;
        EntryUnit = entryUnit;
        Quantity = quantity;
        QuantitySubUnits = quantitySubUnits;
        BalanceBeforeSubUnits = balanceBeforeSubUnits;
        BalanceAfterSubUnits = balanceAfterSubUnits;
    }
}