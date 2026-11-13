using System;

namespace El_Salam_Warehouse.Application.Common.Models;

/// <summary>
/// نموذج بيانات خفيف (DTO) يستخدم خصيصاً لتعبئة القوائم المنسدلة (Dropdowns) في واجهات المستخدم (مثل Angular)
/// يعيد فقط المعرف والاسم لتقليل حجم البيانات المرسلة عبر الشبكة.
/// </summary>
public record LookupResponse(Guid Id, string Name);
