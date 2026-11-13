using El_Salam_Warehouse.Domain.Enums;

namespace El_Salam_Warehouse.Domain.Entities.Products;

// ثوابت وقواعد خاصة بالمنتجات والمخزون
public static class ProductRules
{
    // حد التنبيه الافتراضي للنواقص بالباكو (للكشاكيل والكراريس)
    public static int LowStockThresholdPackets { get; set; } = 100;

    // حد التنبيه الافتراضي للنواقص بالكرتونة (لورق التصوير)
    public static int LowStockThresholdCartons { get; set; } = 50;

    // اسم وحدة الباكو (للكشاكيل والكراريس)
    public const string PacketUnit = "باكو";

    // اسم وحدة الكرتونة (لورق التصوير)
    public const string CartonUnit = "كرتونة";

    // حساب حالة المخزون بناءً على حد الصنف المخصص بأصغر وحدة (SubUnit)
    public static ProductStockStatus CalculateStockStatus(
        ProductUnitType unitType,
        int totalSubUnitStock,
        int unitsPerBaseUnit,
        int lowStockThresholdSubUnits)
    {
        if (totalSubUnitStock <= 0)
            return ProductStockStatus.OutOfStock;

        // إذا كان هناك حد مخصص أكبر من صفر
        if (lowStockThresholdSubUnits > 0 && totalSubUnitStock <= lowStockThresholdSubUnits)
            return ProductStockStatus.LowStock;

        // في حال لم يحدد حد خاص، نرجع للافتراضي
        if (lowStockThresholdSubUnits <= 0 && unitsPerBaseUnit > 0)
        {
            var fullBaseUnits = totalSubUnitStock / unitsPerBaseUnit;
            var defaultThreshold = unitType == ProductUnitType.CopyPaper
                ? LowStockThresholdCartons
                : LowStockThresholdPackets;

            if (fullBaseUnits <= defaultThreshold)
                return ProductStockStatus.LowStock;
        }

        return ProductStockStatus.InStock;
    }

    // حساب الحالة بالاعتماد على الحدود العامة (للتوافق)
    public static ProductStockStatus CalculateStockStatus(ProductUnitType unitType, int totalSubUnitStock, int unitsPerBaseUnit)
    {
        return CalculateStockStatus(unitType, totalSubUnitStock, unitsPerBaseUnit, 0);
    }

    public static bool IsOutOfStock(int totalSubUnitStock) => totalSubUnitStock <= 0;

    // فحص انخفاض المخزون بناءً على حد الصنف المخصص
    public static bool IsLowStock(int totalSubUnitStock, int lowStockThresholdSubUnits)
    {
        if (totalSubUnitStock <= 0) return false;
        return lowStockThresholdSubUnits > 0 && totalSubUnitStock <= lowStockThresholdSubUnits;
    }

    public static bool IsLowStock(ProductUnitType unitType, int totalSubUnitStock, int unitsPerBaseUnit)
    {
        if (totalSubUnitStock <= 0 || unitsPerBaseUnit <= 0) return false;

        var fullBaseUnits = totalSubUnitStock / unitsPerBaseUnit;
        var threshold = unitType == ProductUnitType.CopyPaper
            ? LowStockThresholdCartons
            : LowStockThresholdPackets;

        return fullBaseUnits <= threshold;
    }
}
