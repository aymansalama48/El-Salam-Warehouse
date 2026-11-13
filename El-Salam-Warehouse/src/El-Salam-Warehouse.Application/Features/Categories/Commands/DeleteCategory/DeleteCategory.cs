using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Features.Categories.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.Categories.Commands.DeleteCategory;

// 1. Command
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Categories.Delete)]
public record DeleteCategoryCommand(Guid Id) : ICommand;

// 2. Handler
internal sealed class DeleteCategoryCommandHandler : ICommandHandler<DeleteCategoryCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteCategoryCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (category is null)
        {
            return Result.Failure(CategoryErrors.NotFound);
        }

        _context.Categories.Remove(category);
        // أو category.IsDeleted = true لو بتعمل Soft Delete مانيوال

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}