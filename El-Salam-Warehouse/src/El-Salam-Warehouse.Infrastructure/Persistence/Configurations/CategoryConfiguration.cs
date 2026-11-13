using El_Salam_Warehouse.Domain.Entities.Categories;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace El_Salam_Warehouse.Infrastructure.Persistence.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.Description)
            .HasMaxLength(500);

        builder.Property(c => c.ColorHex)
            .IsRequired()
            .HasMaxLength(7); // #FFFFFF

        builder.Property(c => c.DisplayOrder)
            .IsRequired()
            .HasDefaultValue(0);
    }
}