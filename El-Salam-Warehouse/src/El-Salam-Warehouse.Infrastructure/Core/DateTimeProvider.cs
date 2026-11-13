using El_Salam_Warehouse.Application.Common.Abstractions.Core;
using System;

namespace El_Salam_Warehouse.Infrastructure.Core;

public class DateTimeProvider : IDateTime
{
    private static readonly TimeZoneInfo EgyptTimeZone =
        TimeZoneInfo.FindSystemTimeZoneById(OperatingSystem.IsWindows() ? "Egypt Standard Time" : "Africa/Cairo");

    // 🔹 1. الوقت الحالي بتوقيت القاهرة
    public DateTime Now =>
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, EgyptTimeZone);

    // 🔹 2. الوقت الحالي بنظام UTC
    public DateTime UtcNow => DateTime.UtcNow;

    // 🔹 3. تحويل أي وقت وتاريخ إلى توقيت مصر/القاهرة الرسمي
    public DateTime ToCairoTime(DateTime dateTime)
    {
        if (dateTime.Kind == DateTimeKind.Utc)
        {
            return TimeZoneInfo.ConvertTimeFromUtc(dateTime, EgyptTimeZone);
        }

        var utc = DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);
        return TimeZoneInfo.ConvertTimeFromUtc(utc, EgyptTimeZone);
    }

    // 🔹 4. الوقت كنص
    public string GetTimeString() =>
        Now.ToString("HH:mm:ss");

    // 🔹 5. التاريخ كنص
    public string GetDateString() =>
        Now.ToString("yyyy-MM-dd");

    // 🔹 6. التاريخ والوقت كنص
    public string GetDateTimeString() =>
        Now.ToString("yyyy-MM-dd HH:mm:ss");

    // 🔹 7. أول يوم في الشهر الحالي
    public DateTime GetCurrentMonthStart()
    {
        var now = Now;
        return new DateTime(now.Year, now.Month, 1);
    }

    // 🔹 8. أول يوم في الشهر اللي فات
    public DateTime GetLastMonthStart() =>
        GetCurrentMonthStart().AddMonths(-1);

    // 🔹 9. آخر لحظة في الشهر اللي فات
    public DateTime GetLastMonthEnd() =>
        GetCurrentMonthStart().AddTicks(-1);

    // 🔹 10. تجميع الـ 3 قيم في مرة واحدة
    public (DateTime current, DateTime lastStart, DateTime lastEnd) GetMonthRange() =>
        (GetCurrentMonthStart(), GetLastMonthStart(), GetLastMonthEnd());
}
