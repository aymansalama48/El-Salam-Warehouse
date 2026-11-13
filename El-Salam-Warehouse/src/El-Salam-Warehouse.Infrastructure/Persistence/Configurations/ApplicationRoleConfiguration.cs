using El_Salam_Warehouse.Infrastructure.Persistence.IdentityModels;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace El_Salam_Warehouse.Infrastructure.Persistence.Configurations;

internal class ApplicationRoleConfiguration : IEntityTypeConfiguration<ApplicationRole>
{
    public void Configure(EntityTypeBuilder<ApplicationRole> builder)
    {
        builder.Property(r => r.Description)
               .HasMaxLength(500);
    }
}