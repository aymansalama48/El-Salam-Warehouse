using El_Salam_Warehouse.Infrastructure.Persistence.IdentityModels;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace El_Salam_Warehouse.Infrastructure.Persistence.Configurations;

internal class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.Property(u => u.FirstName)
               .IsRequired()
               .HasMaxLength(100);

        builder.Property(u => u.MiddleName)
               .HasMaxLength(100)
               .IsRequired(false);

        builder.Property(u => u.LastName)
               .IsRequired()
               .HasMaxLength(100);

        builder.Property(u => u.AvatarUrl)
               .HasMaxLength(500)
               .IsRequired(false);
    }
}