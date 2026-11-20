using System.Collections.Generic;

namespace El_Salam_Warehouse.Application.Common.Pagination;

/// <summary>
/// يمثل بيانات مقسمة على صفحات.
/// </summary>
public sealed class PagedResult<T>
{
    public PagedResult()
    {
    }

    public PagedResult(IReadOnlyList<T> items, PaginationMetadata pagination)
    {
        Items = items;
        Pagination = pagination;
    }

    public PagedResult(IReadOnlyList<T> items, int currentPage, int pageSize, int totalCount)
    {
        Items = items;
        Pagination = new PaginationMetadata(currentPage, pageSize, totalCount);
    }

    public static PagedResult<T> Create(IReadOnlyList<T> items, int currentPage, int pageSize, int totalCount)
        => new(items, currentPage, pageSize, totalCount);

    /// <summary>
    /// العناصر الموجودة فى الصفحة الحالية.
    /// </summary>
    public IReadOnlyList<T> Items { get; init; } = [];

    /// <summary>
    /// معلومات الصفحات.
    /// </summary>
    public PaginationMetadata Pagination { get; init; } = null!;
}
