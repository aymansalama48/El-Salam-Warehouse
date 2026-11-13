import { Search, Filter, X } from "lucide-react";
import { VOUCHER_TYPE, VOUCHER_STATUS } from "../../vouchers/schemas/voucherSchema";

export function DaybookFilter({
  searchTerm,
  setSearchTerm,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  type,
  setType,
  categoryId,
  setCategoryId,
  productId,
  setProductId,
  status,
  setStatus,
  categories = [],
  products = [],
  onReset,
}) {
  const hasActiveFilters = Boolean(
    searchTerm ||
    fromDate ||
    toDate ||
    (type && type !== "all") ||
    (categoryId && categoryId !== "all") ||
    (productId && productId !== "all") ||
    (status && status !== "all")
  );

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-2xs space-y-3 text-right">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* بحث عام */}
        <div className="lg:col-span-3 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالرقم، الصنف، المستلم، الجهة..."
            className="w-full pr-10 pl-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 font-medium"
          />
        </div>

        {/* تاريخ من */}
        <div className="lg:col-span-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 font-medium text-slate-700"
            title="تاريخ من"
          />
        </div>

        {/* تاريخ إلى */}
        <div className="lg:col-span-2">
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 font-medium text-slate-700"
            title="تاريخ إلى"
          />
        </div>

        {/* نوع الحركة (وارد / صرف / مرتجع) */}
        <div className="lg:col-span-1">
          <select
            value={type}
            onChange={(e) => setType(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="w-full px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">الكل</option>
            <option value={VOUCHER_TYPE.INBOUND}>وارد</option>
            <option value={VOUCHER_TYPE.OUTBOUND}>صرف</option>
            <option value={VOUCHER_TYPE.RETURN}>مرتجع</option>
            <option value={VOUCHER_TYPE.SHORTAGE}>عجز</option>
          </select>
        </div>

        {/* الفئة */}
        <div className="lg:col-span-2">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">كل الفئات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* الصنف */}
        <div className="lg:col-span-1">
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">الأصناف</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* الحالة */}
        <div className="lg:col-span-1">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="w-full px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">الحالة</option>
            <option value={VOUCHER_STATUS.ACTIVE}>فعال</option>
            <option value={VOUCHER_STATUS.CANCELLED}>ملغي</option>
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            فلاتر دفتر اليومية نشطة
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

export default DaybookFilter;
