namespace El_Salam_Warehouse.Application.Common.Abstractions.Core;

public interface ICorrelationContext
{
    string CorrelationId { get; }
}