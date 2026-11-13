using El_Salam_Warehouse.Domain.Common.Results;
using MediatR;

namespace El_Salam_Warehouse.Application.Common.Abstractions.Messaging
{
    public interface ICommandHandler<in TCommand, TResponse>
        : IRequestHandler<TCommand, Result<TResponse>>
        where TCommand : ICommand<TResponse>
    {
    }

    // لو محتاج Handler لأمر مش بيرجع بيانات (ICommand اللي من غير TResponse)
    public interface ICommandHandler<in TCommand>
        : IRequestHandler<TCommand, Result>
        where TCommand : ICommand
    {
    }
}