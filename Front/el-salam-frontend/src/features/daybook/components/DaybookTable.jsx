import { useMemo } from "react";
import { 
  Eye, 
  Hash, 
  Calendar, 
  Building2, 
  User, 
  Package, 
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  AlertTriangle
} from "lucide-react";
import { formatCairoDateTime } from "../../../utils/dateUtils";
import { VOUCHER_TYPE, VOUCHER_STATUS, VOUCHER_SOURCE } from "../../vouchers/schemas/voucherSchema";
import { Pagination } from "../../../components/common/Pagination";

export function DaybookTable({
  entries = [],
  loading,
  onSelectVoucher,
  page = 1,
  totalCount = 0,
  totalPages = 1,
  pageSize = 50,
  onPageChange,
  onPageSizeChange,
}) {
  // تجميع السطور بحسب الإذن ليظهر كل إذن في سطر واحد تماماً كجدول الأذونات
  const groupedVouchers = useMemo(() => {
    const map = new Map();
    entries.forEach((item) => {
      const vId = item.voucherId || item.voucherNumber;
      if (!map.has(vId)) {
        map.set(vId, {
          voucherId: item.voucherId,
          voucherNumber: item.voucherNumber,
          type: item.type,
          voucherDate: item.voucherDate,
          occurredAtUtc: item.occurredAtUtc,
          source: item.source,
          partyName: item.partyName,
          receiverName: item.receiverName,
          status: item.status,
          returnDirection: item.returnDirection,
          returnReason: item.returnReason,
          shortageReason: item.shortageReason,
          itemCount: 0,
        });
      }
      map.get(vId).itemCount += 1;
    });
    return Array.from(map.values());
  }, [entries]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/70 p-12 text-center animate-pulse">
        <div className="h-6 w-1/3 bg-slate-200 rounded mx-auto mb-4"></div>
        <div className="h-4 w-1/2 bg-slate-100 rounded mx-auto"></div>
      </div>
    );
  }

  if (groupedVouchers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Layers className="w-7 h-7" />
        </div>
        <p className="text-slate-800 font-bold text-base mb-1">لا توجد أذونات مسجلة بدفتر اليومية</p>
        <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
          لم يتم العثور على أي أذونات وارد أو صرف مطابقة للفلاتر المحددة.
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
              <th className="py-3 px-4 whitespace-nowrap">نوع الحركة</th>
              <th className="py-3 px-4 whitespace-nowrap">الجهة المنصرف إليها / المصدر</th>
              <th className="py-3 px-4 whitespace-nowrap">المستلم</th>
              <th className="py-3 px-4 text-center whitespace-nowrap">عدد الأصناف</th>
              <th className="py-3 px-4 whitespace-nowrap">الحالة</th>
              <th className="py-3 px-4 text-center whitespace-nowrap">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groupedVouchers.map((item) => {
              const isCancelled = item.status === VOUCHER_STATUS.CANCELLED;
              const isShortage = item.type === VOUCHER_TYPE.SHORTAGE;
              const isReturn = item.type === VOUCHER_TYPE.RETURN;
              const isInbound = item.type === VOUCHER_TYPE.INBOUND;
              const isProduction = item.source === VOUCHER_SOURCE.PRODUCTION;

              return (
                <tr
                  key={item.voucherId}
                  onClick={() => onSelectVoucher && onSelectVoucher(item.voucherId)}
                  className={`transition-colors cursor-pointer select-none ${
                    isCancelled
                      ? "opacity-55 bg-slate-50/60 hover:bg-slate-100/50"
                      : "hover:bg-slate-50/70"
                  }`}
                  title="انقر لفتح تفاصيل الإذن والطباعة"
                >
                  {/* رقم الإذن */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.voucherNumber}</span>
                    </span>
                  </td>

                  {/* التاريخ والوقت بتوقيت القاهرة */}
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {formatCairoDateTime(item.occurredAtUtc || item.voucherDate)}
                    </span>
                  </td>

                  {/* نوع الحركة */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {isCancelled ? (
                      <span className="px-2.5 py-1 text-2xs font-extrabold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        ملغي
                      </span>
                    ) : isShortage ? (
                      <span className="px-2.5 py-1 text-2xs font-extrabold rounded-full bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        عجز
                      </span>
                    ) : isReturn ? (
                      <span className="px-2.5 py-1 text-2xs font-extrabold rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" />
                        مرتجع
                      </span>
                    ) : isInbound ? (
                      <span className="px-2.5 py-1 text-2xs font-extrabold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <ArrowDownToLine className="w-3 h-3" />
                        وارد
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-2xs font-extrabold rounded-full bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                        <ArrowUpFromLine className="w-3 h-3" />
                        صرف
                      </span>
                    )}
                  </td>

                  {/* الجهة المنصرف إليها / المصدر */}
                  <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {item.partyName || (isProduction ? "صالة الإنتاج والتجليد" : "—")}
                    </span>
                  </td>

                  {/* المستلم */}
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {item.receiverName || "—"}
                    </span>
                  </td>

                  {/* عدد الأصناف */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                      <Package className="w-3.5 h-3.5 text-slate-500" />
                      {item.itemCount} صنف
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
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectVoucher) onSelectVoucher(item.voucherId);
                        }}
                        title="عرض تفاصيل الإذن والطباعة"
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {Boolean(onPageChange) && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[20, 50, 100, 200]}
          itemLabel="حركة"
        />
      )}
    </div>
  );
}

export default DaybookTable;
