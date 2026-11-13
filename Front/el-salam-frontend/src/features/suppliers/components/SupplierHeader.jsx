import { Plus, Download } from "lucide-react";

export function SupplierHeader({ onOpenAddModal, onExport, count }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">سجل موردي الورق ومستلزمات الإنتاج</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          إدارة ومتابعة مطاحن الورق، موردي الأغلفة، مستلزمات التجليد والشرنك ({count} مورد مسجل)
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onExport}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-500" />
          تصدير الموردين
        </button>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          إضافة مورد جديد
        </button>
      </div>
    </div>
  );
}

