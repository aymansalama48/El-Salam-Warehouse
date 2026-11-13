import { Plus, Download } from "lucide-react";

export function TransactionHeader({ onNewTransaction, onExport }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">دفتر اليومية وحركة المستودع الورقي</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          تسجيل أذونات توريد رولات الورق، صرف خامات التشغيل للماكينات، واستلام وخروج الكشاكيل
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onExport}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-500" />
          تصدير حركة اليومية
        </button>
        <button
          onClick={onNewTransaction}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          تسجيل حركة مخزنية
        </button>
      </div>
    </div>
  );
}
