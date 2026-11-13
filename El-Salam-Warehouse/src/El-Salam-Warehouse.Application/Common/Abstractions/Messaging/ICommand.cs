using El_Salam_Warehouse.Domain.Common.Results;
using MediatR;


namespace El_Salam_Warehouse.Application.Common.Abstractions.Messaging
{
    public interface ICommand : IRequest<Result>
    {
    }

    public interface ICommand<TResponse> : IRequest<Result<TResponse>>
    {
    }
}
