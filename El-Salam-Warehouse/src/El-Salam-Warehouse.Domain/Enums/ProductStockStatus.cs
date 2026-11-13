using System;
using System.Collections.Generic;
using System.Text;

namespace El_Salam_Warehouse.Domain.Enums
{

    // حالة المنتج في المخزن (بتتحسب من الرصيد ومش بتتخزن)
    public enum ProductStockStatus
    {
        // متوفر
        InStock = 1,

        // رصيد منخفض
        LowStock = 2,

        // نفد
        OutOfStock = 3
    }
}
