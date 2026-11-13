using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Features.Products.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.Products.Queries.GetProductsSummary;

// 1. الـ Query: مفيهوش باراميترات
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Products.View)]
public record GetProductsSummaryQuery() : IQuery<ProductsSummaryDto>;

// 2. الـ Handler: بيحسب أرقام الكروت
internal sealed class GetProductsSummaryQueryHandler : IQueryHandler<GetProductsSummaryQuery, ProductsSummaryDto>
{
    // الاتصال بالداتابيز (للقراءة بس)
    private readonly IReadDbContext _readContext;

    // كونستركتور بياخد الـ ReadDbContext
    public GetProductsSummaryQueryHandler(IReadDbContext readContext)
    {
        _readContext = readContext;
    }

    // الدالة اللي بتحسب الملخص
    public async Task<Result<ProductsSummaryDto>> Handle(GetProductsSummaryQuery request, CancellationToken cancellationToken)
    {
        // استرجاع الحقول الحسابية في استعلام واحد خفيف وسريع
        var products = await _readContext.Products
            .AsNoTracking()
            .Select(p => new
            {
                p.EntryUnit,
                p.TotalSubUnitStock,
                p.UnitsPerBaseUnit
            })
            .ToListAsync(cancellationToken);

        var totalProducts = products.Count;

        // مجموع الباكو الكاملة للكشاكيل مع الحماية من القسمة على صفر
        var notebookPackets = products
            .Where(p => p.EntryUnit == StockEntryUnit.SubUnit && p.UnitsPerBaseUnit > 0)
            .Sum(p => p.TotalSubUnitStock / p.UnitsPerBaseUnit);

        // مجموع الكشاكيل بالقطعة
        var notebookPieces = products
            .Where(p => p.EntryUnit == StockEntryUnit.SubUnit)
            .Sum(p => p.TotalSubUnitStock);

        // مجموع الكراتين الكاملة لورق التصوير مع الحماية من القسمة على صفر
        var copyPaperCartons = products
            .Where(p => p.EntryUnit == StockEntryUnit.BaseUnit && p.UnitsPerBaseUnit > 0)
            .Sum(p => p.TotalSubUnitStock / p.UnitsPerBaseUnit);

        // مجموع الرزم
        var copyPaperReams = products
            .Where(p => p.EntryUnit == StockEntryUnit.BaseUnit)
            .Sum(p => p.TotalSubUnitStock);

        var summary = new ProductsSummaryDto(
            totalProducts,
            notebookPackets,
            notebookPieces,
            copyPaperCartons,
            copyPaperReams);

        return Result<ProductsSummaryDto>.Success(summary);
    }
}