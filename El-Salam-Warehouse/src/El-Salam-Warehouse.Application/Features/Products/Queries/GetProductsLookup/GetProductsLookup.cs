using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.Products.Queries.GetProductsLookup;

// منتج خفيف لقايمة الاختيار في فورم الإذن
public record ProductLookupDto(
    Guid Id,
    string Name,
    string CategoryName,
    string BaseUnit,
    string SubUnit,
    int UnitsPerBaseUnit,
    StockEntryUnit EntryUnit,        // الإذن بيتسجل بأنهي وحدة
    string EntryUnitLabel,           // اسم الوحدة دي (كشكول / كرتونة)
    int AvailableInEntryUnit,        // الرصيد المتاح بوحدة الإذن (مثال: 50 كرتونة)
    ProductUnitType UnitType,        // نوع المنتج (1 كشكول / 2 كراس / 3 ورق تصوير)
    int TotalSubUnitStock,           // الرصيد الفعلي بأصغر وحدة (رزم أو قطع)
    int DisplayOrder = 0);           // ترتيب العرض اليدوي

// 1. الـ Query
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Products.View)]
public record GetProductsLookupQuery(
    string? Search,
    bool NotebooksOnly,              // true = الكشاكيل والكراريس بس (وارد صالة الإنتاج)
    int Limit = 50) : IQuery<List<ProductLookupDto>>;

// 2. الـ Handler
internal sealed class GetProductsLookupQueryHandler : IQueryHandler<GetProductsLookupQuery, List<ProductLookupDto>>
{
    // الاتصال بالداتابيز (قراءة بس)
    private readonly IReadDbContext _readContext;

    // كونستركتور
    public GetProductsLookupQueryHandler(IReadDbContext readContext)
    {
        _readContext = readContext;
    }

    // جلب المنتجات
    public async Task<Result<List<ProductLookupDto>>> Handle(GetProductsLookupQuery request, CancellationToken cancellationToken)
    {
        var limit = Math.Clamp(request.Limit, 1, 100);

        var query = _readContext.Products.AsQueryable();

        // الكشاكيل والكراريس بس
        if (request.NotebooksOnly)
            query = query.Where(p => p.EntryUnit == StockEntryUnit.SubUnit);

        // بحث بالاسم أو اسم الفئة
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim();
            query = query.Where(p => p.Name.Contains(s) || p.Category.Name.Contains(s));
        }
        var products = await query
            .OrderBy(p => p.DisplayOrder)
            .ThenBy(p => p.CreatedAt)
            .Take(limit)
            .Select(p => new ProductLookupDto(
                p.Id,
                p.Name,
                p.Category.Name,
                p.BaseUnit,
                p.SubUnit,
                p.UnitsPerBaseUnit,
                p.EntryUnit,
                p.EntryUnit == StockEntryUnit.BaseUnit ? p.BaseUnit : p.SubUnit,
                p.EntryUnit == StockEntryUnit.BaseUnit
                    ? (p.UnitsPerBaseUnit > 0 ? p.TotalSubUnitStock / p.UnitsPerBaseUnit : 0)
                    : p.TotalSubUnitStock,
                p.UnitType,
                p.TotalSubUnitStock,
                p.DisplayOrder))
            .ToListAsync(cancellationToken);

        return Result<List<ProductLookupDto>>.Success(products);
    }
}