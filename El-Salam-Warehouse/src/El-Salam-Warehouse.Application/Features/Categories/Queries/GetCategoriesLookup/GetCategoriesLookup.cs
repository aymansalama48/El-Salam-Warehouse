using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Domain.Common.Results;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.Categories.Queries.GetCategoriesLookup;

// DTO مخصص للـ Dropdown (بيانات خفيفة جداً)
public record CategoryLookupDto(Guid Id, string Name);

// Query
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Categories.View)]
public record GetCategoriesLookupQuery() : IQuery<List<CategoryLookupDto>>;

// Handler
internal sealed class GetCategoriesLookupQueryHandler : IQueryHandler<GetCategoriesLookupQuery, List<CategoryLookupDto>>
{
    private readonly IReadDbContext _readContext;

    public GetCategoriesLookupQueryHandler(IReadDbContext readContext)
    {
        _readContext = readContext;
    }

    public async Task<Result<List<CategoryLookupDto>>> Handle(GetCategoriesLookupQuery request, CancellationToken cancellationToken)
    {
        var lookup = await _readContext.Categories
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.CreatedAt)
            .Select(c => new CategoryLookupDto(c.Id, c.Name))
            .ToListAsync(cancellationToken);

        return Result<List<CategoryLookupDto>>.Success(lookup);
    }
}