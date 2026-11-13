using El_Salam_Warehouse.Api.Extensions;
using El_Salam_Warehouse.Infrastructure.DependencyInjection;
using Microsoft.AspNetCore.Builder;

// إنشاء معالج بناء التطبيق
var builder = WebApplication.CreateBuilder(args);

// 1. تسجيل إعدادات ونظام التسجيل عبر Serilog
builder.AddSerilogLogging();

// تحميل إعدادات حدود تنبيه النواقص إن وجدت
try
{
    var alertSettingsFile = System.IO.Path.Combine(builder.Environment.ContentRootPath, "stockAlertSettings.json");
    if (System.IO.File.Exists(alertSettingsFile))
    {
        var json = System.IO.File.ReadAllText(alertSettingsFile);
        using var doc = System.Text.Json.JsonDocument.Parse(json);
        if (doc.RootElement.TryGetProperty("packetThreshold", out var pElem) && pElem.TryGetInt32(out var pVal))
        {
            El_Salam_Warehouse.Domain.Entities.Products.ProductRules.LowStockThresholdPackets = pVal;
        }
        if (doc.RootElement.TryGetProperty("cartonThreshold", out var cElem) && cElem.TryGetInt32(out var cVal))
        {
            El_Salam_Warehouse.Domain.Entities.Products.ProductRules.LowStockThresholdCartons = cVal;
        }
    }
}
catch { }

// 2. تسجيل جميع خدمات طبقات التطبيق (Application, Infrastructure, Presentation)
builder.Services.AddApplicationServices(builder.Configuration, builder.Environment);

// بناء كائن التطبيق
var app = builder.Build();

// 3. تطبيق الـ Migrations وعملية الـ Seeding للرولات وحساب الأدمن الافتراضي
await app.SeedDatabaseAsync();

// 4. تطبيق خط سير الطلبات (Middlewares Pipeline)
app.UseApplicationPipeline();

// 5. تشغيل السيرفر واستقبال الطلبات
app.Run();
