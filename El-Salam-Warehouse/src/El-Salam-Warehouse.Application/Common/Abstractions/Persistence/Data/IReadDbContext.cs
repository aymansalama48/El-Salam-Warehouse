using El_Salam_Warehouse.Domain.Entities.Categories; // إضافة مسار Category
using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Entities.Settings;
using El_Salam_Warehouse.Domain.Entities.StockVouchers;
using El_Salam_Warehouse.Domain.Entities.Storage;
using System.Linq;

namespace El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;

// واجهة سياق قاعدة البيانات للقراءة السريعة بدون تتبع (AsNoTracking)
public interface IReadDbContext
{
    IQueryable<StockVoucher> StockVouchers { get; }
    IQueryable<Product> Products { get; }
    // استعلام فئات الأصناف بدون تتبع
    IQueryable<Category> Categories { get; }

    // استعلام المرفقات والملفات بدون تتبع
    IQueryable<Attachment> Attachments { get; }

    // استعلام إعدادات النظام بدون تتبع
    IQueryable<SiteSetting> SiteSettings { get; }
}