import { useMemo } from "react";
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  RotateCcw,
  AlertTriangle,
  Calendar, 
  Hash, 
  Building2, 
  User, 
  Layers, 
  Eye,
  Package
} from "lucide-react";
import { formatCairoDateTime } from "../../../utils/dateUtils";
import { VOUCHER_TYPE, VOUCHER_STATUS } from "../../vouchers/schemas/voucherSchema";
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
  // تجميع الحركات بحسب الإذن ليظهر كل إذن في سطر واحد فقط بدون تفصيل الأصناف بالجدول
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
          notebookTotal: 0,
          paperCartons: 0,
          paperReams: 0,
        });
      }
      const v = map.get(vId);
      v.itemCount += 1;
      const isPaper = item.unitType === 3 || item.unitLabel === "كرتونة" || item.unitLabel === "رزمة" || item.categoryName?.includes("ورق");
      if (isPaper) {
        if (item.unitLabel === "كرتونة") {
          v.paperCartons += Number(item.quantity || 0);
        } else {
          v.paperReams += Number(item.quantity || 0);
        }
      } else {
        v.notebookTotal += Number(item.quantity || 0);
      }
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
        <table className="w-full text-right text-sm border-collapse">
          <thead className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold text-slate-600">
            <tr>
              <th className="py-3 px-3.5 whitespace-nowrap">رقم الإذن</th>
              <th className="py-3 px-3.5 whitespace-nowrap">التاريخ والوقت</th>
              <th className="py-3 px-3.5 whitespace-nowrap">نوع الحركة</th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap">عدد الأصناف</th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap">إجمالي الكمية</th>
              <th className="py-3 px-3.5 whitespace-nowrap">الجهة / المصدر</th>
              <th className="py-3 px-3.5 whitespace-nowrap">المستلم</th>
              <th className="py-3 px-3.5 whitespace-nowrap">الحالة</th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groupedVouchers.map((voucher) => {
              const isInbound = voucher.type === VOUCHER_TYPE.INBOUND;
              const isReturn = voucher.type === VOUCHER_TYPE.RETURN;
              const isShortage = voucher.type === VOUCHER_TYPE.SHORTAGE;
              const isCancelled = voucher.status === VOUCHER_STATUS.CANCELLED;

              const rowClass = isCancelled
                ? "bg-slate-50/70 text-slate-400 opacity-60 hover:bg-slate-100/50"
                : isShortage
                ? "hover:bg-purple-50/30 text-slate-800"
                : isReturn
                ? "hover:bg-amber-50/30 text-slate-800"
                : isInbound
                ? "hover:bg-emerald-50/30 text-slate-800"
                : "hover:bg-rose-50/30 text-slate-800";

              return (
                <tr
                  key={voucher.voucherId}
                  onClick={() => onSelectVoucher && onSelectVoucher(voucher.voucherId)}
                  className={`transition-colors cursor-pointer select-none ${rowClass}`}
                  title="انقر لفتح بطاقة الإذن وتفاصيله الكاملة"
                >
                  {/* 1. رقم الإذن */}
                  <td className="py-3.5 px-3.5 font-mono font-bold text-xs whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-blue-700 font-extrabold hover:underline">
                      <Hash className="w-3.5 h-3.5 text-blue-500" />
                      {voucher.voucherNumber}
                    </span>
                  </td>

                  {/* 2. التاريخ والوقت بتوقيت القاهرة */}
                  <td className="py-3.5 px-3.5 text-xs whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {formatCairoDateTime(voucher.occurredAtUtc || voucher.voucherDate)}
                    </span>
                  </td>

                  {/* 3. نوع الحركة */}
                  <td className="py-3.5 px-3.5 whitespace-nowrap">
                    {isCancelled ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-2xs font-extrabold bg-slate-200 text-slate-600">
                        ملغي
                      </span>
                    ) : isShortage ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-2xs font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                        <AlertTriangle className="w-3 h-3" />
                        عجز
                      </span>
                    ) : isReturn ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-2xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                        <RotateCcw className="w-3 h-3" />
                        مرتجع
                        {voucher.returnDirection === 1 ? " (وارد)" : voucher.returnDirection === 2 ? " (صرف)" : ""}
                      </span>
                    ) : isInbound ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-2xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <ArrowDownToLine className="w-3 h-3" />
                        وارد
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-2xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                        <ArrowUpFromLine className="w-3 h-3" />
                        صرف
                      </span>
                    )}
                  </td>

                  {/* 4. عدد الأصناف */}
                  <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                      <Package className="w-3.5 h-3.5 text-slate-500" />
                      {voucher.itemCount} {voucher.itemCount === 1 ? "صنف" : "أصناف"}
                    </span>
                  </td>

                  {/* 5. إجمالي الكمية بالحركة */}
                  <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                    <div className="flex flex-col items-center gap-0.5 font-bold text-xs">
                      {voucher.notebookTotal > 0 && (
                        <span className={isInbound ? "text-emerald-700" : "text-rose-700"}>
                          {isInbound ? "+" : "-"}{voucher.notebookTotal.toLocaleString()} كشكول / كراس
                        </span>
                      )}
                      {voucher.paperCartons > 0 && (
                        <span className="text-amber-800 text-2xs font-semibold">
                          {voucher.paperCartons.toLocaleString()} كرتونة
                        </span>
                      )}
                      {voucher.paperReams > 0 && (
                        <span className="text-purple-800 text-2xs font-semibold">
                          {voucher.paperReams.toLocaleString()} رزمة
                        </span>
                      )}
                      {voucher.notebookTotal === 0 && voucher.paperCartons === 0 && voucher.paperReams === 0 && (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </div>
                  </td>

                  {/* 6. الجهة / المصدر */}
                  <td className="py-3.5 px-3.5 text-xs text-slate-700 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{voucher.partyName || (voucher.source === 2 ? "صالة الإنتاج" : "جهة خارجية")}</span>
                    </div>
                  </td>

                  {/* 7. المستلم */}
                  <td className="py-3.5 px-3.5 text-xs text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{voucher.receiverName || "-"}</span>
                    </div>
                  </td>

                  {/* 8. الحالة */}
                  <td className="py-3.5 px-3.5 whitespace-nowrap">
                    {isCancelled ? (
                      <span className="text-2xs font-extrabold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                        ملغي
                      </span>
                    ) : (
                      <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                        فعّال
                      </span>
                    )}
                  </td>

                  {/* 9. الإجراءات */}
                  <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectVoucher) onSelectVoucher(voucher.voucherId);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>تفاصيل الإذن</span>
                    </button>
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
