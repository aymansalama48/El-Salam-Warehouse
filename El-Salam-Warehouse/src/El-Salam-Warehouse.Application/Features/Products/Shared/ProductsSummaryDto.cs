namespace El_Salam_Warehouse.Application.Features.Products.Shared;

// ملخص كروت الإحصائيات اللي فوق صفحة المنتجات
public record ProductsSummaryDto(
    int TotalProducts,       // عدد الأصناف المسجلة
    int NotebookPackets,     // رصيد الكشاكيل بالباكو (مثال: 120)
    int NotebookPieces,      // رصيد الكشاكيل بالكشكول (مثال: 1200)
    int CopyPaperCartons,    // رصيد ورق التصوير بالكرتونة (مثال: 60)
    int CopyPaperReams);     // إجمالي الرزم (مثال: 300)