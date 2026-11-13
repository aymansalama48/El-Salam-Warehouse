using System;
using System.Collections.Generic;

namespace El_Salam_Warehouse.Application.Features.Dashboard.Shared;

// كائن إحصائيات لوحة التحكم الرئيسية لمستودع السلام (داتا حقيقية من الداتابيز)
public record DashboardStatsDto(
    // 1. الإجماليات العامة للمخزون
    int TotalProducts,            // إجمالي الأصناف المسجلة
    int TotalCategories,          // إجمالي الفئات
    int TotalPacks,               // إجمالي البواكي بالمستودع (كشكول + كراس)
    int TotalCartons,             // إجمالي الكراتين بالمستودع (ورق تصوير)
    int TotalSubUnits,            // إجمالي الرصيد بالوحدات الصغرى (كشكول/كراس/رزمة)
    int LowStockCount,            // عدد الأصناف اللي قربت تخلص
    int OutOfStockCount,          // عدد الأصناف اللي رصيدها صفر

    // 2. تفصيل الأرصدة حسب نوع المنتج (كشكول، كراس، ورق تصوير)
    ProductTypeStockSummary Notebooks,   // إحصائيات الكشاكيل
    ProductTypeStockSummary Booklets,    // إحصائيات الكراريس
    ProductTypeStockSummary CopyPaper,   // إحصائيات ورق التصوير

    // 3. نشاط وحركات المستودع (أذونات اليوم والشهر)
    int InboundToday,             // عدد أذونات الوارد النهاردة
    int OutboundToday,            // عدد أذونات المنصرف النهاردة
    int TodayTransactionsCount,   // إجمالي حركات اليوم
    int InboundThisMonth,         // أذونات الوارد للشهر الحالي
    int OutboundThisMonth,        // أذونات المنصرف للشهر الحالي
    int TotalInboundQuantityToday,// إجمالي الكميات المستلمة النهاردة (بالقطعة/الرزمة)
    int TotalOutboundQuantityToday,// إجمالي الكميات المنصرفة النهاردة (بالقطعة/الرزمة)

    // 4. قائمة الأصناف الحرجة أو المنخفضة
    List<DashboardLowStockItemDto> LowStockItems,

    // 5. آخر الحركات المسجلة في المستودع
    List<DashboardRecentActivityDto> RecentActivities,

    // 6. آخر حركة مسجلة
    string? LastVoucherNumber,
    DateTime? LastVoucherAtUtc
);

// ملخص الرصيد لكل نوع منتج
public record ProductTypeStockSummary(
    int ProductCount,             // عدد الأصناف من النوع ده
    int FullBaseUnits,            // عدد البواكي أو الكراتين الكاملة
    int RemainingSubUnits,        // رزم أو قطع فرط
    int TotalSubUnits,            // إجمالي القطع أو الرزم
    string BaseUnitName,          // باكو / كرتونة
    string SubUnitName            // كشكول / كراس / رزمة
);

// صنف قارب على النفاد أو رصيده منخفض
public record DashboardLowStockItemDto(
    Guid ProductId,
    string ProductName,
    string CategoryName,
    int UnitType,
    int TotalSubUnitStock,
    int UnitsPerBaseUnit,
    int FullBaseUnits,
    int RemainingSubUnits,
    string BaseUnit,
    string SubUnit,
    string EntryUnitLabel,
    string Status                 // "منعدم" أو "منخفض"
);

// حركة حديثة في المستودع للداشبورد
public record DashboardRecentActivityDto(
    Guid VoucherId,
    string VoucherNumber,
    int Type,                     // 1 = وارد, 2 = منصرف
    DateOnly VoucherDate,
    DateTime OccurredAtUtc,
    string? PartyName,
    string ReceiverName,
    string Description,           // ملخص البنود أو اسم الصنف والكمية
    string QuantityLabel,         // مثال: 500 كراس
    int ItemsCount
);

