namespace El_Salam_Warehouse.Api.Contracts.Products;

public record StockAlertThresholdsRequest(
    int PacketThreshold,
    int CartonThreshold
);

