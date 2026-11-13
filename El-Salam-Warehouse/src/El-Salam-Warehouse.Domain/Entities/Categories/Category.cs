using El_Salam_Warehouse.Domain.Common.Entities;

namespace El_Salam_Warehouse.Domain.Entities.Categories;

public class Category : AuditableEntity
{
    // اسم الفئة (مطلوب)
    public string Name { get; private set; } = string.Empty;

    // وصف الفئة (اختياري)
    public string? Description { get; private set; }

    // لون التمييز (مثال: #FF5733)
    public string ColorHex { get; private set; } = "#3B82F6"; // لون أزرق افتراضي

    // ترتيب العرض (لإمكانية السحب والإفلات والترتيب المخصص)
    public int DisplayOrder { get; private set; }

    // بناء الكائن (Constructor)
    private Category() { }

    public Category(string name, string? description, string colorHex, int displayOrder = 0)
    {
        Name = name;
        Description = description;
        ColorHex = colorHex;
        DisplayOrder = displayOrder;
    }

    // دالة التعديل
    public void Update(string name, string? description, string colorHex)
    {
        Name = name;
        Description = description;
        ColorHex = colorHex;
    }

    // تعيين ترتيب العرض
    public void SetDisplayOrder(int order)
    {
        DisplayOrder = order;
    }
}
