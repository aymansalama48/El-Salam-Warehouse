using System;
using El_Salam_Warehouse.Domain.Common.Entities;
using El_Salam_Warehouse.Domain.Entities.Categories;
using El_Salam_Warehouse.Domain.Enums;

namespace El_Salam_Warehouse.Domain.Entities.Products;

// كلاس المنتج (الصنف) في المخزن
public class Product : AuditableEntity
{
    // اسم المنتج
    public string Name { get; private set; } = string.Empty;

    // رقم الفئة
    public Guid CategoryId { get; private set; }

    // الفئة نفسها
    public Category Category { get; private set; } = null!;

    // نوع المنتج الصريح (كشكول / كراس / ورق تصوير)
    public ProductUnitType UnitType { get; private set; }

    // الوحدة الكبيرة (باكو / كرتونة) - بتتحدد تلقائياً من نوع المنتج
    public string BaseUnit { get; private set; } = string.Empty;

    // الوحدة الصغيرة (كشكول / كراس / رزمة) - بتتحدد تلقائياً من نوع المنتج
    public string SubUnit { get; private set; } = string.Empty;

    // عدد الصغيرة في الكبيرة
    public int UnitsPerBaseUnit { get; private set; }

    // الإذونات والرصيد بتتسجل بأنهي وحدة؟ (كشكول وكراس = SubUnit | كرتونة = BaseUnit)
    public StockEntryUnit EntryUnit { get; private set; }

    // الرصيد الفعلي بأصغر وحدة (الرقم الوحيد اللي بيتخزن)
    public int TotalSubUnitStock { get; private set; }

    // حد التنبيه للنواقص (الرقم المكتوب من المستخدم)
    public int LowStockThreshold { get; private set; }

    // وحدة حد التنبيه (1 رزمة/كشكول/كراس | 2 كرتونة)
    public StockEntryUnit LowStockThresholdUnit { get; private set; }

    // مكان التخزين
    public string? StorageLocation { get; private set; }

    // ترتيب العرض (لإمكانية السحب والإفلات والترتيب المخصص)
    public int DisplayOrder { get; private set; }

    // نسخة الصف (بتمنع إن إذنين يسحبوا نفس الرصيد في نفس اللحظة)
    public byte[] RowVersion { get; private set; } = default!;

    // عدد الباكو/الكراتين الكاملة (بيتحسب ومش بيتخزن)
    public int FullBaseUnits => UnitsPerBaseUnit > 0 ? TotalSubUnitStock / UnitsPerBaseUnit : 0;

    // القطع السايبة (بيتحسب ومش بيتخزن)
    public int RemainingSubUnits => UnitsPerBaseUnit > 0 ? TotalSubUnitStock % UnitsPerBaseUnit : 0;

    // اسم الوحدة اللي بتتسجل بيها الإذونات (كشكول / كراس / كرتونة)
    public string EntryUnitLabel => EntryUnit == StockEntryUnit.BaseUnit ? BaseUnit : SubUnit;

    // حد التنبيه الفعلي بأصغر وحدة (بيتحسب ومش بيتخزن)
    public int LowStockThresholdSubUnits =>
        (LowStockThresholdUnit == StockEntryUnit.BaseUnit && UnitsPerBaseUnit > 0)
            ? LowStockThreshold * UnitsPerBaseUnit
            : LowStockThreshold;

    // كونستركتور فاضي للـ EF Core
    private Product() { }

    // كونستركتور إنشاء منتج جديد بنوع المنتج والوحدات التلقائية وحد النواقص المخصص
    public Product(
        string name,
        Guid categoryId,
        ProductUnitType unitType,
        int unitsPerBaseUnit,
        int initialTotalSubUnitStock,
        string? storageLocation,
        int lowStockThreshold = 0,
        StockEntryUnit? lowStockThresholdUnit = null)
    {
        Name = name;
        CategoryId = categoryId;
        UnitsPerBaseUnit = unitsPerBaseUnit;
        TotalSubUnitStock = initialTotalSubUnitStock;
        StorageLocation = storageLocation;

        ApplyUnitType(unitType);
        SetLowStockThreshold(lowStockThreshold, lowStockThresholdUnit);
    }

