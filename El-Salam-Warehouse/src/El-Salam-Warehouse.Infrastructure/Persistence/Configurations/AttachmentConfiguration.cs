namespace El_Salam_Warehouse.Infrastructure.Persistence.Configurations;
using El_Salam_Warehouse.Domain.Entities.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class AttachmentConfiguration : IEntityTypeConfiguration<Attachment>
{
    public void Configure(EntityTypeBuilder<Attachment> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.FileName).IsRequired().HasMaxLength(255);
        builder.Property(e => e.StoredName).IsRequired().HasMaxLength(255);
        builder.Property(e => e.ContentType).IsRequired().HasMaxLength(100);
        builder.Property(e => e.FileId).IsRequired().HasMaxLength(255);
        builder.Property(e => e.EntityType).HasMaxLength(100);
        
        builder.HasIndex(e => new { e.EntityType, e.EntityId });
    }
}
