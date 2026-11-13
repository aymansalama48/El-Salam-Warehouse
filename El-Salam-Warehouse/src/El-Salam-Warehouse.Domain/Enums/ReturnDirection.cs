namespace El_Salam_Warehouse.Domain.Enums;

// اتجاه حركة المرتجع
public enum ReturnDirection
{
    // استلام مرتجع (وارد إلى المخزن من عميل أو صالة - زيادة الرصيد)
    Inbound = 1,

    // رد مرتجع (منصرف من المخزن إلى مورد أو جهة - خصم الرصيد)
    Outbound = 2
}
