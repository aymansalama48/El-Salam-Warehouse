using System;

namespace El_Salam_Warehouse.Application.Common.Pagination;

/// <summary>
/// معلومات الـ Pagination الخاصة بالاستجابة.
/// </summary>
public sealed class PaginationMetadata
{
    public PaginationMetadata()
    {
    }

    public PaginationMetadata(int currentPage, int pageSize, int totalCount)
    {
        CurrentPage = currentPage < 1 ? 1 : currentPage;
        PageSize = pageSize < 1 ? 1 : pageSize;
        TotalCount = totalCount < 0 ? 0 : totalCount;
        TotalPages = TotalCount == 0 ? 0 : (int)Math.Ceiling((double)TotalCount / (PageSize > 0 ? PageSize : 1));
        HasPreviousPage = CurrentPage > 1;
        HasNextPage = CurrentPage < TotalPages;
    }

    public int CurrentPage { get; init; } = 1;

    public int PageSize { get; init; } = 20;

    public int TotalCount { get; init; }

    public int TotalPages { get; init; }

    public bool HasPreviousPage { get; init; }

    public bool HasNextPage { get; init; }
}
