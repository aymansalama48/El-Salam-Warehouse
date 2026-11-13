using El_Salam_Warehouse.Domain.Common.Results;

namespace El_Salam_Warehouse.Application.Features.Categories.Shared;

public static class CategoryErrors
{
    public static readonly Error NotFound = new(
        "Category.NotFound",
        "الفئة المحددة غير موجودة في النظام.",
        ErrorType.NotFound);

    public static readonly Error NameAlreadyExists = new(
        "Category.NameAlreadyExists",
        "اسم الفئة مسجل بالفعل، يرجى اختيار اسم آخر.",
        ErrorType.Conflict);
}