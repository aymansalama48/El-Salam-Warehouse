namespace El_Salam_Warehouse.Domain.Entities.Products;

// أنواع وحدات المنتجات اللي في السيستم (كشكول / كراس / ورق تصوير)
public enum ProductUnitType
{
    // كشكول: بيتباع بالباكو وبيتسجل بعدد الكشاكيل
    Notebook = 1,

    // كراس: بيتباع بالباكو وبيتسجل بعدد الكراريس
    Booklet = 2,

    // ورق تصوير: بيتباع بالكرتونة وبيتسجل بعدد الكراتين
    CopyPaper = 3
}

