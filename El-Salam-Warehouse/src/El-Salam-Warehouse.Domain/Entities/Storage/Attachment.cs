using El_Salam_Warehouse.Domain.Common.Entities;
using System;

namespace El_Salam_Warehouse.Domain.Entities.Storage;

// كيان بيمثل أي ملف مرفوع في السيستم (زي صورة البروفايل أو مستند)
public class Attachment : SoftDeleteEntity
{
    // اسم الملف الأصلي وقت الرفع
    public string FileName { get; private set; } = string.Empty;

    // اسم الملف المتخزن على السيرفر بعد التعديل أو التشفير
    public string StoredName { get; private set; } = string.Empty;

    // نوع محتوى الملف (MIME type زي image/png)
    public string ContentType { get; private set; } = string.Empty;

    // المعرف الفريد للملف أو مساره
    public string FileId { get; private set; } = string.Empty;

    // رابط خارجي للملف لو متاح
    public string? ExternalUrl { get; private set; }

    // حجم الملف بالبايت
    public long SizeInBytes { get; private set; }

    // نوع الكيان المرتبط بيه الملف (مثلاً User)
    public string? EntityType { get; private set; }

    // معرف الكيان المرتبط بيه الملف
    public Guid? EntityId { get; private set; }

    // Constructor فاضي خاص بـ EF Core
    private Attachment() { }

    // Constructor خاص لإنشاء كائن جديد ببيانات كاملة
    private Attachment(string fileName, string storedName, string contentType, string fileId, long sizeInBytes, string? externalUrl, string? entityType, Guid? entityId)
    {
        FileName = fileName;
        StoredName = storedName;
        ContentType = contentType;
        FileId = fileId;
        SizeInBytes = sizeInBytes;
        ExternalUrl = externalUrl;
        EntityType = entityType;
        EntityId = entityId;
    }

    // Factory Method لإنشاء الكيان بطريقة نظيفة ومتحكم فيها
    public static Attachment Create(string fileName, string storedName, string contentType, string fileId, long sizeInBytes, string? externalUrl = null, string? entityType = null, Guid? entityId = null)
    {
        return new Attachment(fileName, storedName, contentType, fileId, sizeInBytes, externalUrl, entityType, entityId);
    }

    // ميثود لربط الملف بكيان معين في السيستم لاحقاً (زي ربط صورة بمستخدم)
    public void AssignToEntity(string entityType, Guid entityId)
    {
        // نتأكد إن الملف مش مربوط بكيان تاني مسبقاً
        if (EntityId != null || EntityType != null)
        {
            throw new InvalidOperationException("هذا الملف مرتبط بكيان آخر بالفعل.");
        }
        
        // نتأكد إن نوع الكيان مش فاضي
        if (string.IsNullOrWhiteSpace(entityType))
        {
            throw new ArgumentException("نوع الكيان لا يمكن أن يكون فارغاً", nameof(entityType));
        }
            
        EntityType = entityType;
        EntityId = entityId;
    }
}
