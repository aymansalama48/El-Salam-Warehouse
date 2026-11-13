using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Features.Products.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.Products.Commands.DeleteProduct;

// 1. Command
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Products.Delete)]
public record DeleteProductCommand(Guid Id) : ICommand;

// 2. Handler
internal sealed class DeleteProductCommandHandler : ICommandHandler<DeleteProductCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteProductCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (product is null)
        {
            return Result.Failure(ProductErrors.NotFound);
        }
        // مينفعش نحذف منتج عليه إذونات
        var hasMovements = await _context.StockVouchers
            .AnyAsync(v => v.Items.Any(i => i.ProductId == request.Id), cancellationToken);

        if (hasMovements)
        {
            return Result.Failure(ProductErrors.HasMovements);
        }
        _context.Products.Remove(product);

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}