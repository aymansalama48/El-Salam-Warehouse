import { ArrowDownToLine, ArrowUpFromLine, RotateCcw, AlertTriangle, BookOpen, Box, Hash } from "lucide-react";

export function DaybookSummaryCards({ totals = {} }) {
  const {
    inboundVouchers = 0,
    outboundVouchers = 0,
    returnVouchers = 0,
    shortageVouchers = 0,
    inboundNotebooks = 0,
    outboundNotebooks = 0,
    returnNotebooks = 0,
    shortageNotebooks = 0,
    inboundCartons = 0,
    outboundCartons = 0,
    returnCartons = 0,
    shortageCartons = 0,
    inboundReams = 0,
    outboundReams = 0,
    returnReams = 0,
    shortageReams = 0,
  } = totals;

  const totalVouchers = inboundVouchers + outboundVouchers + returnVouchers + shortageVouchers;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-right">
      {/* 1. أذونات الوارد والصرف والمرتجع والعجز */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200/70 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-2xs font-bold text-slate-400 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-blue-500" />
            حركة الأذونات (غير الملغية)
          </span>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
            {totalVouchers} إذن
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ArrowDownToLine className="w-3.5 h-3.5" />
            </span>
            <div>
              <p className="text-3xs text-slate-400">الوارد</p>
              <p className="text-xs sm:text-sm font-bold text-emerald-700">{inboundVouchers.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
              <ArrowUpFromLine className="w-3.5 h-3.5" />
            </span>
            <div>
              <p className="text-3xs text-slate-400">الصرف</p>
              <p className="text-xs sm:text-sm font-bold text-rose-700">{outboundVouchers.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <RotateCcw className="w-3.5 h-3.5" />
            </span>
            <div>
              <p className="text-3xs text-slate-400">المرتجع</p>
              <p className="text-xs sm:text-sm font-bold text-amber-700">{returnVouchers.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
            <div>
              <p className="text-3xs text-slate-400">العجز</p>
              <p className="text-xs sm:text-sm font-bold text-purple-700">{shortageVouchers.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. حركة الكشاكيل والكراريس */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200/70 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-2xs font-bold text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            حركة الكشاكيل والكراريس
          </span>
          <span className="text-xs font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md">
            بالكشكول
          </span>
        </div>
        <div className={`grid ${(returnNotebooks > 0 || shortageNotebooks > 0) ? (returnNotebooks > 0 && shortageNotebooks > 0 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3") : "grid-cols-2"} gap-2 pt-1 border-t border-slate-100`}>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
              +
            </span>
            <div>
              <p className="text-2xs text-slate-400">إجمالي الوارد</p>
              <p className="text-sm font-bold text-emerald-700">{inboundNotebooks.toLocaleString()} <span className="text-2xs font-normal">كشكول</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 font-bold">
              -
            </span>
            <div>
              <p className="text-2xs text-slate-400">إجمالي الصرف</p>
              <p className="text-sm font-bold text-rose-700">{outboundNotebooks.toLocaleString()} <span className="text-2xs font-normal">كشكول</span></p>
            </div>
          </div>
          {returnNotebooks > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 font-bold">
                ↺
              </span>
              <div>
                <p className="text-2xs text-slate-400">إجمالي المرتجع</p>
                <p className="text-sm font-bold text-amber-700">{returnNotebooks.toLocaleString()} <span className="text-2xs font-normal">كشكول</span></p>
              </div>
            </div>
          )}
          {shortageNotebooks > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 font-bold">
                !
              </span>
              <div>
                <p className="text-2xs text-slate-400">إجمالي العجز</p>
                <p className="text-sm font-bold text-purple-700">{shortageNotebooks.toLocaleString()} <span className="text-2xs font-normal">كشكول</span></p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. حركة ورق التصوير */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200/70 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-2xs font-bold text-slate-400 flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-amber-500" />
            حركة ورق التصوير
          </span>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
            بالكرتونة
          </span>
        </div>
        <div className={`grid ${(returnCartons > 0 || returnReams > 0 || shortageCartons > 0 || shortageReams > 0) ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"} gap-2 pt-1 border-t border-slate-100`}>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
              +
            </span>
            <div>
              <p className="text-2xs text-slate-400">إجمالي الوارد</p>
              <p className="text-sm font-bold text-emerald-700">
                {inboundCartons.toLocaleString()} <span className="text-2xs font-normal">كرتونة</span>
                {inboundReams % 5 > 0 && (
                  <span className="text-2xs font-bold text-emerald-600 mr-1">
                    و {inboundReams % 5} رزمة
                  </span>
                )}
                {inboundReams > 0 && (
                  <span className="block text-2xs font-semibold text-emerald-600">
                    ({inboundReams.toLocaleString()} رزمة)
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 font-bold">
              -
            </span>
            <div>
              <p className="text-2xs text-slate-400">إجمالي الصرف</p>
              <p className="text-sm font-bold text-rose-700">
                {outboundCartons.toLocaleString()} <span className="text-2xs font-normal">كرتونة</span>
                {outboundReams % 5 > 0 && (
                  <span className="text-2xs font-bold text-rose-600 mr-1">
                    و {outboundReams % 5} رزمة
                  </span>
                )}
                {outboundReams > 0 && (
                  <span className="block text-2xs font-semibold text-rose-600">
                    ({outboundReams.toLocaleString()} رزمة)
                  </span>
                )}
              </p>
            </div>
          </div>
          {(returnCartons > 0 || returnReams > 0) && (
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 font-bold">
                ↺
              </span>
              <div>
                <p className="text-2xs text-slate-400">إجمالي المرتجع</p>
                <p className="text-sm font-bold text-amber-700">
                  {returnCartons.toLocaleString()} <span className="text-2xs font-normal">كرتونة</span>
                  {returnReams > 0 && (
                    <span className="block text-2xs font-semibold text-amber-600">
                      ({returnReams.toLocaleString()} رزمة)
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
          {(shortageCartons > 0 || shortageReams > 0) && (
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 font-bold">
                !
              </span>
              <div>
                <p className="text-2xs text-slate-400">إجمالي العجز</p>
                <p className="text-sm font-bold text-purple-700">
                  {shortageCartons.toLocaleString()} <span className="text-2xs font-normal">كرتونة</span>
                  {shortageReams > 0 && (
                    <span className="block text-2xs font-semibold text-purple-600">
                      ({shortageReams.toLocaleString()} رزمة)
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DaybookSummaryCards;

