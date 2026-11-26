import { 
  PlusCircle, 
  FileText, 
  DownloadCloud, 
  RefreshCw, 
  RotateCcw, 
  AlertTriangle, 
  Zap,
  Sparkles
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
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5">
      {/* 1. الترويسة: العنوان على اليمين وأدوات التحديث والتصدير على اليسار بشكل منظم */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">إجراءات سريعة</h3>
            <p className="text-2xs sm:text-xs text-slate-400 font-medium">الوصول السريع للمهام اليومية وتسجيل الأذونات بالمستودع</p>
          </div>
        </div>

        {/* أدوات النظام: التصدير وتحديث البيانات */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
              title="تصدير بيان جرد أصناف المستودع"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-slate-500" />
              <span>تصدير جرد المستودع</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50 active:scale-95"
            title="تحديث الأرقام والإحصائيات"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
            <span>تحديث البيانات</span>
          </button>
        </div>
      </div>

      {/* 2. شبكة أزرار الأذونات: متناسقة ومرتبة بدقة متناهية */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* زر الحركة السريعة (وارد وصرف فوري) المميز بنصه وشكله الذهبي الكامل */}
        {onNewQuickTransfer && (
          <button
            type="button"
            onClick={onNewQuickTransfer}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-black text-amber-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer border border-amber-300/90 active:scale-95 text-center"
            title="تسجيل إذن وارد وصرف فوري معاً في نفس اللحظة"
          >
            <Zap className="w-4 h-4 text-amber-900 fill-amber-900 animate-bounce shrink-0" />
            <span className="truncate">⚡ حركة سريعة (وارد وصرف فوري)</span>
          </button>
        )}

        {/* إذن توريد جديد */}
        <button
          type="button"
          onClick={onNewSupply}
          className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-blue-700 bg-blue-50/90 hover:bg-blue-100 border border-blue-200/80 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 text-center"
        >
          <PlusCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="truncate">إذن توريد جديد</span>
        </button>

        {/* إذن صرف بضاعة */}
        <button
          type="button"
          onClick={onNewDispatch}
          className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 text-center"
        >
          <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="truncate">إذن صرف بضاعة</span>
        </button>

        {/* إذن مرتجع جديد */}
        {onNewReturn && (
          <button
            type="button"
            onClick={onNewReturn}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-amber-800 bg-amber-50/90 hover:bg-amber-100 border border-amber-200/80 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 text-center"
          >
            <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="truncate">إذن مرتجع جديد</span>
          </button>
        )}

        {/* إذن تسوية عجز */}
        {onNewShortage && (
          <button
            type="button"
            onClick={onNewShortage}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-purple-700 bg-purple-50/90 hover:bg-purple-100 border border-purple-200/80 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 text-center"
          >
            <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="truncate">إذن تسوية عجز</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default QuickActions;
