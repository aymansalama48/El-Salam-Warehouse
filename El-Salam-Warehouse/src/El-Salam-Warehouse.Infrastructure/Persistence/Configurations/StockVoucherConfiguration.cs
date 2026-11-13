using El_Salam_Warehouse.Domain.Entities.StockVouchers;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace El_Salam_Warehouse.Infrastructure.Persistence.Configurations;

// إعدادات جدول الإذونات
public class StockVoucherConfiguration : IEntityTypeConfiguration<StockVoucher>
{
    public void Configure(EntityTypeBuilder<StockVoucher> builder)
    {
        builder.ToTable("StockVouchers");
        builder.HasKey(v => v.Id);

        builder.Property(v => v.VoucherNumber).IsRequired().HasMaxLength(30);
        builder.HasIndex(v => v.VoucherNumber).IsUnique();   // رقم الإذن مينفعش يتكرر

        builder.Property(v => v.PartyName).HasMaxLength(150);
        builder.Property(v => v.ReceiverName).IsRequired().HasMaxLength(150);
        builder.Property(v => v.DelivererName).HasMaxLength(150);
        builder.Property(v => v.Notes).HasMaxLength(500);
        builder.Property(v => v.ReturnReason).HasMaxLength(250);
        builder.Property(v => v.CancelReason).HasMaxLength(300);

        // فهرس للفلاتر
        builder.HasIndex(v => new { v.Type, v.VoucherDate });

        // البنود
        builder.HasMany(v => v.Items)
            .WithOne(i => i.Voucher)
            .HasForeignKey(i => i.VoucherId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(v => v.Items).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}