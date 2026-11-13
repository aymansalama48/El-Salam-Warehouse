using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Enums;

namespace El_Salam_Warehouse.Application.Features.Products.Queries.GetProductUnitTypes;

// DTO بيوصف نوع المنتج ومواصفات وحداته اللي بترجع للفرونت
public record ProductUnitTypeDto(
    ProductUnitType UnitType,
    string DisplayName,
    string BaseUnit,
    string SubUnit,
    StockEntryUnit EntryUnit);

// الكويري لجلب قائمة أنواع المنتجات المتاحة في النظام
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Products.View)]
public record GetProductUnitTypesQuery : IQuery<List<ProductUnitTypeDto>>;

// هاندلر بسيط بيرجع الأنواع من ProductUnitProfiles الثابت بدون الرجوع للداتابيز
internal sealed class GetProductUnitTypesQueryHandler : IQueryHandler<GetProductUnitTypesQuery, List<ProductUnitTypeDto>>
{
    public Task<Result<List<ProductUnitTypeDto>>> Handle(GetProductUnitTypesQuery request, CancellationToken cancellationToken)
    {
        var unitTypes = Enum.GetValues<ProductUnitType>()
            .Select(type =>
            {
                var profile = ProductUnitProfiles.Get(type);
                return new ProductUnitTypeDto(
                    type,
                    profile.DisplayName,
                    profile.BaseUnit,
                    profile.SubUnit,
                    profile.EntryUnit);
            })
            .ToList();

        return Task.FromResult(Result<List<ProductUnitTypeDto>>.Success(unitTypes));
    }
}

