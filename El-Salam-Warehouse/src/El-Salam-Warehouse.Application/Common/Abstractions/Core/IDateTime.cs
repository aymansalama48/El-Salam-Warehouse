namespace El_Salam_Warehouse.Application.Common.Abstractions.Core;

public interface IDateTime
{
    DateTime Now { get; }
    DateTime UtcNow { get; }
    DateTime ToCairoTime(DateTime dateTime);
    string GetTimeString();
    string GetDateString();
    string GetDateTimeString();
    DateTime GetCurrentMonthStart();
    DateTime GetLastMonthStart();
    DateTime GetLastMonthEnd();
    (DateTime current, DateTime lastStart, DateTime lastEnd) GetMonthRange();
}
