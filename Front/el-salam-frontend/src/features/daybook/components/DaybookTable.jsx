import { useState, useMemo } from "react";
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
  ChevronDown,
  Eye,
  FileText
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
  const [expandedVoucherIds, setExpandedVoucherIds] = useState(new Set());

  const toggleExpand = (id, e) => {
    e.stopPropagation();
    setExpandedVoucherIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // تجميع السطور بحسب الإذن ليظهر كل إذن في سطر واحد مستقل
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
          items: [],
        });
      }
      map.get(vId).items.push(item);
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
              <th className="py-3 px-2 w-8 text-center"></th>
              <th className="py-3 px-3.5 whitespace-nowrap">التاريخ والوقت</th>
              <th className="py-3 px-3.5 whitespace-nowrap">رقم الإذن</th>
              <th className="py-3 px-3.5 whitespace-nowrap">نوع الحركة</th>
              <th className="py-3 px-3.5 whitespace-nowrap">بيان الأصناف والبنود</th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap">إجمالي الكميات</th>
              <th className="py-3 px-3.5 whitespace-nowrap">الجهة / المستلم</th>
              <th className="py-3 px-3.5 whitespace-nowrap">الحالة</th>
              <th className="py-3 px-3 text-center whitespace-nowrap">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groupedVouchers.map((voucher) => {
              const isInbound = voucher.type === VOUCHER_TYPE.INBOUND;
              const isReturn = voucher.type === VOUCHER_TYPE.RETURN;
              const isShortage = voucher.type === VOUCHER_TYPE.SHORTAGE;
              const isCancelled = voucher.status === VOUCHER_STATUS.CANCELLED;
              const isExpanded = expandedVoucherIds.has(voucher.voucherId);

              const rowClass = isCancelled
                ? "bg-slate-50/80 text-slate-400 opacity-60 hover:bg-slate-100/60"
                : isShortage
                ? "hover:bg-purple-50/30 text-slate-800"
                : isReturn
                ? "hover:bg-amber-50/30 text-slate-800"
                : isInbound
                ? "hover:bg-emerald-50/30 text-slate-800"
                : "hover:bg-rose-50/30 text-slate-800";

              // ملخص الكميات بالإذن
              let paperCartons = 0;
              let paperReams = 0;
              let notebookTotal = 0;

              voucher.items.forEach((it) => {
                const isPaper = it.unitType === 3 || it.unitLabel === "كرتونة" || it.unitLabel === "رزمة" || it.categoryName?.includes("ورق");
                if (isPaper) {
                  if (it.unitLabel === "كرتونة") {
                    paperCartons += Number(it.quantity || 0);
                  } else {
                    paperReams += Number(it.quantity || 0);
                  }
                } else {
                  notebookTotal += Number(it.quantity || 0);
                }
              });

              return (
                <tbody key={voucher.voucherId} className="border-b border-slate-100 last:border-b-0">
                  <tr
                    onClick={() => onSelectVoucher && onSelectVoucher(voucher.voucherId)}
                    className={`transition-colors cursor-pointer select-none ${rowClass} ${isExpanded ? "bg-slate-50/90 font-semibold" : ""}`}
                    title="انقر لفتح تفاصيل الإذن والطباعة"
                  >
                    {/* زر التوسيع المنسدل */}
                    <td className="py-3 px-2 text-center" onClick={(e) => toggleExpand(voucher.voucherId, e)}>
                      <button
                        type="button"
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-transform cursor-pointer"
                        title={isExpanded ? "طي الأصناف" : "عرض أصناف الإذن"}
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${isExpanded ? "rotate-180 text-blue-600" : ""}`} />
                      </button>
                    </td>

                    {/* التاريخ والوقت بتوقيت القاهرة */}
                    <td className="py-3 px-3.5 text-xs whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {formatCairoDateTime(voucher.occurredAtUtc || voucher.voucherDate)}
                      </span>
                    </td>

                    {/* رقم الإذن */}
                    <td className="py-3 px-3.5 font-mono font-bold text-xs whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-blue-700 hover:underline">
                        <Hash className="w-3.5 h-3.5 text-blue-500" />
                        {voucher.voucherNumber}
                      </span>
                    </td>

                    {/* نوع الحركة */}
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
                          {voucher.returnDirection === 1 ? " (وارد)" : voucher.returnDirection === 2 ? " (صرف)" : ""}
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

                    {/* بيان الأصناف والبنود */}
                    <td className="py-3 px-3.5 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="text-2xs font-extrabold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                          {voucher.items.length} {voucher.items.length === 1 ? "صنف" : "أصناف"}
                        </span>
                        <span className="text-xs text-slate-700 font-medium truncate max-w-[220px]" title={voucher.items.map((i) => i.productName).join(" • ")}>
                          {voucher.items.map((i) => i.productName).slice(0, 2).join("، ")}
                          {voucher.items.length > 2 ? ` و ${voucher.items.length - 2} آخرين...` : ""}
                        </span>
                      </div>
                    </td>

                    {/* إجمالي الكميات بالحركة */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-0.5 font-bold text-xs">
                        {notebookTotal > 0 && (
                          <span className={`${isInbound ? "text-emerald-700" : "text-rose-700"}`}>
                            {isInbound ? "+" : "-"}{notebookTotal.toLocaleString()} كشكول / كراس
                          </span>
                        )}
                        {paperCartons > 0 && (
                          <span className="text-amber-800 text-2xs font-semibold">
                            {paperCartons.toLocaleString()} كرتونة
                          </span>
                        )}
                        {paperReams > 0 && (
                          <span className="text-purple-800 text-2xs font-semibold">
                            {paperReams.toLocaleString()} رزمة
                          </span>
                        )}
                      </div>
                    </td>

                    {/* الجهة والمستلم */}
                    <td className="py-3 px-3.5 text-xs text-slate-600 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {voucher.partyName || (voucher.source === 2 ? "صالة الإنتاج" : "جهة خارجية")}
                        </span>
                        {voucher.receiverName && (
                          <span className="text-2xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3 text-slate-400" />
                            المستلم: {voucher.receiverName}
                          </span>
                        )}
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

                    {/* زر الاستعراض والطباعة */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectVoucher) onSelectVoucher(voucher.voucherId);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors cursor-pointer"
                        title="عرض تفاصيل الإذن والطباعة"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>تفاصيل</span>
                      </button>
                    </td>
                  </tr>

                  {/* سطر التفاصيل المنسدلة عند التوسيع */}
                  {isExpanded && (
                    <tr className="bg-slate-50/70 border-t border-slate-200/60">
                      <td colSpan={9} className="p-3.5 pr-8">
                        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
                          <div className="p-2.5 bg-slate-100/70 border-b border-slate-200/80 flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <Package className="w-4 h-4 text-emerald-600" />
                              تفاصيل أصناف الإذن ({voucher.items.length} صنف)
                            </span>
                            <button
                              type="button"
                              onClick={() => onSelectVoucher && onSelectVoucher(voucher.voucherId)}
                              className="inline-flex items-center gap-1 text-2xs font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 px-2.5 py-1 rounded border border-blue-200 transition-colors cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              فتح بطاقة الإذن الرسمية والطباعة
                            </button>
                          </div>
                          <table className="w-full text-right text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                              <tr>
                                <th className="py-2 px-3">#</th>
                                <th className="py-2 px-3">اسم الصنف أو المنتج</th>
                                <th className="py-2 px-3">الفئة</th>
                                <th className="py-2 px-3 text-center">الكمية بالحركة</th>
                                <th className="py-2 px-3 text-center">الرصيد بعد الحركة</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {voucher.items.map((it, itemIdx) => {
                                const isAddition = isInbound || (isReturn && voucher.returnDirection === 1);
                                return (
                                  <tr key={itemIdx} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="py-2 px-3 text-slate-400 font-mono">{itemIdx + 1}</td>
                                    <td className="py-2 px-3 font-bold text-slate-900">{it.productName}</td>
                                    <td className="py-2 px-3 text-slate-500 font-medium">{it.categoryName || "عام"}</td>
                                    <td className="py-2 px-3 text-center font-bold">
                                      <span className={isAddition ? "text-emerald-700" : "text-rose-700"}>
                                        {isAddition ? "+" : "-"}{Number(it.quantity).toLocaleString()} {it.unitLabel}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-center text-slate-700 font-bold">
                                      {Number(it.balanceAfterSubUnits || 0).toLocaleString()} {it.unitLabel || "قطعة"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
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
