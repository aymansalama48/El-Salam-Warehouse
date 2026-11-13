namespace El_Salam_Warehouse.Infrastructure.Persistence.Configurations;

using El_Salam_Warehouse.Domain.Entities.Settings;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;

// إعدادات جدول SiteSetting في قاعدة البيانات
public class SiteSettingConfiguration : IEntityTypeConfiguration<SiteSetting>
{
    public void Configure(EntityTypeBuilder<SiteSetting> builder)
    {
        // المفتاح الأساسي للجدول
        builder.HasKey(x => x.Id);
        
        // إعدادات الأعمدة
        builder.Property(x => x.WarehouseName).IsRequired().HasMaxLength(100);
        builder.Property(x => x.ContactEmail).HasMaxLength(150);
        builder.Property(x => x.PhoneNumber).HasMaxLength(20);
        builder.Property(x => x.Address).HasMaxLength(500);
        builder.Property(x => x.Currency).IsRequired().HasMaxLength(10);
        builder.Property(x => x.ThemeColor).HasMaxLength(20);
        builder.Property(x => x.LogoUrl).HasMaxLength(1000);
        
        // بذر الإعدادات الافتراضية الأولية للنظام
        builder.HasData(new SiteSetting
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WarehouseName = "El_Salam_Warehouse",
            Currency = "EGP",
            ThemeColor = "#1E88E5",
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}
