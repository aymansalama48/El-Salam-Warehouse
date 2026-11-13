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

namespace El_Salam_Warehouse.Application.Features.Products.Commands.CreateProduct;

// 1. الـ Command: بيانات إضافة المنتج الجديد بنوع المنتج المحدد
[Permission(Permissions.Products.Create)]
public record CreateProductCommand(
    string Name,
    Guid CategoryId,
    ProductUnitType UnitType,
    int UnitsPerBaseUnit,
    int InitialStock,
    string? StorageLocation,
    StockEntryUnit? InitialStockUnit = null,
    int? LowStockThreshold = 0,
    StockEntryUnit? LowStockThresholdUnit = null) : ICommand<Guid>;

// 2. الـ Validator: بيتأكد إن البيانات سليمة ونوع المنتج صحيح
public class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("اسم المنتج مطلوب.");
        RuleFor(x => x.CategoryId).NotEmpty().WithMessage("يجب تحديد فئة المنتج.");
        RuleFor(x => x.UnitType).IsInEnum().WithMessage("نوع المنتج غير صحيح.");
        RuleFor(x => x.UnitsPerBaseUnit).GreaterThan(0).WithMessage("يجب أن يكون محتوى الوحدة أكبر من صفر.");
        RuleFor(x => x.InitialStock).GreaterThanOrEqualTo(0).WithMessage("الرصيد الافتتاحي لا يمكن أن يكون سالباً.");
        RuleFor(x => x.InitialStockUnit).IsInEnum().When(x => x.InitialStockUnit.HasValue).WithMessage("وحدة الرصيد غير صحيحة.");
        RuleFor(x => x.LowStockThreshold).GreaterThanOrEqualTo(0).When(x => x.LowStockThreshold.HasValue).WithMessage("حد النواقص لا يمكن أن يكون سالباً.");
    }
}

// 3. الـ Handler: بينفذ الإضافة فعلياً
internal sealed class CreateProductCommandHandler : ICommandHandler<CreateProductCommand, Guid>
{
    // الاتصال بالداتابيز
    private readonly IApplicationDbContext _context;

    // كونستركتور بياخد الـ DbContext
    public CreateProductCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    // الدالة اللي بتنفذ الإضافة
    public async Task<Result<Guid>> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        // نتأكد إن الفئة موجودة
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId, cancellationToken);
        if (!categoryExists)
        {
            return Result<Guid>.Failure(CategoryErrors.NotFound);
        }

        // نتأكد إن اسم المنتج مش متكرر
        if (await _context.Products.AnyAsync(p => p.Name == request.Name, cancellationToken))
        {
            return Result<Guid>.Failure(ProductErrors.NameAlreadyExists);
        }

        // جلب بروفايل نوع المنتج وحساب الرصيد الكلي بالوحدة الصغيرة
        var profile = ProductUnitProfiles.Get(request.UnitType);
        var stockUnit = request.InitialStockUnit ?? profile.EntryUnit;
        var totalSubUnits = stockUnit == StockEntryUnit.BaseUnit
            ? request.InitialStock * request.UnitsPerBaseUnit
            : request.InitialStock;

        // ننشئ المنتج بالكونستركتور الجديد مع حد النواقص المخصص
        var product = new Product(
            request.Name,
            request.CategoryId,
            request.UnitType,
            request.UnitsPerBaseUnit,
            totalSubUnits,
            request.StorageLocation,
            request.LowStockThreshold ?? 0,
            request.LowStockThresholdUnit);

        // نضيفه ونحفظ
        _context.Products.Add(product);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(product.Id);
    }
}
