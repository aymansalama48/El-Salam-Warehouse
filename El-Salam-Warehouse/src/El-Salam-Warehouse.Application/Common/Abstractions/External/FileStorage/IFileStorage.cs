using El_Salam_Warehouse.Domain.Common.Results;

namespace El_Salam_Warehouse.Application.Common.Abstractions.External.FileStorage;

public interface IFileStorage
{
    Task<Result<StoredFile>> UploadAsync(
        Stream fileStream,
        string storedFileName,
        string folderName,
        string contentType,
        CancellationToken cancellationToken = default);

    Task<Result<Stream>> DownloadAsync(
        string fileId,
        CancellationToken cancellationToken = default);

    Task<Result> DeleteAsync(
        string fileId,
        CancellationToken cancellationToken = default);

    Task<Result<bool>> ExistsAsync(
        string fileId,
        CancellationToken cancellationToken = default);
}