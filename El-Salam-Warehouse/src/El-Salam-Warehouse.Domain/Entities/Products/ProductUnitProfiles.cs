using System;
using System.Collections.Generic;
using El_Salam_Warehouse.Domain.Enums;

namespace El_Salam_Warehouse.Domain.Entities.Products;

// ريكورد بيوصف خصائص كل نوع منتج (اسمه للعرض، وحدته الكبيرة، وحدته الصغيرة، ووحدة تسجيل الإذن)
public record ProductUnitProfile(
    string DisplayName,
    string BaseUnit,
    string SubUnit,
    StockEntryUnit EntryUnit);

// الكلاس الثابت اللي فيه تعريف كل نوع منتج ووحداته وهو المصدر الوحيد للقواعد دي
public static class ProductUnitProfiles
{
    // القاموس اللي شايل تعريفات التلات أنواع
    private static readonly Dictionary<ProductUnitType, ProductUnitProfile> Profiles = new()
    {
        [ProductUnitType.Notebook] = new ProductUnitProfile("كشكول", "باكو", "كشكول", StockEntryUnit.SubUnit),
        [ProductUnitType.Booklet] = new ProductUnitProfile("كراس", "باكو", "كراس", StockEntryUnit.SubUnit),
        [ProductUnitType.CopyPaper] = new ProductUnitProfile("ورق تصوير", "كرتونة", "رزمة", StockEntryUnit.BaseUnit)
    };

    // ميثود بتجيب بروفايل الوحدات لأي نوع منتج يتبعتلها
    public static ProductUnitProfile Get(ProductUnitType unitType)
    {
        if (Profiles.TryGetValue(unitType, out var profile))
        {
            return profile;
        }

        throw new ArgumentOutOfRangeException(nameof(unitType), $"نوع المنتج ده مش متعرف: {unitType}");
    }

    // ميثود بترجع كل البروفايلات المعرفة في النظام
    public static IReadOnlyDictionary<ProductUnitType, ProductUnitProfile> GetAll() => Profiles;
}

