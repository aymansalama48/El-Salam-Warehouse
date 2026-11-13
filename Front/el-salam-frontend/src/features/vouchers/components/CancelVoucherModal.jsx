import { useState } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { validateCancelVoucher } from "../schemas/voucherSchema";

export function CancelVoucherModal({
  isOpen,
  onClose,
  onConfirm,
  voucherNumber,
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // التحقق من سبب الإلغاء عبر Zod
    const validation = validateCancelVoucher({ reason });
    if (!validation.success) {
      setError(validation.errors.reason || "يجب إدخال سبب إلغاء الإذن");
      return;
    }

    setError(null);
    try {
      setSubmitting(true);
      await onConfirm(reason.trim());
      onClose();
    } catch (err) {
      console.error("فشل في إلغاء الإذن:", err);
      setError(err.message || "حدث خطأ أثناء محاولة إلغاء الإذن بالخادم");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-md max-h-[calc(100dvh-2rem)] sm:max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-right">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                إلغاء إذن المخزن {voucherNumber ? `(${voucherNumber})` : ""}
              </h3>
              <p className="text-2xs text-rose-600 font-semibold mt-0.5">
                تنبيه: الإلغاء سيعكس ويعدل أرصدة الأصناف بالمستودع تلقائياً
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto" noValidate>
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold animate-in fade-in">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              سبب الإلغاء <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows="3"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="اكتب سبب إلغاء هذا الإذن (مثال: خطأ في إدخال الكميات، تم رفض الشحنة من العميل...)"
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white font-medium resize-none ${
                error ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-rose-500"
              }`}
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 pb-2 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0 sticky bottom-0 bg-white/95 backdrop-blur-xs z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 shadow-xs">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              رجوع
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {submitting ? "جاري الإلغاء..." : "تأكيد إلغاء الإذن"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CancelVoucherModal;
