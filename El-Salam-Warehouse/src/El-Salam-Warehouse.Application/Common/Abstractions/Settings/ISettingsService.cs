namespace El_Salam_Warehouse.Application.Common.Abstractions.Settings;

using System.IO;
using System.Threading;
using System.Threading.Tasks;

public class SystemSettingsDto
{
    public string WarehouseName { get; set; } = "مصنع السلام";
    public string Subtitle { get; set; } = "للكراسات والحلول الورقية";
    public string? LogoUrl { get; set; }
    public string ContactEmail { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Currency { get; set; } = "EGP";
}

public interface ISettingsService
{
    Task<SystemSettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default);
    Task<SystemSettingsDto> UpdateSettingsAsync(SystemSettingsDto dto, CancellationToken cancellationToken = default);
    Task<SystemSettingsDto> UpdateLogoAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default);
    SystemSettingsDto GetCachedSettings();
    byte[]? GetCachedLogoBytes();
}

