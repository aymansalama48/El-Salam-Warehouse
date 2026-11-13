// El_Salam_Warehouse.Application/Common/Events/DomainEventNotification.cs
namespace El_Salam_Warehouse.Application.Common.Events;

using MediatR;
using El_Salam_Warehouse.Domain.Common.Events;

public sealed class DomainEventNotification<TDomainEvent>(TDomainEvent domainEvent)
    : INotification
    where TDomainEvent : IDomainEvent
{
    public TDomainEvent DomainEvent { get; } = domainEvent;
}