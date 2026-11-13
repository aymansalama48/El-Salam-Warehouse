using System;
using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Enums;

namespace El_Salam_Warehouse.Api.Contracts.Products;

// بيانات إضافة منتج جديد اللي جاية من الفرونت (الفرونت بيبعت نوع المنتج والباك اند بيحدد الوحدات)
public record CreateProductRequest(
    string Name,                                  // اسم المنتج
    Guid CategoryId,                              // رقم الفئة
    ProductUnitType UnitType,                     // نوع المنتج (1 كشكول / 2 كراس / 3 ورق تصوير)
    int UnitsPerBaseUnit,                         // عدد الصغيرة في الكبيرة
    int InitialStock,                             // الرقم اللي المستخدم كتبه في خانة الرصيد الافتتاحي
    string? StorageLocation,                      // مكان التخزين (اختياري)
    StockEntryUnit? InitialStockUnit = null,      // وحدة الرصيد الافتتاحي (1 رزمة/قطعة / 2 كرتونة/باكو)
    int? LowStockThreshold = 0,                   // حد النواقص والتنبيه المخصص للصنف
    StockEntryUnit? LowStockThresholdUnit = null);// وحدة حد النواقص (1 كشكول/كراس/رزمة | 2 كرتونة)
