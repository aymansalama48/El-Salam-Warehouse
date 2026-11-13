using El_Salam_Warehouse.Domain.Common.Results;
using MediatR;

namespace El_Salam_Warehouse.Application.Common.Abstractions.Messaging
{
    public interface IQueryHandler<in TQuery, TResponse>
        : IRequestHandler<TQuery, Result<TResponse>>
        where TQuery : IQuery<TResponse>
    {
    }
}