namespace El_Salam_Warehouse.Infrastructure.Services.Settings;

using El_Salam_Warehouse.Application.Common.Abstractions.Core;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Common.Abstractions.Settings;
using El_Salam_Warehouse.Domain.Entities.Settings;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

public class SettingsService : ISettingsService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IWebHostEnvironment _environment;
    private readonly IDateTime _dateTime;
    private readonly ILogger<SettingsService> _logger;
    private readonly string _settingsFilePath;
    private readonly string _brandingFolderPath;

    private static readonly object _lock = new();
    private SystemSettingsDto _cachedSettings;
    private byte[]? _cachedLogoBytes;

    public SettingsService(
        IServiceScopeFactory scopeFactory,
        IWebHostEnvironment environment,
        IDateTime dateTime,
        ILogger<SettingsService> logger)
    {
        _scopeFactory = scopeFactory;
        _environment = environment;
        _dateTime = dateTime;
        _logger = logger;

        _settingsFilePath = Path.Combine(_environment.ContentRootPath, "siteSettings.json");
        _brandingFolderPath = Path.Combine(_environment.ContentRootPath, "uploads", "branding");

        _cachedSettings = LoadInitialSettings();
        _cachedLogoBytes = LoadLogoBytes(_cachedSettings.LogoUrl);
    }

    private SystemSettingsDto LoadInitialSettings()
    {
        try
        {
            if (File.Exists(_settingsFilePath))
            {
                var json = File.ReadAllText(_settingsFilePath);
                var dto = JsonSerializer.Deserialize<SystemSettingsDto>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (dto != null)
                {
                    return dto;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "تعذر قراءة ملف siteSettings.json، سيتم استخدام الإعدادات الافتراضية.");
        }

        return new SystemSettingsDto
        {
            WarehouseName = "مصنع السلام",
            Subtitle = "للكراسات والحلول الورقية",
            ContactEmail = "contact@elsalamwarehouse.com",
            PhoneNumber = "01012345678",
            Address = "المستودع الرئيسي - مصنع السلام",
            Currency = "EGP"
        };
    }

    private byte[]? LoadLogoBytes(string? logoUrl)
    {
        if (string.IsNullOrWhiteSpace(logoUrl)) return null;

        try
        {
            var fileName = Path.GetFileName(logoUrl);
            var physicalPath = Path.Combine(_brandingFolderPath, fileName);

            if (File.Exists(physicalPath))
            {
                return File.ReadAllBytes(physicalPath);
            }

            var cleanPath = logoUrl.TrimStart('/', '\\').Replace("uploads/", "").Replace("uploads\\", "");
            var fallbackPath = Path.Combine(_environment.ContentRootPath, "uploads", cleanPath);
            if (File.Exists(fallbackPath))
            {
                return File.ReadAllBytes(fallbackPath);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "تعذر تحميل ملف الشعار من المسار {LogoUrl}", logoUrl);
        }

        return null;
    }

    public Task<SystemSettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            return Task.FromResult(new SystemSettingsDto
            {
                WarehouseName = _cachedSettings.WarehouseName,
                Subtitle = _cachedSettings.Subtitle,
                LogoUrl = _cachedSettings.LogoUrl,
                ContactEmail = _cachedSettings.ContactEmail,
                PhoneNumber = _cachedSettings.PhoneNumber,
                Address = _cachedSettings.Address,
                Currency = _cachedSettings.Currency
            });
        }
    }

    public async Task<SystemSettingsDto> UpdateSettingsAsync(SystemSettingsDto dto, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            _cachedSettings.WarehouseName = string.IsNullOrWhiteSpace(dto.WarehouseName) ? "مصنع السلام" : dto.WarehouseName.Trim();
            _cachedSettings.Subtitle = string.IsNullOrWhiteSpace(dto.Subtitle) ? "للكراسات والحلول الورقية" : dto.Subtitle.Trim();
            _cachedSettings.ContactEmail = dto.ContactEmail?.Trim() ?? string.Empty;
            _cachedSettings.PhoneNumber = dto.PhoneNumber?.Trim() ?? string.Empty;
            _cachedSettings.Address = dto.Address?.Trim() ?? string.Empty;
            _cachedSettings.Currency = string.IsNullOrWhiteSpace(dto.Currency) ? "EGP" : dto.Currency.Trim();
            if (!string.IsNullOrWhiteSpace(dto.LogoUrl))
            {
                _cachedSettings.LogoUrl = dto.LogoUrl;
            }

            SaveSettingsToFile(_cachedSettings);
        }

        // مزامنة التعديلات مع قاعدة البيانات في خلفية الطلب
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

            var entity = await db.SiteSettings.FirstOrDefaultAsync(cancellationToken);
            if (entity == null)
            {
                entity = new SiteSetting
                {
                    WarehouseName = _cachedSettings.WarehouseName,
                    Address = _cachedSettings.Subtitle,
                    ContactEmail = _cachedSettings.ContactEmail,
                    PhoneNumber = _cachedSettings.PhoneNumber,
                    Currency = _cachedSettings.Currency,
                    LogoUrl = _cachedSettings.LogoUrl
                };
                await db.SiteSettings.AddAsync(entity, cancellationToken);
            }
            else
            {
                entity.WarehouseName = _cachedSettings.WarehouseName;
                entity.Address = _cachedSettings.Subtitle;
                entity.ContactEmail = _cachedSettings.ContactEmail;
                entity.PhoneNumber = _cachedSettings.PhoneNumber;
                entity.Currency = _cachedSettings.Currency;
                if (!string.IsNullOrWhiteSpace(_cachedSettings.LogoUrl))
                {
                    entity.LogoUrl = _cachedSettings.LogoUrl;
                }
            }

            await db.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "حدث خطأ أثناء مزامنة إعدادات المنشأة مع قاعدة البيانات، تم الحفظ محلياً بنجاح.");
        }

        return await GetSettingsAsync(cancellationToken);
    }

    public async Task<SystemSettingsDto> UpdateLogoAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        if (!Directory.Exists(_brandingFolderPath))
        {
            Directory.CreateDirectory(_brandingFolderPath);
        }

        // تنظيف أي لوجو قديم لتوفير المساحة
        try
        {
            var oldFiles = Directory.GetFiles(_brandingFolderPath, "logo_*.*");
            foreach (var f in oldFiles)
            {
                try { File.Delete(f); } catch { }
            }
        }
        catch { }

        // التأكد من امتداد png
        var ext = Path.GetExtension(fileName);
        if (string.IsNullOrWhiteSpace(ext) || !ext.Equals(".png", StringComparison.OrdinalIgnoreCase))
        {
            ext = ".png";
        }

        var newFileName = $"logo_{_dateTime.UtcNow.Ticks}{ext}";
        var physicalPath = Path.Combine(_brandingFolderPath, newFileName);

        using (var output = new FileStream(physicalPath, FileMode.Create, FileAccess.Write))
        {
            await fileStream.CopyToAsync(output, cancellationToken);
        }

        var webUrl = $"/uploads/branding/{newFileName}";

        lock (_lock)
        {
            _cachedSettings.LogoUrl = webUrl;
            _cachedLogoBytes = File.ReadAllBytes(physicalPath);
            SaveSettingsToFile(_cachedSettings);
        }

        // تحديث قاعدة البيانات
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
            var entity = await db.SiteSettings.FirstOrDefaultAsync(cancellationToken);
            if (entity != null)
            {
                entity.LogoUrl = webUrl;
                await db.SaveChangesAsync(cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "تعذر تحديث رابط الشعار في قاعدة البيانات، تم الحفظ محلياً.");
        }

        return await GetSettingsAsync(cancellationToken);
    }

    private void SaveSettingsToFile(SystemSettingsDto dto)
    {
        try
        {
            var json = JsonSerializer.Serialize(dto, new JsonSerializerOptions
            {
                WriteIndented = true
            });
            File.WriteAllText(_settingsFilePath, json);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "فشل حفظ إعدادات النظام في ملف siteSettings.json");
        }
    }

    public SystemSettingsDto GetCachedSettings()
    {
        lock (_lock)
        {
            return _cachedSettings;
        }
    }

    public byte[]? GetCachedLogoBytes()
    {
        lock (_lock)
        {
            return _cachedLogoBytes;
        }
    }
}

