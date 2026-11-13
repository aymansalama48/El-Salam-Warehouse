using System;
using System.Collections.Generic;
using System.Text;

namespace El_Salam_Warehouse.Domain.Enums
{

    // حالة الإذن
    public enum StockVoucherStatus
    {
        // فعّال
        Active = 1,

        // ملغي (الرصيد اتعكس)
        Cancelled = 2
    }
}
