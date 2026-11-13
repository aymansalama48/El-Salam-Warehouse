using El_Salam_Warehouse.Domain.Common.Results;
using MediatR;

namespace El_Salam_Warehouse.Application.Common.Abstractions.Messaging
{
    public interface IQuery<TResponse> : IRequest<Result<TResponse>>
    {
    }
}
