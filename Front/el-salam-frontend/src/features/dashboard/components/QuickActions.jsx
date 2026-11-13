import { PlusCircle, FileText, DownloadCloud, RefreshCw } from "lucide-react";

export function QuickActions({ onRefresh, onNewSupply, onNewDispatch, onExport, refreshing }) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-2xs flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="font-bold text-slate-800 text-sm">إجراءات سريعة</h3>
        <p className="text-2xs text-slate-400 font-medium">الوصول السريع للمهام اليومية الأكثر تكراراً بالمستودع</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          title="تحديث الأرقام والإحصائيات"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>تحديث البيانات</span>
        </button>

        <button
          onClick={onNewSupply}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>إذن توريد جديد</span>
        </button>

        <button
          onClick={onNewDispatch}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>إذن صرف بضاعة</span>
        </button>

        <button
          onClick={onExport}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
        >
          <DownloadCloud className="w-3.5 h-3.5 text-slate-500" />
          <span>تصدير جرد المستودع</span>
        </button>
      </div>
    </div>
  );
}

export default QuickActions;
