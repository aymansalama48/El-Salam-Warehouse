using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Transaction;
using El_Salam_Warehouse.Domain.Common.Results;
using MediatR;

namespace El_Salam_Warehouse.Application.Common.Behaviors;

/// <summary>
/// سلوك وسيط (Pipeline Behavior) لـ MediatR يُدير المعاملات (Transactions) تلقائياً.
/// يتم تطبيقه فقط على الـ Commands التي تُرجع Result، ويستثني الـ Queries (أوامر القراءة).
/// </summary>
public sealed class TransactionBehavior<TRequest, TResponse>(
    ITransactionManager transactionManager)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : ICommand<TResponse>
    where TResponse : Result
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        // إحاطة تنفيذ الـ Handler المباشر بدالة ExecuteAsync الخاصة بمدير المعاملات
        return await transactionManager.ExecuteAsync(async ct =>
        {
            return await next();
        }, cancellationToken);
    }
}