using System;
using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Enums;

namespace El_Salam_Warehouse.Application.Features.Products.Shared;

// بيانات المنتج اللي بتتبعت للفرونت
public record ProductDto(
    Guid Id,
    string Name,
    Guid CategoryId,
    string CategoryName,
    string BaseUnit,
    string SubUnit,
    int UnitsPerBaseUnit,
    StockEntryUnit EntryUnit,     // الإذونات بتتسجل بأنهي وحدة (1 صغيرة / 2 كبيرة)
    ProductUnitType UnitType,     // نوع المنتج الصريح (1 كشكول / 2 كراس / 3 ورق تصوير)
    int TotalSubUnitStock,
    int FullBaseUnits,
    int RemainingSubUnits,
    ProductStockStatus Status,
    string? StorageLocation,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    string? CreatedByName,
    string? UpdatedByName,
    int LowStockThreshold = 0,
    StockEntryUnit LowStockThresholdUnit = StockEntryUnit.SubUnit,
    int LowStockThresholdSubUnits = 0,
    int DisplayOrder = 0);
