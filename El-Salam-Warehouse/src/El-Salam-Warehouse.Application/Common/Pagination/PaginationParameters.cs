namespace El_Salam_Warehouse.Application.Common.Pagination;

/// <summary>
/// يمثل بيانات الـ Pagination القادمة من الـ Client.
/// </summary>
public class PaginationParameters
{
    public const int DefaultPageSize = 20;
    public const int MaxPageSize = 1000;

    private int _pageNumber = 1;
    private int _pageSize = DefaultPageSize;

    public PaginationParameters()
    {
    }

    public PaginationParameters(int pageNumber, int pageSize)
    {
        PageNumber = pageNumber;
        PageSize = pageSize;
    }

    /// <summary>
    /// رقم الصفحة الحالية.
    /// </summary>
    public int PageNumber
    {
        get => _pageNumber;
        set => _pageNumber = value < 1 ? 1 : value;
    }

    /// <summary>
    /// اسم بديل لرقم الصفحة لدعم الـ query parameter باسم page.
    /// </summary>
    public int Page
    {
        get => _pageNumber;
        set => _pageNumber = value < 1 ? 1 : value;
    }

    /// <summary>
    /// عدد العناصر في الصفحة.
    /// </summary>
    public int PageSize
    {
        get => _pageSize;
        set
        {
            if (value < 1)
                _pageSize = DefaultPageSize;
            else
                _pageSize = value > MaxPageSize ? MaxPageSize : value;
        }
    }

    /// <summary>
    /// عدد العناصر التي سيتم تخطيها.
    /// </summary>
    public int Skip => (PageNumber - 1) * PageSize;
}
