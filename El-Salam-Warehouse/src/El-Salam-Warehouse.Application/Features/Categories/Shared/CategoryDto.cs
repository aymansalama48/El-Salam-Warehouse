using System;

namespace El_Salam_Warehouse.Application.Features.Categories.Shared;

public record CategoryDto(
    Guid Id,
    string Name,
    string? Description,
    string ColorHex,
    int ProductsCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    string? CreatedByName,
    string? UpdatedByName,
    int DisplayOrder = 0);
