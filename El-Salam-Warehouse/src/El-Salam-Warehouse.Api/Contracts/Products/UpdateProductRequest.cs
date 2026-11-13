using System;
using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Enums;

namespace El_Salam_Warehouse.Api.Contracts.Products;

// بيانات تعديل المنتج اللي جاية من الفرونت
public record UpdateProductRequest(
    string Name,                                  // اسم المنتج
    Guid CategoryId,                              // رقم الفئة
    ProductUnitType UnitType,                     // نوع المنتج (1 كشكول / 2 كراس / 3 ورق تصوير)
    int UnitsPerBaseUnit,                         // عدد الصغيرة في الكبيرة
    string? StorageLocation,                      // مكان التخزين
    int? LowStockThreshold = null,                // حد التنبيه بالنواقص المخصص
    StockEntryUnit? LowStockThresholdUnit = null);// وحدة حد التنبيه (1 كشكول/كراس/رزمة | 2 كرتونة)
