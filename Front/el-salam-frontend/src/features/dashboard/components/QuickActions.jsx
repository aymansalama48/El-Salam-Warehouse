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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5 space-y-3.5">
      {/* الترويسة: العنوان والأدوات المساعدة (تصدير وتحديث) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">إجراءات سريعة</h3>
            <p className="text-2xs sm:text-xs text-slate-400 font-medium">الوصول السريع للمهام اليومية وتسجيل الأذونات بالمستودع</p>
          </div>
        </div>

        {/* أدوات التحديث والتصدير */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onExport && (
            <button
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="تصدير بيان جرد أصناف المستودع"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-slate-500" />
              <span>تصدير جرد المستودع</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="تحديث الأرقام والإحصائيات"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
            <span>تحديث البيانات</span>
          </button>
        </div>
      </div>

      {/* شبكة أزرار العمليات والأذونات الخمسة */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* 1. حركة سريعة (وارد وصرف فوري) - مميزة وبارزة */}
        {onNewQuickTransfer && (
          <button
            onClick={onNewQuickTransfer}
            className="group relative flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-amber-950 border border-amber-300/90 shadow-xs hover:shadow-md transition-all cursor-pointer text-right"
            title="تسجيل إذن وارد وصرف فوري معاً في نفس اللحظة"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-950/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4 text-amber-950 fill-amber-950" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black truncate flex items-center gap-1">
                حركة سريعة
                <span className="text-3xs px-1 py-0.5 bg-amber-900/15 rounded font-black">فوري</span>
              </div>
              <div className="text-2xs text-amber-900/80 font-bold truncate">وارد + صرف معاً</div>
            </div>
          </button>
        )}

        {/* 2. إذن توريد جديد (وارد) */}
        <button
          onClick={onNewSupply}
          className="group flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-blue-50/70 hover:bg-blue-100/80 text-blue-900 border border-blue-200/70 hover:border-blue-300 transition-all cursor-pointer text-right shadow-2xs"
          title="تسجيل إذن توريد جديد وإضافة كميات للمخزن"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <PlusCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-extrabold truncate text-blue-900">إذن توريد جديد</div>
            <div className="text-2xs text-blue-600/80 font-medium truncate">إضافة بضاعة للمستودع</div>
          </div>
        </button>

        {/* 3. إذن صرف بضاعة (منصرف) */}
        <button
          onClick={onNewDispatch}
          className="group flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-200/70 hover:border-emerald-300 transition-all cursor-pointer text-right shadow-2xs"
          title="تسجيل إذن صرف وخروج بضاعة من المخزن"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-extrabold truncate text-emerald-900">إذن صرف بضاعة</div>
            <div className="text-2xs text-emerald-600/80 font-medium truncate">صرف وخروج من المخزن</div>
          </div>
        </button>

        {/* 4. إذن مرتجع جديد */}
        {onNewReturn && (
          <button
            onClick={onNewReturn}
            className="group flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-amber-50/60 hover:bg-amber-100/80 text-amber-900 border border-amber-200/70 hover:border-amber-300 transition-all cursor-pointer text-right shadow-2xs"
            title="تسجيل بضاعة مرتجعة إلى المخزن"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-extrabold truncate text-amber-900">إذن مرتجع جديد</div>
              <div className="text-2xs text-amber-600/80 font-medium truncate">إرجاع كميات للمستودع</div>
            </div>
          </button>
        )}

        {/* 5. إذن تسوية عجز */}
        {onNewShortage && (
          <button
            onClick={onNewShortage}
            className="group flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-purple-50/60 hover:bg-purple-100/80 text-purple-900 border border-purple-200/70 hover:border-purple-300 transition-all cursor-pointer text-right shadow-2xs"
            title="تسجيل عجز أو تالف وتسوية الرصيد"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-extrabold truncate text-purple-900">إذن تسوية عجز</div>
              <div className="text-2xs text-purple-600/80 font-medium truncate">معالجة وتعديل الأرصدة</div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

export default QuickActions;
