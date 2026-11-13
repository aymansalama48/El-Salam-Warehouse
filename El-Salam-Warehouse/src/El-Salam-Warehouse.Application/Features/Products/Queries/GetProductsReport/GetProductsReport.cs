using El_Salam_Warehouse.Application.Common.Abstractions.Core;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Common.Abstractions.Reports;
using El_Salam_Warehouse.Application.Common.Models;
using El_Salam_Warehouse.Application.Features.Categories.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.Products.Queries.GetProductsReport;

// 1. الـ Query (تم إضافة ProductIds لاستقبال منتج أو أكتر)
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Products.Export)]
public record GetProductsReportQuery(Guid? CategoryId, List<Guid>? ProductIds) : IQuery<ReportFileDto>;

// 2. الـ Handler
internal sealed class GetProductsReportQueryHandler : IQueryHandler<GetProductsReportQuery, ReportFileDto>
{
    // الاتصال بالداتابيز (قراءة بس)
    private readonly IReadDbContext _readContext;

    // الـ generator اللي بيرسم الـ PDF
    private readonly IReportGenerator _reportGenerator;

    // إدارة الوقت
    private readonly IDateTime _dateTime;

    // كونستركتور (تم حقن IDateTime)
    public GetProductsReportQueryHandler(
        IReadDbContext readContext,
        IReportGenerator reportGenerator,
        IDateTime dateTime)
    {
        _readContext = readContext;
        _reportGenerator = reportGenerator;
        _dateTime = dateTime;
    }

    // بناء تقرير الجرد
    public async Task<Result<ReportFileDto>> Handle(GetProductsReportQuery request, CancellationToken cancellationToken)
    {
        var categoryTitle = "جميع الفئات";
        var query = _readContext.Products.AsQueryable();

        // فلترة بالفئة (لو محددة)
        if (request.CategoryId.HasValue && request.CategoryId != Guid.Empty)
        {
            var categoryName = await _readContext.Categories
                .Where(c => c.Id == request.CategoryId.Value)
                .Select(c => c.Name)
                .FirstOrDefaultAsync(cancellationToken);

            if (categoryName is null)
            {
                return Result<ReportFileDto>.Failure(CategoryErrors.NotFound);
            }

            categoryTitle = categoryName;
            query = query.Where(p => p.CategoryId == request.CategoryId.Value);
        }

        // فلترة بمنتجات محددة (لو المستخدم اختار منتج أو أكتر)
        if (request.ProductIds is not null && request.ProductIds.Any())
        {
            query = query.Where(p => request.ProductIds.Contains(p.Id));

            // تعديل العنوان عشان يوضح إن ده جرد جزئي
            categoryTitle += " (منتجات محددة)";
        }

        var raw = await query
            .OrderBy(p => p.Category != null ? p.Category.Name : "")
            .ThenBy(p => p.Name)
            .Select(p => new
            {
                p.Name,
                CategoryName = p.Category != null ? p.Category.Name : "عام",
                p.BaseUnit,
                p.SubUnit,
                p.UnitsPerBaseUnit,
                p.EntryUnit,
                p.UnitType,
                p.TotalSubUnitStock,
                p.StorageLocation,
                p.LowStockThreshold,
                p.LowStockThresholdUnit,
                LowStockThresholdSubUnits = (p.LowStockThresholdUnit == StockEntryUnit.BaseUnit && p.UnitsPerBaseUnit > 0)
                    ? p.LowStockThreshold * p.UnitsPerBaseUnit
                    : p.LowStockThreshold
            })
            .ToListAsync(cancellationToken);

        // الباكو/الكراتين الكاملة لكل منتج
        int Full(int total, int perBase) => perBase > 0 ? total / perBase : 0;

        // حالة المنتج (مطابقة لقواعد النظام والداشبورد)
        string Status(ProductUnitType unitType, int total, int perBase, int thresholdSubUnits)
        {
            var st = ProductRules.CalculateStockStatus(unitType, total, perBase, thresholdSubUnits);
            return st switch
            {
                ProductStockStatus.OutOfStock => "نفد",
                ProductStockStatus.LowStock => "منخفض",
                _ => "متوفر"
            };
        }

        var notebooks = raw.Where(p => p.EntryUnit == StockEntryUnit.SubUnit).ToList();
        var copyPaper = raw.Where(p => p.EntryUnit == StockEntryUnit.BaseUnit).ToList();

        var totals = new ProductsReportTotals(
            raw.Count,
            notebooks.Sum(p => Full(p.TotalSubUnitStock, p.UnitsPerBaseUnit)),
            notebooks.Sum(p => p.TotalSubUnitStock),
            copyPaper.Sum(p => Full(p.TotalSubUnitStock, p.UnitsPerBaseUnit)),
            copyPaper.Sum(p => p.TotalSubUnitStock));

        var groups = raw
            .GroupBy(p => p.CategoryName)
            .Select(g => new ProductsReportGroup(
                g.Key,
                g.Select(p => new ProductsReportRow(
                    p.Name,
                    p.BaseUnit,
                    p.SubUnit,
                    p.UnitsPerBaseUnit,
                    Full(p.TotalSubUnitStock, p.UnitsPerBaseUnit),
                    p.UnitsPerBaseUnit > 0 ? p.TotalSubUnitStock % p.UnitsPerBaseUnit : 0,
                    p.TotalSubUnitStock,
                    string.IsNullOrWhiteSpace(p.StorageLocation) ? "-" : p.StorageLocation!,
                    Status(p.UnitType, p.TotalSubUnitStock, p.UnitsPerBaseUnit, p.LowStockThresholdSubUnits))).ToList()))
            .ToList();

        // استخدام IDateTime بدلاً من CairoTime للوقت والتاريخ
        var now = _dateTime.Now;
        var today = DateOnly.FromDateTime(now);

        var model = new ProductsReportModel(categoryTitle, now, totals, groups);
        var bytes = _reportGenerator.GenerateProductsReport(model);

        return Result<ReportFileDto>.Success(new ReportFileDto(
            bytes,
            $"products_inventory_{today:yyyy-MM-dd}.pdf",
            "application/pdf"));
    }
}