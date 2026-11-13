import { useRef, useEffect } from "react";
import { X, Printer, Loader2 } from "lucide-react";
import { showToast } from "../../utils/alertUtils";

export function DetailsModal({
  isOpen,
  onClose,
  title = "تفاصيل السجل",
  subtitle = "",
  badge,
  icon: Icon,
  fields = [],
  extraInfo,
  loading = false,
  onPrint,
  printing = false,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isOpen, loading]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    showToast("جاري إعداد السند للطباعة...", "info");
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[88dvh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-slate-50/90 shrink-0">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-xs ring-4 ring-slate-100 shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-slate-900 text-base leading-snug">{title}</h3>
                {badge && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs ${badge.className || "bg-blue-50 text-blue-700 border-blue-200"}`}>
                    {badge.text}
                  </span>
                )}
                {loading && (
                  <span className="inline-flex items-center gap-1.5 text-2xs text-blue-600 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    جاري التحميل...
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs font-medium text-slate-400 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Fields Grid */}
        <div ref={scrollRef} className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">جاري تحميل البيانات من الخادم...</p>
                <p className="text-xs text-slate-400 mt-1">يتم استرجاع أحدث بيانات السجل المعتمدة</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
              {fields.map((field, idx) => {
                const FieldIcon = field.icon;
                return (
                  <div
                    key={idx}
                    className={`group p-3 sm:p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/60 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all duration-150 flex items-start gap-3 ${
                      field.fullWidth ? "sm:col-span-2" : ""
                    }`}
                  >
                    {FieldIcon && (
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 text-slate-600 flex items-center justify-center shadow-2xs shrink-0 mt-0.5 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                        <FieldIcon className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 text-right">
                      <span className="block text-2xs font-bold text-slate-400 uppercase tracking-normal mb-0.5">
                        {field.label}
                      </span>
                      <div className="text-xs sm:text-sm font-extrabold text-slate-900 break-words leading-relaxed">
                        {field.render ? field.render() : (field.value || "—")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {extraInfo && (
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100/80 text-slate-700 text-xs leading-relaxed flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
              <span>{extraInfo}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 shrink-0">
          <button
            onClick={handlePrint}
            type="button"
            disabled={loading || printing}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {printing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>جاري إعداد السند...</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4 text-slate-500" />
                <span>طباعة السند / البطاقة</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            type="button"
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-200/80 hover:bg-slate-200 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
