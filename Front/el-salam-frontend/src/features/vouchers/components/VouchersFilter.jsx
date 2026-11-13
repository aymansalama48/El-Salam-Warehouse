import { Search, Filter, X } from "lucide-react";
import { VOUCHER_TYPE, VOUCHER_SOURCE, VOUCHER_STATUS } from "../schemas/voucherSchema";

export function VouchersFilter({
  searchTerm,
  setSearchTerm,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  source,
  setSource,
  status,
  setStatus,
  type = VOUCHER_TYPE.INBOUND,
  onReset,
}) {
  const isInbound = type === VOUCHER_TYPE.INBOUND;
  const isReturn = type === VOUCHER_TYPE.RETURN;

  const hasActiveFilters = Boolean(
    searchTerm ||
    fromDate ||
    toDate ||
    (source && source !== "all") ||
    (status && status !== "all")
  );

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-2xs space-y-3 text-right">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* حقل البحث العام */}
        <div className={`relative ${isInbound ? "lg:col-span-4" : "lg:col-span-5"}`}>
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              isReturn
                ? "بحث برقم الإذن، المستلم، المندوب، سبب المرتجع أو الصنف..."
                : "بحث برقم الإذن، المستلم، الجايب، الجهة أو الصنف..."
            }
            className="w-full pr-10 pl-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 font-medium"
          />
        </div>

        {/* تاريخ من */}
        <div className="lg:col-span-2">
          <div className="relative">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 font-medium text-slate-700"
              title="تاريخ من"
            />
          </div>
        </div>

        {/* تاريخ إلى */}
        <div className="lg:col-span-2">
          <div className="relative">
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 font-medium text-slate-700"
              title="تاريخ إلى"
            />
          </div>
        </div>

        {/* فلتر المصدر (للوارد فقط) */}
        {isInbound && (
          <div className="lg:col-span-2">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 font-bold text-slate-700 cursor-pointer"
            >
              <option value="all">كل المصادر</option>
              <option value={VOUCHER_SOURCE.PRODUCTION}>صالة الإنتاج</option>
              <option value={VOUCHER_SOURCE.EXTERNAL}>جهة خارجية / مورد</option>
            </select>
          </div>
        )}

        {/* فلتر الحالة */}
        <div className="lg:col-span-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">كل الحالات</option>
            <option value={VOUCHER_STATUS.ACTIVE}>فعّال فقط</option>
            <option value={VOUCHER_STATUS.CANCELLED}>ملغي فقط</option>
          </select>
        </div>
      </div>

      {/* شريط إعادة التعيين */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            فلاتر البحث نشطة
          </span>
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            إعادة تعيين الفلاتر
          </button>
        </div>
      )}
    </div>
  );
}

export default VouchersFilter;
