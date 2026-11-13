import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  RotateCcw,
  AlertTriangle,
  Calendar, 
  Hash, 
  Package, 
  Building2, 
  User, 
  Layers, 
  ChevronRight, 
  ChevronLeft 
} from "lucide-react";
import { formatCairoDateTime } from "../../../utils/dateUtils";
import { VOUCHER_TYPE, VOUCHER_STATUS } from "../../vouchers/schemas/voucherSchema";

export function DaybookTable({
  entries = [],
  loading,
  onSelectVoucher,
  page = 1,
  totalCount = 0,
  totalPages = 1,
  onPageChange,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/70 p-12 text-center animate-pulse">
        <div className="h-6 w-1/3 bg-slate-200 rounded mx-auto mb-4"></div>
        <div className="h-4 w-1/2 bg-slate-100 rounded mx-auto"></div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Layers className="w-7 h-7" />
        </div>
        <p className="text-slate-800 font-bold text-base mb-1">لا توجد حركات مسجلة بدفتر اليومية</p>
        <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
          لم يتم العثور على أي حركات وارد أو صرف مطابقة للفلاتر المحددة.
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
              <th className="py-3 px-3.5 whitespace-nowrap">التاريخ والوقت</th>
              <th className="py-3 px-3.5 whitespace-nowrap">رقم الإذن</th>
              <th className="py-3 px-3.5 whitespace-nowrap">نوع الحركة</th>
              <th className="py-3 px-3.5 whitespace-nowrap">اسم الصنف أو المنتج</th>
              <th className="py-3 px-3.5 whitespace-nowrap">الفئة</th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap">الكمية بالحركة</th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap">الرصيد بعد الحركة</th>
              <th className="py-3 px-3.5 whitespace-nowrap">الجهة / المستلم</th>
              <th className="py-3 px-3.5 whitespace-nowrap">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((item, idx) => {
              const isInbound = item.type === VOUCHER_TYPE.INBOUND;
              const isReturn = item.type === VOUCHER_TYPE.RETURN;
              const isShortage = item.type === VOUCHER_TYPE.SHORTAGE;
              const isCancelled = item.status === VOUCHER_STATUS.CANCELLED;

              // كل سطر: وارد أخضر، صرف أحمر، مرتجع برتقالي، عجز بنفسجي، ملغي رمادي باهت
              const rowClass = isCancelled
                ? "bg-slate-50/80 text-slate-400 opacity-60 hover:bg-slate-100/60"
                : isShortage
                ? "hover:bg-purple-50/30 text-slate-800"
                : isReturn
                ? "hover:bg-amber-50/30 text-slate-800"
                : isInbound
                ? "hover:bg-emerald-50/30 text-slate-800"
                : "hover:bg-rose-50/30 text-slate-800";

              return (
                <tr
                  key={idx}
                  onClick={() => onSelectVoucher && onSelectVoucher(item.voucherId)}
                  className={`transition-colors cursor-pointer select-none ${rowClass}`}
                  title="انقر لفتح تفاصيل الإذن والطباعة"
                >
                  {/* التاريخ والوقت بتوقيت القاهرة */}
                  <td className="py-3 px-3.5 text-xs whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {formatCairoDateTime(item.occurredAtUtc || item.voucherDate)}
                    </span>
                  </td>

                  {/* رقم الإذن */}
                  <td className="py-3 px-3.5 font-mono font-bold text-xs whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-blue-700 hover:underline">
                      <Hash className="w-3.5 h-3.5 text-blue-500" />
                      {item.voucherNumber}
                    </span>
                  </td>

                  {/* نوع الحركة: وارد أخضر | صرف أحمر | مرتجع برتقالي | عجز بنفسجي | ملغي رمادي */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    {isCancelled ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-extrabold bg-slate-200 text-slate-600">
                        ملغي
                      </span>
                    ) : isShortage ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                        <AlertTriangle className="w-3 h-3" />
                        عجز
                      </span>
                    ) : isReturn ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                        <RotateCcw className="w-3 h-3" />
                        مرتجع
                        {item.returnDirection === 1 ? " (وارد)" : item.returnDirection === 2 ? " (صرف)" : ""}
                      </span>
                    ) : isInbound ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <ArrowDownToLine className="w-3 h-3" />
                        وارد
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                        <ArrowUpFromLine className="w-3 h-3" />
                        صرف
                      </span>
                    )}
                  </td>

                  {/* اسم الصنف */}
                  <td className="py-3 px-3.5 font-bold min-w-[180px]">
                    <span className="inline-flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {item.productName}
                    </span>
                  </td>

                  {/* الفئة */}
                  <td className="py-3 px-3.5 text-xs font-semibold text-slate-500 whitespace-nowrap">
                    {item.categoryName || "عام"}
                  </td>

                  {/* الكمية بالحركة */}
                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                    {(() => {
                      const isCopyPaper =
                        item.unitType === 3 ||
                        item.unitLabel === "كرتونة" ||
                        item.unitLabel === "رزمة" ||
                        item.categoryName?.includes("ورق") ||
                        item.productName?.includes("ورق");

                      const unitsPer = item.unitsPerBaseUnit || (isCopyPaper ? 5 : 1);
                      const qty = Number(item.quantity || 0);
                      const subQty = Number(item.quantitySubUnits || (qty * unitsPer));

                      let eqText = null;

                      if (isCopyPaper) {
                        if (item.unitLabel === "كرتونة") {
                          eqText = `(${subQty.toLocaleString()} رزمة)`;
                        } else {
                          // إذا تم التسجيل بالرزمة: نحسب المعادل بالكرتونة
                          const cartons = Math.floor(qty / unitsPer);
                          const rem = qty % unitsPer;
                          if (rem > 0) {
                            eqText = `(${cartons.toLocaleString()} كرتونة و ${rem} رزمة)`;
                          } else {
                            eqText = `(${cartons.toLocaleString()} كرتونة)`;
                          }
                        }
                      } else {
                        // كشاكيل وكراريس
                        if (item.unitLabel === "باكو" || (unitsPer > 1 && item.unitLabel !== "قطعة")) {
                          eqText = `(${subQty.toLocaleString()} قطعة)`;
                        } else if (unitsPer > 1) {
                          const packs = Math.floor(qty / unitsPer);
                          const remPacks = qty % unitsPer;
                          if (packs > 0) {
                            eqText = `(${packs.toLocaleString()} باكو${remPacks > 0 ? ` و ${remPacks} قطعة` : ""})`;
                          }
                        }
                      }

                      const isAddition = isInbound || (isReturn && item.returnDirection === 1);

                      return (
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            className={`text-xs font-extrabold px-2.5 py-0.5 rounded-md ${
                              isCancelled
                                ? "text-slate-500 line-through bg-slate-100"
                                : isShortage
                                ? "text-purple-700 bg-purple-50 border border-purple-200/50"
                                : isReturn
                                ? "text-amber-700 bg-amber-50 border border-amber-200/50"
                                : isInbound
                                ? "text-emerald-700 bg-emerald-50 border border-emerald-200/50"
                                : "text-rose-700 bg-rose-50 border border-rose-200/50"
                            }`}
                          >
                            {isAddition ? "+" : "-"}
                            {qty.toLocaleString()} {item.unitLabel}
                          </span>
                          {eqText && (
                            <span className="text-2xs font-bold text-slate-500">
                              {eqText}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  {/* الرصيد بعد الحركة */}
                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                    {(() => {
                      const isCopyPaper =
                        item.unitType === 3 ||
                        item.unitLabel === "كرتونة" ||
                        item.unitLabel === "رزمة" ||
                        item.categoryName?.includes("ورق") ||
                        item.productName?.includes("ورق");

                      const unitsPer = item.unitsPerBaseUnit || (isCopyPaper ? 5 : 1);
                      const balanceSub = Number(item.balanceAfterSubUnits ?? 0);

                      if (isCopyPaper) {
                        const fullCartons = Math.floor(balanceSub / unitsPer);
                        const remReams = balanceSub % unitsPer;
                        const cartonText = remReams > 0 
                          ? `${fullCartons.toLocaleString()} كرتونة و ${remReams} رزمة`
                          : `${fullCartons.toLocaleString()} كرتونة`;

                        return (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-xs font-bold text-slate-800">
                              {balanceSub.toLocaleString()} رزمة
                            </span>
                            <span className="text-2xs font-extrabold text-blue-700 bg-blue-50/90 px-2 py-0.5 rounded border border-blue-200/50">
                              ({cartonText})
                            </span>
                          </div>
                        );
                      }

                      const fullPacks = unitsPer > 1 ? Math.floor(balanceSub / unitsPer) : 0;
                      const remPieces = unitsPer > 1 ? balanceSub % unitsPer : 0;

                      return (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-xs font-bold text-slate-800">
                            {balanceSub.toLocaleString()} قطعة
                          </span>
                          {fullPacks > 0 && (
                            <span className="text-2xs font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                              ({fullPacks.toLocaleString()} باكو{remPieces > 0 ? ` و ${remPieces} قطعة` : ""})
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  {/* الجهة والمستلم */}
                  <td className="py-3 px-3.5 text-xs text-slate-600 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {item.partyName || (item.source === 2 ? "صالة الإنتاج" : "جهة خارجية")}
                      </span>
                      {isReturn && item.returnReason && (
                        <span className="text-3xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 max-w-[150px] truncate" title={`سبب المرتجع: ${item.returnReason}`}>
                          سبب: {item.returnReason}
                        </span>
                      )}
                      {isShortage && item.shortageReason && (
                        <span className="text-3xs font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded mt-0.5 max-w-[150px] truncate" title={`سبب العجز: ${item.shortageReason}`}>
                          سبب: {item.shortageReason}
                        </span>
                      )}
                      <span className="text-2xs text-slate-400 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        المستلم: {item.receiverName}
                      </span>
                    </div>
                  </td>

                  {/* الحالة */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    {isCancelled ? (
                      <span className="text-2xs font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        ملغي
                      </span>
                    ) : (
                      <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        فعّال
                      </span>
                    )}
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
            إجمالي <span className="font-bold text-slate-800">{totalCount}</span> حركة (صفحة {page} من {totalPages})
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={(e) => {
                e.stopPropagation();
                onPageChange && onPageChange(page - 1);
              }}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-slate-800">{page}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={(e) => {
                e.stopPropagation();
                onPageChange && onPageChange(page + 1);
              }}
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

export default DaybookTable;
