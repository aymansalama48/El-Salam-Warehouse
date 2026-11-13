using System;
using System.Collections.Generic;
using System.Text;

namespace El_Salam_Warehouse.Domain.Enums
{
    // نوع الإذن
    public enum StockVoucherType
    {
        // إذن وارد (بيزوّد الرصيد)
        Inbound = 1,

        // إذن صرف (بينقّص الرصيد)
        Outbound = 2
    }
}
