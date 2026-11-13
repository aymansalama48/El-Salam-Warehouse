namespace El_Salam_Warehouse.Application.Common.Abstractions.External.FileStorage;

public record StoredFile(
    string FileId,
    string? WebViewLink,
    long SizeInBytes
);
