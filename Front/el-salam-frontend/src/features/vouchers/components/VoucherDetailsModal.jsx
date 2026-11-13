import { useState, useEffect } from "react";
import { 
  X, 
  Printer, 
  AlertTriangle, 
  Building2, 
  User, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  XCircle,
  Truck,
  Hash,
  Loader2,
  UserCheck
} from "lucide-react";
import { getStockVoucherById, getStockVoucherPdf } from "../services/voucherService";
import { formatCairoDateTime, formatCairoDate } from "../../../utils/dateUtils";
import { handlePdfDownloadAndPreview } from "../../../utils/reportUtils";
import { showError } from "../../../utils/alertUtils";
import { VOUCHER_TYPE, VOUCHER_SOURCE, VOUCHER_STATUS } from "../schemas/voucherSchema";

export function VoucherDetailsModal({
  isOpen,
  onClose,
  voucherId,
  onOpenCancel,
}) {
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!isOpen || !voucherId) return;

    let ignore = false;

    getStockVoucherById(voucherId)
      .then((data) => {
        if (!ignore) {
          setVoucher(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("فشل في تحميل تفاصيل الإذن:", err);
          setError(err.message || "تعذر تحميل تفاصيل الإذن من الخادم");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, voucherId]);

  if (!isOpen) return null;

  const handlePrint = async () => {
    if (!voucherId || printing) return;
    setPrinting(true);
    try {
      const blob = await getStockVoucherPdf(voucherId);
      const prefix = voucher?.type === VOUCHER_TYPE.INBOUND ? "إذن_استلام_وارد" : "إذن_صرف_مخزني";
      const fileName = `${prefix}_${voucher?.voucherNumber || voucherId}.pdf`;
      handlePdfDownloadAndPreview(blob, fileName);
    } catch (err) {
      console.error("فشل في طباعة الإذن:", err);
      showError("تعذر طباعة الإذن", err.message || "حدث خطأ أثناء إعداد ملف الـ PDF من الخادم");
    } finally {
      setPrinting(false);
    }
  };

  const isInbound = voucher?.type === VOUCHER_TYPE.INBOUND;
  const isCancelled = voucher?.status === VOUCHER_STATUS.CANCELLED;
  const isProduction = voucher?.source === VOUCHER_SOURCE.PRODUCTION;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-2xl max-h-[calc(100dvh-2rem)] sm:max-h-[88dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-right">
        {/* Modal Top Bar */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/90 via-white to-slate-50/90 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ring-4 ring-slate-100 ${
                isCancelled
                  ? "bg-slate-200 text-slate-600"
                  : isInbound
                  ? "bg-emerald-600 text-white"
                  : "bg-rose-600 text-white"
              }`}
            >
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                  {isInbound ? "إذن استلام وارد" : "إذن صرف مخزني"}
                </h3>
                {voucher?.voucherNumber && (
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    {voucher.voucherNumber}
                  </span>
                )}
                {isCancelled && (
                  <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                    ملغي
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                مصنع السلام للكراسات والحلول الورقية - سند معتمد
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content & Printable Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4 sm:space-y-5 print:p-8 print:m-0 print:text-black">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <p className="text-xs font-bold text-slate-700">جاري تحميل بيانات وتفاصيل الإذن...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold text-center">
              {error}
            </div>
          ) : voucher ? (
            <div className="space-y-5" id="printable-voucher">
              {/* شارة الإلغاء إذا كان الإذن ملغياً */}
              {isCancelled && (
                <div className="p-3.5 bg-rose-50 border-2 border-dashed border-rose-300 rounded-xl space-y-1 text-rose-900">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>تم إلغاء هذا الإذن وعكس الحركات والأرصدة في المستودع</span>
                  </div>
                  {voucher.cancelledByName && (
                    <p className="text-2xs text-rose-800 font-bold pr-6">
                      أُلغي بواسطة: {voucher.cancelledByName} {voucher.cancelledAtUtc && `— ${formatCairoDateTime(voucher.cancelledAtUtc)}`}
                    </p>
                  )}
                  {voucher.cancelReason && (
                    <p className="text-2xs text-rose-700 font-medium pr-6">
                      سبب الإلغاء: {voucher.cancelReason}
                    </p>
                  )}
                </div>
              )}

              {/* ترويسة الإذن الرسمية للطباعة */}
              <div className="border-b border-slate-200 pb-3.5 flex justify-between items-start">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    {isInbound ? "إذن استلام وإيداع بضاعة واردة" : "إذن صرف وخروج بضاعة"}
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">شركة ومصنع السلام للكراسات والحلول الورقية</p>
                </div>
                <div className="text-left font-mono">
                  <div className="text-sm font-extrabold text-slate-800">{voucher.voucherNumber}</div>
                  <div className="text-2xs text-slate-500 font-medium">{formatCairoDate(voucher.voucherDate)}</div>
                </div>
              </div>

              {/* شبكة كروت بيانات الإذن المتناسقة (3 كروت في كل صف) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* 1. التاريخ والوقت */}
                <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all">
                  <span className="text-2xs text-slate-400 font-bold flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    تاريخ ووقت الحركة:
                  </span>
                  <span className="font-extrabold text-slate-800 block">
                    {formatCairoDateTime(voucher.occurredAtUtc)}
                  </span>
                </div>

                {/* 2. المصدر أو الجهة */}
                <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all">
                  <span className="text-2xs text-slate-400 font-bold flex items-center gap-1.5 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    {isInbound ? "المصدر / المورّد:" : "الجهة المنصرف إليها:"}
                  </span>
                  <span className="font-extrabold text-slate-800 block truncate" title={isProduction ? "صالة الإنتاج والتجليد" : voucher.partyName || "جهة خارجية"}>
                    {isProduction ? "صالة الإنتاج والتجليد" : voucher.partyName || "جهة خارجية"}
                  </span>
                </div>

                {/* 3. حالة الإذن */}
                <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all">
                  <span className="text-2xs text-slate-400 font-bold flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                    حالة السند:
                  </span>
                  <span className={`font-extrabold inline-flex items-center gap-1 ${isCancelled ? "text-rose-600" : "text-emerald-700"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isCancelled ? "bg-rose-500" : "bg-emerald-500"}`} />
                    {isCancelled ? "ملغي ومبطل" : "فعّال وموثق بالمخزن"}
                  </span>
                </div>

                {/* 4. المستلم */}
                <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all">
                  <span className="text-2xs text-slate-400 font-bold flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    {isInbound ? "المستلم (أمين المخزن):" : "المستلم:"}
                  </span>
                  <span className="font-extrabold text-slate-800 block truncate">
                    {voucher.receiverName || "—"}
                  </span>
                </div>

                {/* 5. المُسلِّم */}
                <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all">
                  <span className="text-2xs text-slate-400 font-bold flex items-center gap-1.5 mb-1">
                    <Truck className="w-3.5 h-3.5 text-slate-500" />
                    {isProduction ? "المُسلِّم (الإنتاج):" : "المُسلِّم / الناقل:"}
                  </span>
                  <span className="font-extrabold text-slate-800 block truncate">
                    {voucher.delivererName || "—"}
                  </span>
                </div>

                {/* 6. المنشئ */}
                <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all">
                  <span className="text-2xs text-slate-400 font-bold flex items-center gap-1.5 mb-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    أنشئ بواسطة:
                  </span>
                  <span className="font-extrabold text-slate-800 block truncate">
                    {voucher.createdByName || "Ayman Salama"}
                  </span>
                </div>
              </div>

              {/* جدول الأصناف والكميات */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-800">الأصناف والبنود المشمولة بالسند:</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3">اسم الصنف أو المنتج التام</th>
                        <th className="py-2.5 px-3 text-center">الكمية المقيدة بالإذن</th>
                        <th className="py-2.5 px-3 text-center">المحتوى الفعلي بالمستودع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(voucher.items || []).map((it, idx) => {
                        const isCarton = it.unitLabel === "كرتونة";
                        const isReam = it.unitLabel === "رزمة";

                        let actualContentText = `${Number(it.quantitySubUnits).toLocaleString()} ${it.unitLabel}`;
                        if (isCarton) {
                          actualContentText = `${Number(it.quantitySubUnits).toLocaleString()} رزمة`;
                        } else if (isReam) {
                          const boxes = Math.floor(Number(it.quantity) / 5);
                          const rest = Number(it.quantity) % 5;
                          if (boxes > 0 && rest > 0) {
                            actualContentText = `${boxes.toLocaleString()} كرتونة و ${rest} رزمة`;
                          } else if (boxes > 0) {
                            actualContentText = `${boxes.toLocaleString()} كرتونة`;
                          } else {
                            actualContentText = `${Number(it.quantity).toLocaleString()} رزمة`;
                          }
                        } else {
                          actualContentText = `${Number(it.quantitySubUnits).toLocaleString()} قطعة`;
                        }

                        return (
                          <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3 text-slate-400 font-mono text-center font-bold">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{it.productName}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="inline-block px-2.5 py-1 bg-slate-100 rounded-lg text-slate-900 font-extrabold border border-slate-200/60">
                                {Number(it.quantity).toLocaleString()} {it.unitLabel}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-extrabold rounded-lg">
                                {actualContentText}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* الملاحظات */}
              {voucher.notes && (
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-slate-600 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    ملاحظات وبيان إضافي:
                  </span>
                  <p className="text-slate-800 whitespace-pre-wrap font-medium pr-5">{voucher.notes}</p>
                </div>
              )}

              {/* مساحة التوقيعات الرسمية للطباعة والمراجعة */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs font-bold text-slate-600 mt-4">
                <div>
                  <p className="mb-8">توقيع المستلم (أمين المستودع)</p>
                  <p className="border-b border-dashed border-slate-300 w-28 mx-auto"></p>
                </div>
                <div>
                  <p className="mb-8">{isInbound ? "توقيع المسلِّم / المورّد" : "توقيع جهة الاستلام"}</p>
                  <p className="border-b border-dashed border-slate-300 w-28 mx-auto"></p>
                </div>
                <div>
                  <p className="mb-8">مراجع الحسابات / الإدارة</p>
                  <p className="border-b border-dashed border-slate-300 w-28 mx-auto"></p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer (Hidden when printing) */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            {/* زر إلغاء الإذن: يظهر فقط إذا كان الإذن فعالاً */}
            {!isCancelled && voucher && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCancel(voucher);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                إلغاء هذا الإذن
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || !voucher || printing}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200/90 rounded-xl hover:bg-slate-50 shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {printing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>جاري إعداد السند...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>طباعة الإذن</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-200/80 hover:bg-slate-200 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoucherDetailsModal;
