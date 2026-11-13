using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using El_Salam_Warehouse.Api.Contracts.Products;
using El_Salam_Warehouse.Api.Controllers.Base;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Domain.Constants;
using El_Salam_Warehouse.Domain.Enums;
using El_Salam_Warehouse.Application.Features.Products.Commands.CreateProduct;
using El_Salam_Warehouse.Application.Features.Products.Commands.DeleteProduct;
using El_Salam_Warehouse.Application.Features.Products.Commands.UpdateProduct;
using El_Salam_Warehouse.Application.Features.Products.Queries.GetAllProducts;
using El_Salam_Warehouse.Application.Features.Products.Queries.GetProductById;
using El_Salam_Warehouse.Application.Features.Products.Queries.GetProductsLookup;
using El_Salam_Warehouse.Application.Features.Products.Queries.GetProductsReport;
using El_Salam_Warehouse.Application.Features.Products.Queries.GetProductsSummary;
using El_Salam_Warehouse.Application.Features.Products.Queries.GetProductUnitTypes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Api.Controllers;

// وحدة التحكم بالمنتجات (أصناف المخزن)
[Authorize]
public class ProductsController : BaseApiController
{
    // 1. جلب كل المنتجات (مع دعم البحث والفلترة بالفئة)
    [HttpGet]
    [Permission(Permissions.Products.View)]
    public async Task<IResult> GetAll([FromQuery] string? search, [FromQuery] Guid? categoryId)
    {
        var query = new GetAllProductsQuery(search, categoryId);
        var result = await Sender.Send(query);
        return HandleResult(result);
    }

    // 2. جلب قائمة أنواع وحدات المنتجات المدعومة ومواصفاتها
    [HttpGet("unit-types")]
    public async Task<IResult> GetUnitTypes()
    {
        var query = new GetProductUnitTypesQuery();
        var result = await Sender.Send(query);
        return HandleResult(result);
    }

    // 3. جلب منتج واحد بالتفصيل
    [HttpGet("{id:guid}")]
    [Permission(Permissions.Products.View)]
    public async Task<IResult> GetById(Guid id)
    {
        var query = new GetProductByIdQuery(id);
        var result = await Sender.Send(query);
        return HandleResult(result);
    }

    // 3.1 تحميل وطباعة بطاقة تعريف ومواصفات المنتج كـ PDF رسمي من الخادم
    [HttpGet("{id:guid}/pdf")]
    [Permission(Permissions.Products.View)]
    public async Task<IResult> GetPdf(Guid id)
    {
        var result = await Sender.Send(new El_Salam_Warehouse.Application.Features.Products.Queries.GetProductPdf.GetProductPdfQuery(id));
        if (!result.IsSuccess) return HandleResult(result);
        var file = result.Data;
        return Results.File(file.Content, file.ContentType, file.FileName);
    }

