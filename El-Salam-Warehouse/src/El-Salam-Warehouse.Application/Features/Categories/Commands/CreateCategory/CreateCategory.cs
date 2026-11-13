using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Features.Categories.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Domain.Entities.Categories;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.Categories.Commands.CreateCategory;

// 1. Command
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Categories.Create)]
public record CreateCategoryCommand(string Name, string? Description, string ColorHex) : ICommand<Guid>;

// 2. Validator
public class CreateCategoryCommandValidator : AbstractValidator<CreateCategoryCommand>
{
    public CreateCategoryCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("اسم الفئة مطلوب.")
            .MaximumLength(100).WithMessage("اسم الفئة لا يجب أن يتجاوز 100 حرف.");

        RuleFor(x => x.ColorHex)
            .NotEmpty().WithMessage("لون التمييز مطلوب.")
            .Matches("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$").WithMessage("تنسيق اللون غير صحيح.");
    }
}

// 3. Handler
internal sealed class CreateCategoryCommandHandler : ICommandHandler<CreateCategoryCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CreateCategoryCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        // التأكد من عدم تكرار الاسم
        if (await _context.Categories.AnyAsync(c => c.Name == request.Name, cancellationToken))
        {
            return Result<Guid>.Failure(CategoryErrors.NameAlreadyExists);
        }

        var category = new Category(request.Name, request.Description, request.ColorHex);

        _context.Categories.Add(category);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(category.Id);
    }
}