using El_Salam_Warehouse.Api.Contracts.Categories;
using El_Salam_Warehouse.Api.Controllers.Base;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Domain.Constants;
using El_Salam_Warehouse.Application.Features.Categories.Commands.CreateCategory;
using El_Salam_Warehouse.Application.Features.Categories.Commands.DeleteCategory;
using El_Salam_Warehouse.Application.Features.Categories.Commands.UpdateCategory;
using El_Salam_Warehouse.Application.Features.Categories.Queries.GetAllCategories;
using El_Salam_Warehouse.Application.Features.Categories.Queries.GetCategoriesLookup;
using El_Salam_Warehouse.Application.Features.Categories.Queries.GetCategoryById;
using El_Salam_Warehouse.Application.Features.Products.Queries.GetAllProducts;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace El_Salam_Warehouse.Api.Controllers;

[Microsoft.AspNetCore.Authorization.Authorize]
public class CategoriesController : BaseApiController
{
    // 1. جلب كل الفئات (مع دعم البحث)
    [HttpGet]
    [Permission(Permissions.Categories.View)]
    public async Task<IResult> GetAll([FromQuery] string? search)
    {
        var query = new GetAllCategoriesQuery(search);
        var result = await Sender.Send(query);
        return HandleResult(result);
    }
    // نقطة النهاية للـ Dropdown
    [HttpGet("lookup")]
    public async Task<IResult> GetLookup()
    {
        var query = new GetCategoriesLookupQuery();
        var result = await Sender.Send(query);
        return HandleResult(result);
    }
    // 2. جلب فئة واحدة بالتفصيل
    [HttpGet("{id:guid}")]
    [Permission(Permissions.Categories.View)]
    public async Task<IResult> GetById(Guid id)
    {
        var query = new GetCategoryByIdQuery(id);
        var result = await Sender.Send(query);
        return HandleResult(result);
    }

    // جلب الأصناف والمنتجات التابعة لفئة معينة
    [HttpGet("{id:guid}/products")]
    [Permission(Permissions.Categories.View)]
    public async Task<IResult> GetCategoryProducts(Guid id)
    {
        var query = new GetAllProductsQuery(null, id);
        var result = await Sender.Send(query);
        return HandleResult(result);
    }

    // 3. إضافة فئة جديدة
    [HttpPost]
    [Permission(Permissions.Categories.Create)]
    public async Task<IResult> Create([FromBody] CreateCategoryRequest request)
    {
        var command = new CreateCategoryCommand(request.Name, request.Description, request.ColorHex);
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    // 4. تعديل فئة
    [HttpPut("{id:guid}")]
    [Permission(Permissions.Categories.Update)]
    public async Task<IResult> Update(Guid id, [FromBody] UpdateCategoryRequest request)
    {
        var command = new UpdateCategoryCommand(id, request.Name, request.Description, request.ColorHex);
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    // 5. حذف فئة
    [HttpDelete("{id:guid}")]
    [Permission(Permissions.Categories.Delete)]
    public async Task<IResult> Delete(Guid id)
    {
        var command = new DeleteCategoryCommand(id);
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    // 6. إعادة ترتيب الفئات (السحب والإفلات)
    [HttpPut("reorder")]
    [Permission(Permissions.Categories.Update)]
    public async Task<IResult> Reorder(
        [FromBody] El_Salam_Warehouse.Api.Contracts.Common.ReorderItemsRequest request,
        [FromServices] El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data.IApplicationDbContext context)
    {
        if (request?.OrderedIds == null || !request.OrderedIds.Any())
            return Results.BadRequest(new { message = "قائمة المعرفات مطلوبة" });

        var categories = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(
            context.Categories.Where(c => request.OrderedIds.Contains(c.Id)));

        for (int i = 0; i < request.OrderedIds.Count; i++)
        {
            var id = request.OrderedIds[i];
            var category = categories.FirstOrDefault(c => c.Id == id);
            if (category != null)
            {
                category.SetDisplayOrder(i);
            }
        }

        await context.SaveChangesAsync();
        return Results.Ok(new { success = true, message = "تم حفظ ترتيب الفئات بنجاح" });
    }
}