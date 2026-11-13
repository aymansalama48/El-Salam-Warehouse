using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Entities.StockVouchers;
using El_Salam_Warehouse.Domain.Enums;

namespace El_Salam_Warehouse.Application.Features.StockVouchers.Shared;

// عنصر في قايمة الإذونات
public record StockVoucherListItemDto(
    Guid Id,
    string VoucherNumber,
    StockVoucherType Type,
    DateOnly VoucherDate,
    DateTime OccurredAtUtc,
    VoucherSource Source,
    string? PartyName,
    string ReceiverName,
    string? DelivererName,
    StockVoucherStatus Status,
    int ItemsCount,
    ReturnDirection? ReturnDirection = null,
    string? ReturnReason = null,
    string? ShortageReason = null);

// بند في تفاصيل الإذن
public record StockVoucherItemDto(
    Guid ProductId,
    string ProductName,
    string UnitLabel,                 // كشكول / كرتونة
    StockEntryUnit EntryUnit,
    int Quantity,                     // زي ما اتكتبت
    int QuantitySubUnits,             // بأصغر وحدة
    int BalanceBeforeSubUnits,
    int BalanceAfterSubUnits);

// تفاصيل الإذن كاملة (للعرض والطباعة)
public record StockVoucherDto(
    Guid Id,
    string VoucherNumber,
    StockVoucherType Type,
    DateOnly VoucherDate,
    DateTime OccurredAtUtc,
    VoucherSource Source,
    string? PartyName,
    string ReceiverName,
    string? DelivererName,
    string? Notes,
    StockVoucherStatus Status,
    string? CancelReason,
    DateTime? CancelledAtUtc,
    List<StockVoucherItemDto> Items,
    DateTime CreatedAt,
    string? CreatedByName,
    string? CancelledByName,
    ReturnDirection? ReturnDirection = null,
    string? ReturnReason = null,
    string? ShortageReason = null);

// ملخص الإذونات (الشريط الجانبي + الكروت)
public record StockVouchersSummaryDto(
    int InboundToday,
    int OutboundToday,
    int InboundThisMonth,
    int OutboundThisMonth,
    int CancelledToday,
    string? LastVoucherNumber,
    DateTime? LastVoucherAtUtc,
    int ReturnsToday = 0,
    int ReturnsThisMonth = 0,
    int ShortagesToday = 0,
    int ShortagesThisMonth = 0);