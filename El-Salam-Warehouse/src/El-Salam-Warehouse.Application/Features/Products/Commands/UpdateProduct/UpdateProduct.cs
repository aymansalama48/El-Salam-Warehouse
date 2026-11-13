using System;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Features.Categories.Shared;
using El_Salam_Warehouse.Application.Features.Products.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Domain.Constants;
using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Enums;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.Products.Commands.UpdateProduct;

// 1. Command: بيانات تعديل المنتج متضمنة نوع المنتج الجديد وحد النواقص
[Permission(Permissions.Products.Update)]
public record UpdateProductCommand(
    Guid Id,
    string Name,
    Guid CategoryId,
    ProductUnitType UnitType,
    int UnitsPerBaseUnit,
    string? StorageLocation,
    int? LowStockThreshold = null,
    StockEntryUnit? LowStockThresholdUnit = null) : ICommand;

// 2. Validator: فحص صحة بيانات التعديل
public class UpdateProductCommandValidator : AbstractValidator<UpdateProductCommand>
{
    public UpdateProductCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().WithMessage("اسم المنتج مطلوب.");
        RuleFor(x => x.CategoryId).NotEmpty().WithMessage("يجب تحديد فئة المنتج.");
        RuleFor(x => x.UnitType).IsInEnum().WithMessage("نوع المنتج غير صحيح.");
        RuleFor(x => x.UnitsPerBaseUnit).GreaterThan(0).WithMessage("يجب أن يكون محتوى الوحدة أكبر من صفر.");
        RuleFor(x => x.LowStockThreshold).GreaterThanOrEqualTo(0).When(x => x.LowStockThreshold.HasValue).WithMessage("حد النواقص لا يمكن أن يكون سالباً.");
    }
}

// 3. Handler: تطبيق التعديلات والتحقق من توافق تغيير نوع المنتج
internal sealed class UpdateProductCommandHandler : ICommandHandler<UpdateProductCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdateProductCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (product is null)
        {
            return Result.Failure(ProductErrors.NotFound);
        }

        // التأكد من وجود الفئة الجديدة
        if (await _context.Categories.AllAsync(c => c.Id != request.CategoryId, cancellationToken))
        {
            return Result.Failure(CategoryErrors.NotFound);
        }

        // التأكد من عدم تكرار الاسم مع منتج آخر
        if (await _context.Products.AnyAsync(p => p.Name == request.Name && p.Id != request.Id, cancellationToken))
        {
            return Result.Failure(ProductErrors.NameAlreadyExists);
        }

        // فحص توافق نوع المنتج مع طريقة تسجيل الرصيد (ممنوع التحويل بين كشكول/كراس وورق تصوير)
        var newProfile = ProductUnitProfiles.Get(request.UnitType);
        if (newProfile.EntryUnit != product.EntryUnit)
        {
            return Result.Failure(ProductErrors.UnitTypeChangeNotAllowed);
        }

        // تعديل البيانات الأساسية للمنتج وحد النواقص
        product.Update(
            request.Name,
            request.CategoryId,
            request.UnitsPerBaseUnit,
            request.StorageLocation,
            request.LowStockThreshold,
            request.LowStockThresholdUnit);

        // تغيير نوع المنتج وتحديث الوحدات
        product.ChangeUnitType(request.UnitType);

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
