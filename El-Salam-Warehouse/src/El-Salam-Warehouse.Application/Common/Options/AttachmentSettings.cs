namespace El_Salam_Warehouse.Application.Common.Options;

public class AttachmentSettings
{
    public const string SectionName = "AttachmentSettings";
    public long MaxSizeInMB { get; set; } = 10;
    public string[] AllowedExtensions { get; set; } = { ".jpg", ".jpeg", ".png", ".pdf" };
}
