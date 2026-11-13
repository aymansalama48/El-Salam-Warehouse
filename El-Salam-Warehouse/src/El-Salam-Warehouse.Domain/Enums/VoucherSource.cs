using System;
using System.Collections.Generic;
using System.Text;

namespace El_Salam_Warehouse.Domain.Enums
{
    // مصدر الإذن
    public enum VoucherSource
    {
        // جهة خارجية (مورّد / عميل)
        External = 1,

        // صالة الإنتاج (وارد كشاكيل وكراريس بس)
        ProductionHall = 2
    }
}
