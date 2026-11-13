import { Plus, Download, Package, Layers, BookOpen, Box, Sliders } from "lucide-react";

export function ProductHeader({
  onAddProduct,
  onOpenReport,
  onOpenAlertSettings,
  summary = {},
}) {
  const totalProducts = summary.totalProducts ?? 0;
  const notebookPackets = summary.notebookPackets ?? 0;
  const notebookPieces = summary.notebookPieces ?? 0;
  const copyPaperCartons = summary.copyPaperCartons ?? 0;
  const copyPaperReams = summary.copyPaperReams ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">سجل المنتجات تامة الصنع والأصناف</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            إدارة الكشاكيل والكراريس وورق التصوير بالباكو والكرتونة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenAlertSettings}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-amber-600" />
            تنبيهات النواقص
          </button>
          <button
            type="button"
            onClick={onOpenReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            تقرير الجرد
          </button>
          <button
            type="button"
            onClick={onAddProduct}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            إضافة منتج جديد
          </button>
        </div>
      </div>

      {/* Summary Chips for Warehouse Stock - مربوطة بالـ Endpoint: GET /api/products/summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* عدد الأصناف المسجلة */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <p className="text-2xs font-bold text-slate-400">عدد الأصناف المسجلة</p>
            <p className="text-sm font-bold text-slate-800">{totalProducts.toLocaleString()} أصناف معتمدة</p>
          </div>
        </div>

        {/* الكشاكيل والكراريس */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="text-2xs font-bold text-slate-400">رصيد الكشاكيل والكراريس</p>
            <p className="text-sm font-bold text-indigo-900 flex items-baseline gap-1">
              <span>{notebookPackets.toLocaleString()}</span>
              <span className="text-xs font-semibold text-slate-500">باكو</span>
              <span className="text-2xs font-normal text-slate-400">({notebookPieces.toLocaleString()} كشكول)</span>
            </p>
          </div>
        </div>

        {/* كراتين ورق التصوير */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 shrink-0">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <p className="text-2xs font-bold text-slate-400">رصيد كراتين ورق التصوير</p>
            <p className="text-sm font-bold text-amber-900 flex items-baseline gap-1">
              <span>{copyPaperCartons.toLocaleString()}</span>
              <span className="text-xs font-semibold text-slate-500">كرتونة</span>
            </p>
          </div>
        </div>

        {/* رزم ورق التصوير */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="text-2xs font-bold text-slate-400">إجمالي رزم ورق التصوير</p>
            <p className="text-sm font-bold text-emerald-700 flex items-baseline gap-1">
              <span>{copyPaperReams.toLocaleString()}</span>
              <span className="text-xs font-semibold text-slate-500">رزمة</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductHeader;
