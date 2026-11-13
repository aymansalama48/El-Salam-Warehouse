using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Features.Categories.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.Categories.Commands.UpdateCategory;

// 1. Command (لا يعود ببيانات، يستخدم ICommand فقط)
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Categories.Update)]
public record UpdateCategoryCommand(Guid Id, string Name, string? Description, string ColorHex) : ICommand;

// 2. Validator
public class UpdateCategoryCommandValidator : AbstractValidator<UpdateCategoryCommand>
{
    public UpdateCategoryCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ColorHex).NotEmpty().Matches("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$");
    }
}

// 3. Handler
internal sealed class UpdateCategoryCommandHandler : ICommandHandler<UpdateCategoryCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdateCategoryCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (category is null)
        {
            return Result.Failure(CategoryErrors.NotFound);
        }

        // التأكد من عدم تكرار الاسم مع فئة أخرى
        if (await _context.Categories.AnyAsync(c => c.Name == request.Name && c.Id != request.Id, cancellationToken))
        {
            return Result.Failure(CategoryErrors.NameAlreadyExists);
        }

        category.Update(request.Name, request.Description, request.ColorHex);

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}