using El_Salam_Warehouse.Api.Middlewares;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using System;
using System.IO;

namespace El_Salam_Warehouse.Api.Extensions;

// كلاس لتجميع وترتيب خط سير معالجة الطلبات (Middleware Pipeline)
public static class PipelineExtensions
{
    // تطبيق خط سير الطلبات بالترتيب الصحيح
    public static WebApplication UseApplicationPipeline(this WebApplication app)
    {
        // 1. تتبع معرف الطلب (Correlation ID) في أول نقطة دخول
        app.UseMiddleware<CorrelationIdMiddleware>();

        // 2. الهيدرز الأمنية وتحديد معدل الطلبات (Security Headers & Rate Limiting)
        app.UseMiddleware<SecurityHeadersMiddleware>();
        app.UseMiddleware<RateLimitIdentityMiddleware>();
        app.UseRateLimiter();

        // 3. معالجة الأخطاء العامة وتسجيل الطلبات عبر Serilog
        app.UseExceptionHandler();
        app.UseSerilogLogging();

        // 4. التحويل إلى HTTPS وسياسة CORS للفرونت إند
        app.UseHttpsRedirection();
        app.UseCors("AllowFrontend");

        // 5. تمكين خدمة الملفات الثابتة للفرونت إند (React) في wwwroot
        // تفعيل قراءة index.html كملف افتراضي عند طلب المسار الرئيسي /
        app.UseDefaultFiles();

        // خدمة الملفات الثابتة مع منع كاش index.html ليظهر أي تحديث فوراً
        app.UseStaticFiles(new StaticFileOptions
        {
            OnPrepareResponse = ctx =>
            {
                if (ctx.File.Name.Equals("index.html", StringComparison.OrdinalIgnoreCase))
                {
                    ctx.Context.Response.Headers.CacheControl = "no-cache, no-store, must-revalidate";
                    ctx.Context.Response.Headers.Pragma = "no-cache";
                    ctx.Context.Response.Headers.Expires = "0";
                }
            }
        });

        // مسار ملفات المرفقات والرفع الخاصة بالنظام (uploads)
        var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");
        if (!Directory.Exists(uploadsPath))
        {
            Directory.CreateDirectory(uploadsPath);
        }

        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(uploadsPath),
            RequestPath = "/uploads"
        });

        // 6. التحقق من الهوية والصلاحيات (Authentication & Authorization)
        app.UseAuthentication();
        app.UseAuthorization();

        // 7. توجيه الطلبات إلى الـ Controllers
        app.MapControllers();

        // 8. توثيق الـ API عبر OpenAPI و Scalar
        app.UseOpenApiDocumentation();

        // 9. دعم مسارات الفرونت إند (React SPA Fallback) مع استبعاد مسارات الـ API بالكامل
        app.MapFallback(async context =>
        {
            // لو الطلب بيبدأ بـ /api ميرجعش index.html أبداً ويرجع 404 عادي
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                return;
            }

            // استبعاد مسارات التوثيق في حال طلب مسار غير موجود
            if (context.Request.Path.StartsWithSegments("/scalar") || context.Request.Path.StartsWithSegments("/openapi"))
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                return;
            }

            var env = context.RequestServices.GetRequiredService<IWebHostEnvironment>();
            var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
            var indexPath = Path.Combine(webRoot, "index.html");

            if (!File.Exists(indexPath))
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                return;
            }

            // إرسال index.html مع هيدر no-cache عشان أي نشر جديد للفرونت يظهر مباشرة
            context.Response.Headers.CacheControl = "no-cache, no-store, must-revalidate";
            context.Response.Headers.Pragma = "no-cache";
            context.Response.Headers.Expires = "0";
            context.Response.ContentType = "text/html; charset=utf-8";

            await context.Response.SendFileAsync(indexPath);
        });

        return app;
    }
}
