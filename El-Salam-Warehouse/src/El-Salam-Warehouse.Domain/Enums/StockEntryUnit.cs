using System;
using System.Collections.Generic;
using System.Text;

namespace El_Salam_Warehouse.Domain.Enums
{

    // المستخدم دخل الرصيد الافتتاحي بأنهي وحدة؟
    public enum StockEntryUnit
    {
        // دخل عدد القطع الصغيرة (مثال: 500 كشكول) - حالة الباكو
        SubUnit = 1,

        // دخل عدد الوحدات الكبيرة (مثال: 50 كرتونة) - حالة الكرتونة
        BaseUnit = 2
    }
}
