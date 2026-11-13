using System;
using System.Collections.Generic;
using System.Text;

namespace El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Transaction
{
    public interface ITransactionManager
    {
        Task ExecuteAsync(
            Func<CancellationToken, Task> operation,
            CancellationToken cancellationToken = default);

        Task<T> ExecuteAsync<T>(
            Func<CancellationToken, Task<T>> operation,
            CancellationToken cancellationToken = default);
    }
}
