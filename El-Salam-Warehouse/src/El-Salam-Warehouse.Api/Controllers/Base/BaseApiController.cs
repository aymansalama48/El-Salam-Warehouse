using El_Salam_Warehouse.Api.Extensions;
using El_Salam_Warehouse.Domain.Common.Results;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

namespace El_Salam_Warehouse.Api.Controllers.Base;

// كلاس أساسي لكل الـ Controllers بيوفر الوصول لـ MediatR ومساعدات تحويل النتائج
[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    private ISender? _sender;

    // الحصول على وسيط MediatR لإرسال الأوامر والاستعلامات
    protected ISender Sender => _sender ??= HttpContext.RequestServices.GetRequiredService<ISender>();

    // تحويل كائن النتيجة Result إلى استجابة HTTP ملائمة
    protected IResult HandleResult(Result result) =>
        result.ToHttpResponse(HttpContext);

    // تحويل كائن النتيجة العامة Result<T> إلى استجابة HTTP ملائمة
    protected IResult HandleResult<T>(Result<T> result) =>
        result.ToHttpResponse(HttpContext);
}
