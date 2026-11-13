using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using El_Salam_Warehouse.Application.Common.Abstractions.Core;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Features.Dashboard.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.Dashboard.Queries.GetDashboardStats;

// هاندلر مسؤول عن حساب وتجميع إحصائيات لوحة التحكم من قاعدة البيانات
internal sealed class GetDashboardStatsQueryHandler
    : IQueryHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
    private readonly IReadDbContext _readContext;
    private readonly IDateTime _dateTime;

    public GetDashboardStatsQueryHandler(IReadDbContext readContext, IDateTime dateTime)
    {
        _readContext = readContext;
        _dateTime = dateTime;
    }

    public async Task<Result<DashboardStatsDto>> Handle(
        GetDashboardStatsQuery request,
        CancellationToken cancellationToken)
    {
        // 1. جلب كل المنتجات مع فئاتها
        var products = await _readContext.Products
            .Include(p => p.Category)
            .ToListAsync(cancellationToken);

        // عدد الفئات المسجلة في النظام
        var totalCategories = await _readContext.Categories
            .CountAsync(cancellationToken);

        // 2. تقسيم المنتجات حسب نوعها الصريح (كشكول / كراس / ورق تصوير)
        var notebookProducts = products.Where(p => p.UnitType == ProductUnitType.Notebook).ToList();
        var bookletProducts = products.Where(p => p.UnitType == ProductUnitType.Booklet).ToList();
        var copyPaperProducts = products.Where(p => p.UnitType == ProductUnitType.CopyPaper).ToList();

        // حساب إحصائيات الكشاكيل
        var notebookSummary = new ProductTypeStockSummary(
            ProductCount: notebookProducts.Count,
            FullBaseUnits: notebookProducts.Sum(p => p.UnitsPerBaseUnit > 0 ? p.TotalSubUnitStock / p.UnitsPerBaseUnit : 0),
            RemainingSubUnits: notebookProducts.Sum(p => p.UnitsPerBaseUnit > 0 ? p.TotalSubUnitStock % p.UnitsPerBaseUnit : 0),
            TotalSubUnits: notebookProducts.Sum(p => p.TotalSubUnitStock),
            BaseUnitName: "باكو",
            SubUnitName: "كشكول"
        );

        // حساب إحصائيات الكراريس
        var bookletSummary = new ProductTypeStockSummary(
            ProductCount: bookletProducts.Count,
            FullBaseUnits: bookletProducts.Sum(p => p.UnitsPerBaseUnit > 0 ? p.TotalSubUnitStock / p.UnitsPerBaseUnit : 0),
            RemainingSubUnits: bookletProducts.Sum(p => p.UnitsPerBaseUnit > 0 ? p.TotalSubUnitStock % p.UnitsPerBaseUnit : 0),
            TotalSubUnits: bookletProducts.Sum(p => p.TotalSubUnitStock),
            BaseUnitName: "باكو",
            SubUnitName: "كراس"
        );

        // حساب إحصائيات ورق التصوير
        var copyPaperSummary = new ProductTypeStockSummary(
            ProductCount: copyPaperProducts.Count,
            FullBaseUnits: copyPaperProducts.Sum(p => p.UnitsPerBaseUnit > 0 ? p.TotalSubUnitStock / p.UnitsPerBaseUnit : 0),
            RemainingSubUnits: copyPaperProducts.Sum(p => p.UnitsPerBaseUnit > 0 ? p.TotalSubUnitStock % p.UnitsPerBaseUnit : 0),
            TotalSubUnits: copyPaperProducts.Sum(p => p.TotalSubUnitStock),
            BaseUnitName: "كرتونة",
            SubUnitName: "رزمة"
        );

        // إجمالي البواكي الكاملة (كشكول + كراس)
        var totalPacks = notebookSummary.FullBaseUnits + bookletSummary.FullBaseUnits;
        // إجمالي الكراتين الكاملة (ورق تصوير)
        var totalCartons = copyPaperSummary.FullBaseUnits;
        // إجمالي الوحدات الصغرى كلها
        var totalSubUnits = products.Sum(p => p.TotalSubUnitStock);

        // 3. تحديد الأصناف الحرجة وقاربت على النفاد بناءً على حد النواقص المخصص لكل صنف
        var lowStockList = new List<DashboardLowStockItemDto>();
        foreach (var p in products)
        {
            var isOutOfStock = ProductRules.IsOutOfStock(p.TotalSubUnitStock);
            var thresholdSubUnits = (p.LowStockThresholdUnit == StockEntryUnit.BaseUnit && p.UnitsPerBaseUnit > 0)
                ? p.LowStockThreshold * p.UnitsPerBaseUnit
                : p.LowStockThreshold;
            var isLowStock = !isOutOfStock && ProductRules.IsLowStock(p.TotalSubUnitStock, thresholdSubUnits);

            if (isOutOfStock || isLowStock)
            {
                var fullBase = p.UnitsPerBaseUnit > 0 ? p.TotalSubUnitStock / p.UnitsPerBaseUnit : 0;
                var remSub = p.UnitsPerBaseUnit > 0 ? p.TotalSubUnitStock % p.UnitsPerBaseUnit : 0;

                lowStockList.Add(new DashboardLowStockItemDto(
                    ProductId: p.Id,
                    ProductName: p.Name,
                    CategoryName: p.Category?.Name ?? "بدون فئة",
                    UnitType: (int)p.UnitType,
                    TotalSubUnitStock: p.TotalSubUnitStock,
                    UnitsPerBaseUnit: p.UnitsPerBaseUnit,
                    FullBaseUnits: fullBase,
                    RemainingSubUnits: remSub,
                    BaseUnit: p.BaseUnit,
                    SubUnit: p.SubUnit,
                    EntryUnitLabel: p.EntryUnitLabel,
                    Status: isOutOfStock ? "منعدم" : "منخفض"
                ));
            }
        }

        var outOfStockCount = lowStockList.Count(x => x.Status == "منعدم");
        var lowStockCount = lowStockList.Count;

        // 4. إحصائيات أذونات وحركات المستودع لليوم والشهر
        var today = DateOnly.FromDateTime(_dateTime.Now);
        var monthStart = new DateOnly(today.Year, today.Month, 1);

        var monthVouchers = await _readContext.StockVouchers
            .Include(v => v.Items)
            .Where(v => v.VoucherDate >= monthStart && v.VoucherDate <= today)
            .ToListAsync(cancellationToken);

        var activeVouchers = monthVouchers.Where(v => v.Status == StockVoucherStatus.Active).ToList();
        var activeToday = activeVouchers.Where(v => v.VoucherDate == today).ToList();

        var inboundToday = activeToday.Count(v => v.Type == StockVoucherType.Inbound);
        var outboundToday = activeToday.Count(v => v.Type == StockVoucherType.Outbound);
        var todayTransactionsCount = inboundToday + outboundToday;

        var inboundThisMonth = activeVouchers.Count(v => v.Type == StockVoucherType.Inbound);
        var outboundThisMonth = activeVouchers.Count(v => v.Type == StockVoucherType.Outbound);

        var totalInboundQuantityToday = activeToday
            .Where(v => v.Type == StockVoucherType.Inbound)
            .SelectMany(v => v.Items)
            .Sum(i => i.QuantitySubUnits);

        var totalOutboundQuantityToday = activeToday
            .Where(v => v.Type == StockVoucherType.Outbound)
            .SelectMany(v => v.Items)
            .Sum(i => i.QuantitySubUnits);

        // 5. جلب آخر 6 حركات فعلية في المستودع
        var recentVouchers = await _readContext.StockVouchers
            .Include(v => v.Items)
            .ThenInclude(i => i.Product)
            .OrderByDescending(v => v.OccurredAtUtc)
            .Take(6)
            .ToListAsync(cancellationToken);

        var recentActivities = recentVouchers.Select(v =>
        {
            var firstItem = v.Items.FirstOrDefault();
            var description = firstItem != null
                ? (v.Items.Count > 1
                    ? $"{firstItem.ProductName} و {v.Items.Count - 1} أصناف أخرى"
                    : firstItem.ProductName)
                : "إذن بدون بنود";

            string quantityLabel;
            if (firstItem == null)
            {
                quantityLabel = "—";
            }
            else if (v.Items.Count > 1)
            {
                quantityLabel = $"{v.Items.Count} أصناف مختلفة";
            }
            else
            {
                var isCopyPaper = firstItem.Product?.UnitType == ProductUnitType.CopyPaper || firstItem.UnitLabel == "كرتونة" || firstItem.UnitLabel == "رزمة";
                var unitsPer = firstItem.Product?.UnitsPerBaseUnit > 0 ? firstItem.Product.UnitsPerBaseUnit : 5;

                if (isCopyPaper)
                {
                    if (firstItem.UnitLabel == "كرتونة")
                    {
                        quantityLabel = $"{firstItem.Quantity:N0} كرتونة ({firstItem.QuantitySubUnits:N0} رزمة)";
                    }
                    else
                    {
                        var cartons = firstItem.Quantity / unitsPer;
                        var rem = firstItem.Quantity % unitsPer;
                        quantityLabel = rem > 0
                            ? $"{cartons:N0} كرتونة و {rem} رزمة ({firstItem.Quantity:N0} رزمة)"
                            : $"{cartons:N0} كرتونة ({firstItem.Quantity:N0} رزمة)";
                    }
                }
                else
                {
                    quantityLabel = $"{firstItem.Quantity:N0} {firstItem.UnitLabel}";
                }
            }

            return new DashboardRecentActivityDto(
                VoucherId: v.Id,
                VoucherNumber: v.VoucherNumber,
                Type: (int)v.Type,
                VoucherDate: v.VoucherDate,
                OccurredAtUtc: v.OccurredAtUtc,
                PartyName: v.PartyName,
                ReceiverName: v.ReceiverName,
                Description: description,
                QuantityLabel: quantityLabel,
                ItemsCount: v.Items.Count
            );
        }).ToList();

        // آخر حركة مسجلة في المستودع
        var lastVoucher = recentVouchers.FirstOrDefault();

        var resultDto = new DashboardStatsDto(
            TotalProducts: products.Count,
            TotalCategories: totalCategories,
            TotalPacks: totalPacks,
            TotalCartons: totalCartons,
            TotalSubUnits: totalSubUnits,
            LowStockCount: lowStockCount,
            OutOfStockCount: outOfStockCount,
            Notebooks: notebookSummary,
            Booklets: bookletSummary,
            CopyPaper: copyPaperSummary,
            InboundToday: inboundToday,
            OutboundToday: outboundToday,
            TodayTransactionsCount: todayTransactionsCount,
            InboundThisMonth: inboundThisMonth,
            OutboundThisMonth: outboundThisMonth,
            TotalInboundQuantityToday: totalInboundQuantityToday,
            TotalOutboundQuantityToday: totalOutboundQuantityToday,
            LowStockItems: lowStockList,
            RecentActivities: recentActivities,
            LastVoucherNumber: lastVoucher?.VoucherNumber,
            LastVoucherAtUtc: lastVoucher?.OccurredAtUtc
        );

        return Result<DashboardStatsDto>.Success(resultDto);
    }
}

