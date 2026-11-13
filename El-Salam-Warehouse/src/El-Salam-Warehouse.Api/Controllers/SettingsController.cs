using El_Salam_Warehouse.Api.Controllers.Base;
using El_Salam_Warehouse.Application.Common.Abstractions.Settings;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Api.Controllers;

[Authorize]
public class SettingsController : BaseApiController
{
    private readonly ISettingsService _settingsService;

    public SettingsController(ISettingsService settingsService)
    {
        _settingsService = settingsService;
    }

    // 1. جلب إعدادات المنشأة والنظام والشعار الحالي
    [HttpGet]
    [AllowAnonymous]
    public async Task<IResult> GetSettings(CancellationToken cancellationToken)
    {
        var settings = await _settingsService.GetSettingsAsync(cancellationToken);
        return HandleResult(Result<SystemSettingsDto>.Success(settings));
    }

    // 2. تحديث بيانات المنشأة واسم المصنع
    [HttpPut]
    [El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(Permissions.Settings.Manage)]
    public async Task<IResult> UpdateSettings([FromBody] SystemSettingsDto request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            return HandleResult(Result.Failure(new Error("Settings.Invalid", "بيانات الإعدادات غير صالحة.", ErrorType.Validation)));
        }

        var result = await _settingsService.UpdateSettingsAsync(request, cancellationToken);
        return HandleResult(Result<SystemSettingsDto>.Success(result));
    }

    // 3. رفع وتحديث شعار المنشأة الرسمي (PNG)
    [HttpPost("logo")]
    [El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(Permissions.Settings.Manage)]
    [Consumes("multipart/form-data")]
    public async Task<IResult> UploadLogo(IFormFile file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return HandleResult(Result.Failure(new Error("Settings.EmptyFile", "يرجى اختيار ملف الشعار المطلوب رفعه.", ErrorType.Validation)));
        }

        // الحد الأقصى للملف 5 ميجابايت
        if (file.Length > 5 * 1024 * 1024)
        {
            return HandleResult(Result.Failure(new Error("Settings.FileTooLarge", "حجم ملف الشعار يجب ألا يتجاوز 5 ميجابايت.", ErrorType.Validation)));
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext != ".png")
        {
            return HandleResult(Result.Failure(new Error("Settings.InvalidFormat", "شعار المنشأة يجب أن يكون بصيغة PNG حصراً لضمان أعلى جودة ودعم الشفافية.", ErrorType.Validation)));
        }

        using var stream = file.OpenReadStream();
        var result = await _settingsService.UpdateLogoAsync(stream, file.FileName, file.ContentType, cancellationToken);
        return HandleResult(Result<SystemSettingsDto>.Success(result));
    }
}

