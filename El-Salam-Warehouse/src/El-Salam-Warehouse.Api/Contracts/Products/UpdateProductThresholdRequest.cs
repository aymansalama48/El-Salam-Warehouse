using System;
using El_Salam_Warehouse.Domain.Enums;

namespace El_Salam_Warehouse.Api.Contracts.Products;

public record UpdateProductThresholdRequest(
    int LowStockThreshold,
    StockEntryUnit? LowStockThresholdUnit);

public record BatchUpdateProductThresholdsRequest(
    System.Collections.Generic.List<ProductThresholdItem> Items);

public record ProductThresholdItem(
    Guid ProductId,
    int LowStockThreshold,
    StockEntryUnit? LowStockThresholdUnit);

