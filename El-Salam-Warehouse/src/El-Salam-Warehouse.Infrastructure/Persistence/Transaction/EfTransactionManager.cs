using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Transaction;
using El_Salam_Warehouse.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Infrastructure.Persistence.Transaction;

public sealed class EfTransactionManager : ITransactionManager
{
    private readonly AppDbContext _context;

    public EfTransactionManager(AppDbContext context)
    {
        _context = context;
    }

    public async Task ExecuteAsync(
        Func<CancellationToken, Task> operation,
        CancellationToken cancellationToken = default)
    {
        var strategy = _context.Database.CreateExecutionStrategy();

        await strategy.ExecuteAsync(_context, async (context, ct) =>
        {
            await using var transaction = await context.Database.BeginTransactionAsync(ct);

            await operation(ct);

            await context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
        }, cancellationToken);
    }

    public async Task<TResult> ExecuteAsync<TResult>(
        Func<CancellationToken, Task<TResult>> operation,
        CancellationToken cancellationToken = default)
    {
        var strategy = _context.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(_context, async (context, ct) =>
        {
            await using var transaction = await context.Database.BeginTransactionAsync(ct);

            var result = await operation(ct);

            await context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            return result;
        }, cancellationToken);
    }
}