    // ميثود خاصة بتحدد الوحدات المناسبة من بروفايل النوع
    private void ApplyUnitType(ProductUnitType unitType)
    {
        UnitType = unitType;
        var profile = ProductUnitProfiles.Get(unitType);
        BaseUnit = profile.BaseUnit;
        SubUnit = profile.SubUnit;
        EntryUnit = profile.EntryUnit;
    }

    // ميثود عامة لتغيير نوع المنتج وتحديث كل وحداته
    public void ChangeUnitType(ProductUnitType newUnitType)
    {
        ApplyUnitType(newUnitType);
    }

    // تعيين حد التنبيه بالنواقص للصنف
    public void SetLowStockThreshold(int threshold, StockEntryUnit? unit = null)
    {
        LowStockThreshold = Math.Max(0, threshold);
        // للكشاكيل والكراريس دايماً أصغر وحدة (كشكول أو كراس)، ولورق التصوير يقدر يختار كرتونة أو رزمة
        if (UnitType != ProductUnitType.CopyPaper)
        {
            LowStockThresholdUnit = StockEntryUnit.SubUnit;
        }
        else
        {
            LowStockThresholdUnit = unit ?? StockEntryUnit.BaseUnit;
        }
    }

    // تعيين ترتيب العرض
    public void SetDisplayOrder(int order)
    {
        DisplayOrder = order;
    }

    // تعديل بيانات المنتج الأساسية وحد التنبيه
    public void Update(
        string name,
        Guid categoryId,
        int unitsPerBaseUnit,
        string? storageLocation,
        int? lowStockThreshold = null,
        StockEntryUnit? lowStockThresholdUnit = null)
    {
        Name = name;
        CategoryId = categoryId;
        UnitsPerBaseUnit = unitsPerBaseUnit;
        StorageLocation = storageLocation;

        if (lowStockThreshold.HasValue)
        {
            SetLowStockThreshold(lowStockThreshold.Value, lowStockThresholdUnit);
        }
    }

    // حساب حالة المخزون الخاصة بالصنف بناءً على حده المخصص
    public ProductStockStatus CalculateStockStatus()
    {
        if (TotalSubUnitStock <= 0)
            return ProductStockStatus.OutOfStock;

        var threshold = LowStockThresholdSubUnits;
        if (threshold > 0 && TotalSubUnitStock <= threshold)
            return ProductStockStatus.LowStock;

        return ProductStockStatus.InStock;
    }

    // تحويل الكمية اللي اتكتبت في الإذن لأصغر وحدة (كراتين × رزم | كشاكيل وكراريس زي ما هي)
    public int ConvertToSubUnits(int enteredQuantity)
    {
        return EntryUnit == StockEntryUnit.BaseUnit
            ? checked(enteredQuantity * UnitsPerBaseUnit)
            : enteredQuantity;
    }

    // تحويل كمية بأصغر وحدة لوحدة الإذن (للعرض في رسائل الأخطاء)
    public int ToEntryUnits(int subUnits)
    {
        return EntryUnit == StockEntryUnit.BaseUnit && UnitsPerBaseUnit > 0
            ? subUnits / UnitsPerBaseUnit
            : subUnits;
    }

    // زيادة الرصيد (وارد)
    public void IncreaseStock(int subUnitQuantity)
    {
        TotalSubUnitStock = checked(TotalSubUnitStock + subUnitQuantity);
    }

    // إنقاص الرصيد (صرف) - مينفعش يبقى سالب
    public void DecreaseStock(int subUnitQuantity)
    {
        if (subUnitQuantity > TotalSubUnitStock)
            throw new InvalidOperationException("الرصيد غير كافٍ.");

        TotalSubUnitStock -= subUnitQuantity;
    }
}
