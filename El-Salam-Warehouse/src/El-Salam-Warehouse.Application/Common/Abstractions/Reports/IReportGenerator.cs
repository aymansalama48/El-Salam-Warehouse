using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Entities.StockVouchers;
using El_Salam_Warehouse.Domain.Enums;

namespace El_Salam_Warehouse.Application.Common.Abstractions.Reports;

// بيرسم التقارير كملفات PDF
public interface IReportGenerator
{
    // تقرير دفتر اليومية
    byte[] GenerateDaybookReport(DaybookReportModel model);

    // تقرير جرد المنتجات
    byte[] GenerateProductsReport(ProductsReportModel model);

    // طباعة سند إذن استلام أو صرف مخزني
    byte[] GenerateStockVoucherPdf(StockVoucherPdfModel model);

    // طباعة بطاقة تعريف ومواصفات منتج تام / كشكول
    byte[] GenerateProductCardPdf(ProductCardPdfModel model);
}

// ---------- دفتر اليومية ----------

// سطر في تقرير الدفتر (حركة صنف واحد)
public record DaybookReportRow(
    string VoucherNumber,
    StockVoucherType Type,
    string Party,              // الجهة أو "صالة الإنتاج"
    string ReceiverName,
    string ProductName,
    string UnitLabel,          // كشكول / كرتونة
    int Quantity,
    ProductUnitType UnitType = ProductUnitType.Notebook,
    int QuantitySubUnits = 0,
    int UnitsPerBaseUnit = 0);

// يوم واحد في التقرير
public record DaybookReportDay(DateOnly Date, List<DaybookReportRow> Rows);

// إجماليات الفترة
public record DaybookReportTotals(
    int InboundVouchers,
    int OutboundVouchers,
    int InboundNotebooks,
    int OutboundNotebooks,
    int InboundCartons,
    int OutboundCartons,
    int InboundReams = 0,
    int OutboundReams = 0,
    int ReturnVouchers = 0,
    int ReturnNotebooks = 0,
    int ReturnCartons = 0,
    int ReturnReams = 0);

// بيانات تقرير الدفتر كاملة
public record DaybookReportModel(
    DateOnly FromDate,
    DateOnly ToDate,
    DateTime PrintedAtCairo,
    string ReportTypeTitle, // عنوان نوع الحركة (الكل / وارد / منصرف)
    DaybookReportTotals Totals,
    List<DaybookReportDay> Days,
    string? FilterDetails = null); // تفاصيل الفلاتر المطبقة (صالة الإنتاج / ورق تصوير / فئة ...)

// ---------- جرد المنتجات ----------

// سطر منتج في تقرير الجرد
public record ProductsReportRow(
    string Name,
    string BaseUnit,
    string SubUnit,
    int UnitsPerBaseUnit,
    int FullBaseUnits,
    int RemainingSubUnits,
    int TotalSubUnitStock,
    string StorageLocation,
    string StatusLabel);       // متوفر / منخفض / نفد

// فئة واحدة في التقرير
public record ProductsReportGroup(string CategoryName, List<ProductsReportRow> Rows);

// إجماليات الجرد
public record ProductsReportTotals(
    int ProductsCount,
    int NotebookPackets,
    int NotebookPieces,
    int CopyPaperCartons,
    int CopyPaperReams);

// بيانات تقرير الجرد كاملة
public record ProductsReportModel(
    string CategoryTitle,      // اسم الفئة أو "جميع الفئات"
    DateTime PrintedAtCairo,
    ProductsReportTotals Totals,
    List<ProductsReportGroup> Groups);

// ---------- سند إذن المخزن (وارد / صرف) ----------

public record StockVoucherPdfItem(
    int Index,
    string ProductName,
    string CategoryName,
    string UnitLabel,
    int Quantity,
    int FullBaseUnits,
    int RemainingSubUnits,
    int TotalSubUnits,
    string BaseUnit,
    string SubUnit
);

public record StockVoucherPdfModel(
    Guid VoucherId,
    string VoucherNumber,
    StockVoucherType Type,
    StockVoucherStatus Status,
    VoucherSource Source,
    DateOnly VoucherDate,
    DateTime OccurredAtCairo,
    string PartyName,
    string ReceiverName,
    string? DelivererName,
    string? Notes,
    string CreatedByName,
    string? CancelledByName,
    DateTime? CancelledAtCairo,
    string? CancellationReason,
    List<StockVoucherPdfItem> Items,
    ReturnDirection? ReturnDirection = null,
    string? ReturnReason = null
);

// ---------- بطاقة تعريف ومواصفات صنف تام الصنع ----------

public record ProductCardPdfModel(
    Guid ProductId,
    string Name,
    string CategoryName,
    string? CategoryColor,
    string BaseUnit,
    string SubUnit,
    int UnitsPerBaseUnit,
    int FullBaseUnits,
    int RemainingSubUnits,
    int TotalSubUnits,
    string StorageLocation,
    string StatusLabel,
    string CreatedByName,
    DateTime? CreatedAtCairo,
    string? UpdatedByName,
    DateTime? UpdatedAtCairo,
    DateTime PrintedAtCairo
);
