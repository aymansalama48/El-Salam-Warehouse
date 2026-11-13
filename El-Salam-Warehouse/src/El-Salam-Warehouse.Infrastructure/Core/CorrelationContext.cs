using El_Salam_Warehouse.Application.Common.Abstractions.Core;
using El_Salam_Warehouse.Application.Common.Constants;
using Microsoft.AspNetCore.Http;

namespace El_Salam_Warehouse.Infrastructure.Core;

public class CorrelationContext : ICorrelationContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CorrelationContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string CorrelationId
    {
        get
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext is null) return Guid.NewGuid().ToString();

            if (httpContext.Items.TryGetValue(CorrelationConstants.HeaderKey, out var id) && id is string correlationId)
            {
                return correlationId;
            }

            return Guid.NewGuid().ToString();
        }
    }
}