using El_Salam_Warehouse.Domain.Entities.Categories; // إضافة مسار Category
using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Entities.Settings;
using El_Salam_Warehouse.Domain.Entities.StockVouchers;
using El_Salam_Warehouse.Domain.Entities.Storage;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;

// واجهة سياق قاعدة البيانات للكتابة والحفظ
public interface IApplicationDbContext
{
    DbSet<StockVoucher> StockVouchers { get; }
    DbSet<Product> Products { get; }
    // جدول فئات الأصناف والمواد
    DbSet<Category> Categories { get; }

    // جدول الملفات والمرفقات
    DbSet<Attachment> Attachments { get; }

    // جدول إعدادات النظام
    DbSet<SiteSetting> SiteSettings { get; }

    // حفظ التغييرات في قاعدة البيانات
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}