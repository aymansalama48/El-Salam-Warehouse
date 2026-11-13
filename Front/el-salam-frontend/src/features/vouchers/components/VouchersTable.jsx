import { Eye, AlertTriangle, Hash, Calendar, Building2, User, Truck, Package, ChevronRight, ChevronLeft } from "lucide-react";
import { formatCairoDateTime } from "../../../utils/dateUtils";
import { VOUCHER_TYPE, VOUCHER_SOURCE, VOUCHER_STATUS } from "../schemas/voucherSchema";

export function VouchersTable({
  vouchers = [],
  loading,
  type = VOUCHER_TYPE.INBOUND,
  onView,
  onCancel,
  page = 1,
  totalCount = 0,
  totalPages = 1,
  onPageChange,
}) {
  const isInbound = type === VOUCHER_TYPE.INBOUND;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/70 p-12 text-center animate-pulse">
        <div className="h-6 w-1/3 bg-slate-200 rounded mx-auto mb-4"></div>
        <div className="h-4 w-1/2 bg-slate-100 rounded mx-auto"></div>
      </div>
    );
  }

  if (vouchers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Hash className="w-7 h-7" />
        </div>
        <p className="text-slate-800 font-bold text-base mb-1">
          {isInbound ? "لا توجد أذونات وارد مسجلة" : "لا توجد أذونات صرف مسجلة"}
        </p>
        <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
          {isInbound
            ? "لم يتم العثور على أي أذونات وارد مطابقة للفلاتر. يمكنك تسجيل إذن استلام إنتاج أو وارد جديد."
            : "لم يتم العثور على أي أذونات صرف مطابقة للفلاتر. يمكنك تسجيل إذن صرف طلبيات جديد."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/70 shadow-2xs overflow-hidden text-right">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50/70 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 whitespace-nowrap">رقم الإذن</th>
              <th className="py-3 px-4 whitespace-nowrap">التاريخ والوقت (توقيت القاهرة)</th>
              <th className="py-3 px-4 whitespace-nowrap">
                {isInbound ? "المصدر / المورّد" : "الجهة المنصرف إليها"}
              </th>
              <th className="py-3 px-4 whitespace-nowrap">
                {isInbound ? "المستلم (أمين المخزن)" : "المستلم"}
              </th>
              {isInbound && <th className="py-3 px-4 whitespace-nowrap">المُسلِّم</th>}
              <th className="py-3 px-4 text-center whitespace-nowrap">عدد الأصناف</th>
              <th className="py-3 px-4 whitespace-nowrap">الحالة</th>
              <th className="py-3 px-4 text-center whitespace-nowrap">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vouchers.map((item) => {
              const isCancelled = item.status === VOUCHER_STATUS.CANCELLED;
              const isProduction = item.source === VOUCHER_SOURCE.PRODUCTION;

              return (
                <tr
                  key={item.id}
                  className={`transition-colors ${
                    isCancelled
                      ? "opacity-55 bg-slate-50/60 hover:bg-slate-100/50"
                      : "hover:bg-slate-50/70"
                  }`}
                >
                  {/* رقم الإذن */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      {item.voucherNumber || item.id}
                    </span>
                  </td>

                  {/* التاريخ والوقت بتوقيت القاهرة */}
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {formatCairoDateTime(item.occurredAtUtc || item.voucherDate)}
                    </span>
                  </td>

                  {/* المصدر / المورد / الجهة */}
                  <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {isInbound
                        ? isProduction
                          ? "صالة الإنتاج والتجليد"
                          : item.partyName || "جهة خارجية"
                        : item.partyName || "جهة استلام"}
                    </span>
                  </td>

                  {/* المستلم */}
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {item.receiverName}
                    </span>
                  </td>

                  {/* المسلم (الجايب) - في الوارد فقط */}
                  {isInbound && (
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                      {item.delivererName ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {item.delivererName}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  )}

                  {/* عدد الأصناف */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                      <Package className="w-3.5 h-3.5 text-slate-500" />
                      {item.itemsCount ?? 1} صنف
                    </span>
                  </td>

                  {/* الحالة */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {isCancelled ? (
                      <span className="px-2.5 py-1 text-xs font-extrabold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        ملغي
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        فعّال
                      </span>
                    )}
                  </td>

                  {/* الإجراءات */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {onView && (
                        <button
                          type="button"
                          onClick={() => onView(item)}
                          title="عرض تفاصيل الإذن والطباعة"
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {!isCancelled && onCancel && (
                        <button
                          type="button"
                          onClick={() => onCancel(item)}
                          title="إلغاء الإذن وعكس الرصيد"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200/80 flex items-center justify-between text-xs font-medium text-slate-500">
          <div>
            إجمالي <span className="font-bold text-slate-800">{totalCount}</span> إذن (صفحة {page} من {totalPages})
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange && onPageChange(page - 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-slate-800">{page}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange && onPageChange(page + 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VouchersTable;
