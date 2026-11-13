namespace El_Salam_Warehouse.Application.Common.Models;

// ملف تقرير جاهز للتحميل
public record ReportFileDto(byte[] Content, string FileName, string ContentType);