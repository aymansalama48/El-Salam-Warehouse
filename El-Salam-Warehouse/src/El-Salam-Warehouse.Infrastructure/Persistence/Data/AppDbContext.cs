namespace El_Salam_Warehouse.Infrastructure.Persistence.Data;

using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Domain.Entities.Categories; // إضافة مسار Category
using El_Salam_Warehouse.Domain.Entities.Settings;
using El_Salam_Warehouse.Domain.Entities.StockVouchers;
using El_Salam_Warehouse.Domain.Entities.Storage;
using El_Salam_Warehouse.Infrastructure.Persistence.IdentityModels;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Reflection;

// كلاس سياق قاعدة البيانات الرئيسي للسيستم
public class AppDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>, IApplicationDbContext, IReadDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);

        // تجاهل تحذيرات التصفية مع العلاقات المطلوبة في EF Core
        optionsBuilder.ConfigureWarnings(warnings =>
            warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.CoreEventId.PossibleIncorrectRequiredNavigationWithQueryFilterInteractionWarning));
    }
    public DbSet<El_Salam_Warehouse.Domain.Entities.Products.Product> Products => Set<El_Salam_Warehouse.Domain.Entities.Products.Product>();
    // جدول فئات الأصناف
    public DbSet<Category> Categories => Set<Category>();

    public DbSet<StockVoucher> StockVouchers => Set<StockVoucher>();
    // جدول توكنات تجديد الجلسة (Refresh Tokens)
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // جدول الملفات والمرفقات المرفوعة
    public DbSet<Attachment> Attachments => Set<Attachment>();

    // جدول الإعدادات العامة للنظام
    public DbSet<SiteSetting> SiteSettings => Set<SiteSetting>();

    // تطبيق استعلامات القراءة فقط بدون تتبع الكائنات لتحسين الأداء
    IQueryable<StockVoucher> IReadDbContext.StockVouchers => StockVouchers.AsNoTracking();
    IQueryable<Category> IReadDbContext.Categories => Categories.AsNoTracking();
    IQueryable<Attachment> IReadDbContext.Attachments => Attachments.AsNoTracking();
    IQueryable<SiteSetting> IReadDbContext.SiteSettings => SiteSettings.AsNoTracking();
    IQueryable<El_Salam_Warehouse.Domain.Entities.Products.Product> IReadDbContext.Products => Products.AsNoTracking();
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // 1. تطبيق كل إعدادات الكيانات (Entity Configurations) المعرفة في هذا الـ Assembly
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // 2. تطبيق الفلتر العام للحذف الهادئ (Soft Delete) تلقائياً على كل الجداول الداعمة
        builder.ApplySoftDeleteGlobalFilters();
    }
}