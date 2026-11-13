using El_Salam_Warehouse.Application.Common.Abstractions.External.FileStorage;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Infrastructure.Options;
using Microsoft.Extensions.Options;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Infrastructure.External.FileStorage;

// خدمة تخزين الملفات محلياً على السيرفر (Local File System)
public class LocalFileStorage : IFileStorage
{
    // إعدادات التخزين المحلي المقروءة من الـ appsettings
    private readonly FileStorageOptions _options;

    public LocalFileStorage(IOptions<FileStorageOptions> options)
    {
        _options = options.Value;
    }

    // رفع وحفظ الملف في المجلد المحدد محلياً
    public async Task<Result<StoredFile>> UploadAsync(
        Stream fileStream,
        string storedFileName,
        string folderName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // 1. تحديد المسار الكامل للفولدر المستهدف
            var targetDirectory = Path.Combine(_options.RootFolder, folderName);

            // 2. إنشاء المجلد إذا لم يكن موجوداً
            if (_options.CreateIfNotExists && !Directory.Exists(targetDirectory))
            {
                Directory.CreateDirectory(targetDirectory);
            }

            // 3. تحديد المسار الكامل للملف
            var filePath = Path.Combine(targetDirectory, storedFileName);

            // 4. حفظ محتوى الملف على القرص
            await using (var outputStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                await fileStream.CopyToAsync(outputStream, cancellationToken);
            }

            // 5. تجهيز المعرف النسبي ورابط العرض
            var relativePath = Path.Combine(folderName, storedFileName).Replace('\\', '/');
            var webViewLink = $"/uploads/{relativePath}";

            var storedFile = new StoredFile(
                FileId: relativePath,
                WebViewLink: webViewLink,
                SizeInBytes: fileStream.Length);

            return Result<StoredFile>.Success(storedFile);
        }
        catch (Exception ex)
        {
            return Result<StoredFile>.Failure(new Error("FileStorage.UploadError", $"فشل في حفظ الملف: {ex.Message}", ErrorType.Failure));
        }
    }

    // قراءة وتحميل الملف من القرص المحلي كـ Stream
    public Task<Result<Stream>> DownloadAsync(
        string fileId,
        CancellationToken cancellationToken = default)
    {
        var filePath = Path.Combine(_options.RootFolder, fileId);

        if (!File.Exists(filePath))
        {
            return Task.FromResult(Result<Stream>.Failure(new Error("FileStorage.NotFound", "الملف المطلوب غير موجود على الخادم.", ErrorType.NotFound)));
        }

        var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult(Result<Stream>.Success(stream));
    }

    // حذف الملف من القرص المحلي
    public Task<Result> DeleteAsync(
        string fileId,
        CancellationToken cancellationToken = default)
    {
        var filePath = Path.Combine(_options.RootFolder, fileId);

        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }

        return Task.FromResult(Result.Success());
    }

    // التحقق من وجود الملف على القرص المحلي
    public Task<Result<bool>> ExistsAsync(
        string fileId,
        CancellationToken cancellationToken = default)
    {
        var filePath = Path.Combine(_options.RootFolder, fileId);
        return Task.FromResult(Result<bool>.Success(File.Exists(filePath)));
    }
}
