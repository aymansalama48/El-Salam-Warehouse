using El_Salam_Warehouse.Domain.Entities.StockVouchers;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace El_Salam_Warehouse.Infrastructure.Persistence.Configurations;

// إعدادات جدول بنود الإذونات
public class StockVoucherItemConfiguration : IEntityTypeConfiguration<StockVoucherItem>
{
    public void Configure(EntityTypeBuilder<StockVoucherItem> builder)
    {
        builder.ToTable("StockVoucherItems");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.ProductName).IsRequired().HasMaxLength(200);
        builder.Property(i => i.UnitLabel).IsRequired().HasMaxLength(50);

        // المنتج: مينفعش يتحذف لو عليه حركات
        builder.HasOne(i => i.Product)
            .WithMany()
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(i => i.ProductId);
    }
}