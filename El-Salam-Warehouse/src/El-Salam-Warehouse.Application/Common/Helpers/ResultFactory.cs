using El_Salam_Warehouse.Domain.Common.Results;
using System;
using System.Linq;
using System.Reflection;

namespace El_Salam_Warehouse.Application.Common.Helpers;

// كلاس مساعد لإنشاء نتائج الفشل (Failure Results) بشكل ديناميكي داخل الـ Pipeline Behaviors
public static class ResultFactory
{
    // إنشاء كائن نتيجة فاشلة متوافق مع النوع العام المطلوب TResponse
    public static TResponse CreateFailure<TResponse>(Error error)
    {
        // 1. لو الرد من نوع Result العادي (بدون قيمة مرجعة)
        if (typeof(TResponse) == typeof(Result))
        {
            return (TResponse)(object)Result.Failure(error);
        }

        // 2. لو الرد من نوع عام يحمل بيانات Result<T> (زي PagedResult<UserDto>)
        if (typeof(TResponse).IsGenericType && typeof(TResponse).GetGenericTypeDefinition() == typeof(Result<>))
        {
            var valueType = typeof(TResponse).GetGenericArguments()[0];

            // البحث عن دالة Failure في Result<T> باستخدام الـ Reflection
            var failureMethod = typeof(Result<>)
                .MakeGenericType(valueType)
                .GetMethods(BindingFlags.Public | BindingFlags.Static)
                .FirstOrDefault(m => m.Name == nameof(Result.Failure) &&
                                     m.GetParameters().Length == 1 &&
                                     m.GetParameters()[0].ParameterType == typeof(Error));

            if (failureMethod is not null)
            {
                return (TResponse)failureMethod.Invoke(null, new object[] { error })!;
            }
        }

        throw new InvalidOperationException($"لا يمكن إنشاء نتيجة فشل للنوع {typeof(TResponse).Name}.");
    }
}
