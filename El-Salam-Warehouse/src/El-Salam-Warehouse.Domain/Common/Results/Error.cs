namespace El_Salam_Warehouse.Domain.Common.Results;

public record Error(string Code, string Description, ErrorType Type)
{
    public static Error None => new(string.Empty, string.Empty, ErrorType.Failure);
}