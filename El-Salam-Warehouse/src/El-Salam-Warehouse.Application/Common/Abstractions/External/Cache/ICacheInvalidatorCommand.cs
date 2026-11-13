namespace El_Salam_Warehouse.Application.Common.Abstractions.External.Cache;

public interface ICacheInvalidatorCommand
{
    IReadOnlyCollection<string> CacheKeys { get; }
}