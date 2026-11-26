import { 
  PlusCircle, 
  FileText, 
  DownloadCloud, 
  RefreshCw, 
  RotateCcw, 
  AlertTriangle, 
  Zap 
} from "lucide-react";

export function QuickActions({ 
  onRefresh, 
  onNewSupply, 
  onNewDispatch, 
  onNewReturn,
  onNewShortage,
  onNewQuickTransfer,
  onExport, 
  refreshing 
}) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
      {/* عنوان القسم والوصف */}
      <div className="shrink-0">
        <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">إجراءات سريعة</h3>
        <p className="text-2xs sm:text-xs text-slate-400 font-medium">الوصول السريع للمهام اليومية وتسجيل الأذونات بالمستودع</p>
      </div>

      {/* قائمة أزرار الإجراءات السريعة والأذونات */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {/* زر الحركة السريعة (وارد وصرف فوري) المميز */}
        {onNewQuickTransfer && (
          <button
            type="button"
            onClick={onNewQuickTransfer}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-amber-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer border border-amber-300/90 active:scale-95"
            title="تسجيل إذن وارد وصرف فوري معاً في نفس اللحظة"
          >
            <Zap className="w-4 h-4 text-amber-900 fill-amber-900 animate-bounce" />
            <span>⚡ حركة سريعة (وارد وصرف فوري)</span>
          </button>
        )}

        {/* إذن توريد جديد */}
        <button
          type="button"
          onClick={onNewSupply}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50/90 hover:bg-blue-100 border border-blue-200/70 rounded-xl transition-all cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>إذن توريد جديد</span>
        </button>

        {/* إذن صرف بضاعة */}
        <button
          type="button"
          onClick={onNewDispatch}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200/70 rounded-xl transition-all cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-600" />
          <span>إذن صرف بضاعة</span>
        </button>

        {/* إذن مرتجع جديد */}
        {onNewReturn && (
          <button
            type="button"
            onClick={onNewReturn}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-800 bg-amber-50/90 hover:bg-amber-100 border border-amber-200/70 rounded-xl transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>إذن مرتجع جديد</span>
          </button>
        )}

        {/* إذن تسوية عجز */}
        {onNewShortage && (
          <button
            type="button"
            onClick={onNewShortage}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50/90 hover:bg-purple-100 border border-purple-200/70 rounded-xl transition-all cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-purple-600" />
            <span>إذن تسوية عجز</span>
          </button>
        )}

        {/* تصدير جرد المستودع */}
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="تصدير جرد المستودع"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-slate-500" />
            <span>تصدير جرد المستودع</span>
          </button>
        )}

        {/* تحديث البيانات */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          title="تحديث الأرقام والإحصائيات"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
          <span>تحديث البيانات</span>
        </button>
      </div>
    </div>
  );
}

export default QuickActions;
