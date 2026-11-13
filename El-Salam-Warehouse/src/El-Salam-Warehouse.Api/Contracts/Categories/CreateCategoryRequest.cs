namespace El_Salam_Warehouse.Api.Contracts.Categories;

public record CreateCategoryRequest(string Name, string? Description, string ColorHex);