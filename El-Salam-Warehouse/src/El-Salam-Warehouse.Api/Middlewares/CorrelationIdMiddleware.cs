using El_Salam_Warehouse.Application.Common.Constants;
using Microsoft.AspNetCore.Http;
using Serilog.Context;

namespace El_Salam_Warehouse.Api.Middlewares;

public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers.TryGetValue(CorrelationConstants.HeaderKey, out var value)
            ? value.ToString()
            : Guid.NewGuid().ToString();

        context.Items[CorrelationConstants.HeaderKey] = correlationId;

        context.Response.OnStarting(() =>
        {
            context.Response.Headers[CorrelationConstants.HeaderKey] = correlationId;
            return Task.CompletedTask;
        });

        using (LogContext.PushProperty("CorrelationId", correlationId))
        {
            await _next(context);
        }
    }
}