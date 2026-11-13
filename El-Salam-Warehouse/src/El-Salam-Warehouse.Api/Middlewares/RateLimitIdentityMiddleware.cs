namespace El_Salam_Warehouse.Api.Middlewares;

using System.Text.Json;

/// <summary>
/// Extracts the identity field (e.g. email) from a small JSON request body so the rate
/// limiter can partition on it.
/// </summary>
public sealed class RateLimitIdentityMiddleware(RequestDelegate next)
{
    internal const string ItemKey = "RateLimitIdentity.";
    private const int MaxBufferedBytes = 8 * 1024;

    public async Task InvokeAsync(HttpContext context)
    {
        var needsBody =
            context.Request.ContentType?.Contains("application/json", StringComparison.OrdinalIgnoreCase) == true
            && context.Request.ContentLength is > 0 and <= MaxBufferedBytes;

        if (needsBody)
        {
            try
            {
                context.Request.EnableBuffering();
                context.Request.Body.Position = 0;

                using var reader = new StreamReader(
                    context.Request.Body, leaveOpen: true);

                var raw = await reader.ReadToEndAsync(context.RequestAborted);
                context.Request.Body.Position = 0;

                if (raw.Length > 0)
                {
                    using var document = JsonDocument.Parse(raw);
                    var root = document.RootElement;

                    if (root.ValueKind == JsonValueKind.Object)
                    {
                        foreach (var field in new[] { "email", "to", "identifier" })
                        {
                            if (root.TryGetProperty(field, out var element)
                                && element.ValueKind == JsonValueKind.String)
                            {
                                context.Items[ItemKey + field] = element.GetString();
                            }
                        }
                    }
                }
            }
            catch (JsonException)
            {
                // Malformed JSON: model binding will report it. Partition by IP only.
            }
        }

        await next(context);
    }
}
