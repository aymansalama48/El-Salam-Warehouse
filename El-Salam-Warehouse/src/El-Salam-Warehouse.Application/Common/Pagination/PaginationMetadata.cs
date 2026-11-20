using System;

namespace El_Salam_Warehouse.Application.Common.Pagination;

/// <summary>
/// معلومات الـ Pagination الخاصة بالاستجابة.
/// </summary>
public sealed class PaginationMetadata
{
    private int? _totalPages;
    private bool? _hasPreviousPage;
    private bool? _hasNextPage;

    public PaginationMetadata()
    {
    }

    public PaginationMetadata(int currentPage, int pageSize, int totalCount)
    {
        CurrentPage = currentPage < 1 ? 1 : currentPage;
        PageSize = pageSize < 1 ? 1 : pageSize;
        TotalCount = totalCount < 0 ? 0 : totalCount;
    }

    public int CurrentPage { get; init; } = 1;

    public int PageSize { get; init; } = 20;

    public int TotalCount { get; init; }

    public int TotalPages
    {
        get => _totalPages ?? (TotalCount == 0 ? 0 : (int)Math.Ceiling((double)TotalCount / (PageSize > 0 ? PageSize : 1)));
        init => _totalPages = value;
    }

    public bool HasPreviousPage
    {
        get => _hasPreviousPage ?? (CurrentPage > 1);
        init => _hasPreviousPage = value;
    }

    public bool HasNextPage
    {
        get => _hasNextPage ?? (CurrentPage < TotalPages);
        init => _hasNextPage = value;
    }
}
