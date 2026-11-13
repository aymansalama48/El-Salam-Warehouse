using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace El_Salam_Warehouse.Infrastructure.Persistence.Configurations;

// إعدادات جدول المنتجات في قاعدة البيانات
public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");
        // الحقول المحسوبة مش بتتخزن في الداتابيز
        builder.Ignore(p => p.FullBaseUnits);
        builder.Ignore(p => p.RemainingSubUnits);
        builder.Ignore(p => p.LowStockThresholdSubUnits);

        // نسخة الصف (للـ Concurrency)
        builder.Property(p => p.RowVersion).IsRowVersion();

        // نوع المنتج الصريح (إجباري)
        builder.Property(p => p.UnitType).IsRequired();

        // وحدة تسجيل الإذونات
        builder.Property(p => p.EntryUnit).IsRequired();

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.BaseUnit)
            .IsRequired()
            .HasMaxLength(50); // باكو، كرتونة

        builder.Property(p => p.SubUnit)
            .IsRequired()
            .HasMaxLength(50); // كشكول، كراس، رزمة

        builder.Property(p => p.StorageLocation)
            .HasMaxLength(150);

        // حد النواقص المخصص لكل صنف
        builder.Property(p => p.LowStockThreshold)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(p => p.LowStockThresholdUnit)
            .IsRequired()
            .HasDefaultValue(StockEntryUnit.SubUnit);

        builder.Property(p => p.DisplayOrder)
            .IsRequired()
            .HasDefaultValue(0);

        // إعداد العلاقة بين المنتج والفئة (One-to-Many)
        builder.HasOne(p => p.Category)
            .WithMany()
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict); // منع حذف فئة لو فيها منتجات
    }
}