    // 4. إضافة منتج جديد
    [HttpPost]
    [Permission(Permissions.Products.Create)]
    public async Task<IResult> Create([FromBody] CreateProductRequest request)
    {
        // تحويل الـ Request لـ Command بالنوع المباشر وحد النواقص المخصص
        var command = new CreateProductCommand(
            request.Name,
            request.CategoryId,
            request.UnitType,
            request.UnitsPerBaseUnit,
            request.InitialStock,
            request.StorageLocation,
            request.InitialStockUnit,
            request.LowStockThreshold,
            request.LowStockThresholdUnit);

        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    // 5. تعديل منتج
    [HttpPut("{id:guid}")]
    [Permission(Permissions.Products.Update)]
    public async Task<IResult> Update(Guid id, [FromBody] UpdateProductRequest request)
    {
        var command = new UpdateProductCommand(
            id,
            request.Name,
            request.CategoryId,
            request.UnitType,
            request.UnitsPerBaseUnit,
            request.StorageLocation,
            request.LowStockThreshold,
            request.LowStockThresholdUnit);

        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    // 6. تعديل حد النواقص لصنف محدد مباشرة
    [HttpPut("{id:guid}/threshold")]
    [Permission(Permissions.Products.Update)]
    public async Task<IResult> UpdateProductThreshold(
        Guid id,
        [FromBody] UpdateProductThresholdRequest request,
        [FromServices] IApplicationDbContext context)
    {
        var product = await context.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product == null)
            return Results.NotFound(new { message = "الصنف غير موجود" });

        product.SetLowStockThreshold(request.LowStockThreshold, request.LowStockThresholdUnit);
        await context.SaveChangesAsync();

        return Results.Ok(new
        {
            productId = product.Id,
            lowStockThreshold = product.LowStockThreshold,
            lowStockThresholdUnit = (int)product.LowStockThresholdUnit,
            lowStockThresholdSubUnits = product.LowStockThresholdSubUnits
        });
    }

    // 7. حذف منتج
    [HttpDelete("{id:guid}")]
    [Permission(Permissions.Products.Delete)]
    public async Task<IResult> Delete(Guid id)
    {
        var command = new DeleteProductCommand(id);
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    // 7.1 إعادة ترتيب المنتجات والأصناف (السحب والإفلات)
    [HttpPut("reorder")]
    [Permission(Permissions.Products.Update)]
    public async Task<IResult> Reorder(
        [FromBody] El_Salam_Warehouse.Api.Contracts.Common.ReorderItemsRequest request,
        [FromServices] IApplicationDbContext context)
    {
        if (request?.OrderedIds == null || !request.OrderedIds.Any())
            return Results.BadRequest(new { message = "قائمة المعرفات مطلوبة" });

        var products = await context.Products
            .Where(p => request.OrderedIds.Contains(p.Id))
            .ToListAsync();

        for (int i = 0; i < request.OrderedIds.Count; i++)
        {
            var id = request.OrderedIds[i];
            var product = products.FirstOrDefault(p => p.Id == id);
            if (product != null)
            {
                product.SetDisplayOrder(i);
            }
        }

        await context.SaveChangesAsync();
        return Results.Ok(new { success = true, message = "تم حفظ ترتيب الأصناف بنجاح" });
    }

    // 8. ملخص إحصائيات المخزن
    [HttpGet("summary")]
    [Permission(Permissions.Products.View)]
    public async Task<IResult> GetSummary()
    {
        var query = new GetProductsSummaryQuery();
        var result = await Sender.Send(query);
        return HandleResult(result);
    }

    // 9. قائمة منسدلة للأصناف لتسجيل الإذونات
    [HttpGet("lookup")]
    [Permission(Permissions.Products.View)]
    public async Task<IResult> Lookup(
        [FromQuery] string? search,
        [FromQuery] bool? notebooksOnly,
        [FromQuery] int limit = 50)
    {
        var result = await Sender.Send(new GetProductsLookupQuery(search, notebooksOnly ?? false, limit));
        return HandleResult(result);
    }

    // 10. تقرير جرد المنتجات PDF (فئة محددة أو الكل)
    [HttpGet("report")]
    [Permission(Permissions.Products.Export)]
    public async Task<IResult> Report(
        [FromQuery] Guid? categoryId,
        [FromQuery] List<Guid>? productIds)
    {
        var query = new GetProductsReportQuery(categoryId, productIds);
        var result = await Sender.Send(query);

        if (!result.IsSuccess) return HandleResult(result);

        var file = result.Data;
        return Results.File(file.Content, file.ContentType, file.FileName);
    }

    // 11. جلب إعدادات حدود تنبيه النواقص لكل الأصناف
    [HttpGet("stock-alerts/thresholds")]
    [Permission(Permissions.Products.View)]
    public async Task<IResult> GetStockAlertThresholds([FromServices] IReadDbContext readContext)
    {
        var items = await readContext.Products
            .Include(p => p.Category)
            .OrderBy(p => p.Category != null ? p.Category.Name : "")
            .ThenBy(p => p.Name)
            .Select(p => new
            {
                productId = p.Id,
                productName = p.Name,
                categoryName = p.Category != null ? p.Category.Name : "عام",
                unitType = (int)p.UnitType,
                baseUnit = p.BaseUnit,
                subUnit = p.SubUnit,
                unitsPerBaseUnit = p.UnitsPerBaseUnit,
                totalSubUnitStock = p.TotalSubUnitStock,
                fullBaseUnits = p.UnitsPerBaseUnit > 0 ? p.TotalSubUnitStock / p.UnitsPerBaseUnit : 0,
                remainingSubUnits = p.UnitsPerBaseUnit > 0 ? p.TotalSubUnitStock % p.UnitsPerBaseUnit : 0,
                lowStockThreshold = p.LowStockThreshold,
                lowStockThresholdUnit = (int)p.LowStockThresholdUnit,
                lowStockThresholdSubUnits = (p.LowStockThresholdUnit == StockEntryUnit.BaseUnit && p.UnitsPerBaseUnit > 0)
                    ? p.LowStockThreshold * p.UnitsPerBaseUnit
                    : p.LowStockThreshold,
            })
            .ToListAsync();

        return Results.Ok(new
        {
            packetThreshold = El_Salam_Warehouse.Domain.Entities.Products.ProductRules.LowStockThresholdPackets,
            cartonThreshold = El_Salam_Warehouse.Domain.Entities.Products.ProductRules.LowStockThresholdCartons,
            items
        });
    }

    // 12. تحديث حدود تنبيه النواقص لعدة أصناف دفعة واحدة أو حفظ الحدود العامة
    [HttpPut("stock-alerts/thresholds")]
    [Permission(Permissions.Products.Update)]
    public async Task<IResult> UpdateStockAlertThresholds(
        [FromBody] BatchUpdateProductThresholdsRequest? request,
        [FromServices] IApplicationDbContext context)
    {
        if (request?.Items != null && request.Items.Any())
        {
            var productIds = request.Items.Select(i => i.ProductId).ToList();
            var products = await context.Products.Where(p => productIds.Contains(p.Id)).ToListAsync();

            foreach (var item in request.Items)
            {
                var prod = products.FirstOrDefault(p => p.Id == item.ProductId);
                if (prod != null)
                {
                    prod.SetLowStockThreshold(item.LowStockThreshold, item.LowStockThresholdUnit);
                }
            }

            await context.SaveChangesAsync();
        }

        return Results.Ok(new { success = true, message = "تم تحديث حدود النواقص بنجاح" });
    }
}
