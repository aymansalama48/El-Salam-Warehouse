using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.CurrentUser;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using System.Linq;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Api.Filters;

/// <summary>
/// فلتر أمان وصلاحيات مركزي يفحص أوتوماتيكياً أي أكشن أو كنترولر مزود بـ [Permission(Permissions.X)]
/// ويتحقق لحظياً من قاعدة البيانات والكاش من امتلاك المستخدم للصلاحية الفعلية
/// </summary>
public class PermissionAuthorizationFilter : IAsyncAuthorizationFilter
{
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        // 1. البحث عن سمة PermissionAttribute على مستوى الأكشن أو الكنترولر
        var endpoint = context.HttpContext.GetEndpoint();
        var permissionAttr = endpoint?.Metadata.GetMetadata<PermissionAttribute>()
            ?? context.ActionDescriptor.EndpointMetadata.OfType<PermissionAttribute>().FirstOrDefault();

        // إذا كان الأكشن غير مقيد بصلاحية محددة نتركه يمر
        if (permissionAttr == null)
        {
            return;
        }

        // 2. التحقق من أن المستخدم مسجل دخوله وموثق بالـ JWT
        var user = context.HttpContext.User;
        if (!user.Identity?.IsAuthenticated ?? true)
        {
            context.Result = new UnauthorizedObjectResult(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Unauthorized",
                Detail = "يجب تسجيل الدخول أولاً لتنفيذ هذه العملية."
            });
            return;
        }

        // 3. استخراج معرف المستخدم الحالي
        var currentUser = context.HttpContext.RequestServices.GetRequiredService<ICurrentUser>();
        if (!currentUser.UserId.HasValue)
        {
            context.Result = new UnauthorizedObjectResult(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Unauthorized",
                Detail = "تعذر تحديد هوية المستخدم صاحب الطلب."
            });
            return;
        }

        // 4. التحقق اللحظي من الصلاحية عبر خدمة IPermissionService (مدعومة بكاش ذكي وفوري السريان)
        var permissionService = context.HttpContext.RequestServices.GetRequiredService<IPermissionService>();
        var hasPermission = await permissionService.HasPermissionAsync(
            currentUser.UserId.Value,
            permissionAttr.Name,
            context.HttpContext.RequestAborted);

        if (!hasPermission)
        {
            context.Result = new ObjectResult(new ProblemDetails
            {
                Status = StatusCodes.Status403Forbidden,
                Title = "Forbidden",
                Detail = $"عفواً، لا تمتلك الصلاحية المطلوبة ({permissionAttr.Name}) لتنفيذ هذا الإجراء."
            })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
        }
    }
}

