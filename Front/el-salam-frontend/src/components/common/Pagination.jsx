import React from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

export function Pagination({
  page = 1,
  totalPages = 1,
  totalCount = 0,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemLabel = "عنصر",
}) {
  const numericPageSize = pageSize === "all" ? 0 : Number(pageSize) || 20;
  const computedTotalPages =
    numericPageSize > 0 && totalCount > 0
      ? Math.max(1, Math.ceil(totalCount / numericPageSize))
      : 1;
  const effectiveTotalPages = Math.max(Number(totalPages) || 1, computedTotalPages);

  if (totalCount === 0 && effectiveTotalPages <= 1) return null;

  // توليد أرقام الصفحات المعروضة بشكل ذكي
  const getPageNumbers = () => {
    if (effectiveTotalPages <= 7) {
      return Array.from({ length: effectiveTotalPages }, (_, i) => i + 1);
    }

    const pages = [];
    if (page <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push("...");
      pages.push(effectiveTotalPages);
    } else if (page >= effectiveTotalPages - 3) {
      pages.push(1);
      pages.push("...");
      for (let i = effectiveTotalPages - 4; i <= effectiveTotalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      pages.push(page - 1);
      pages.push(page);
      pages.push(page + 1);
      pages.push("...");
      pages.push(effectiveTotalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-slate-500">
      {/* اليمين: ملخص العدد واختيار عدد العناصر بكل صفحة */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          إجمالي <span className="font-extrabold text-slate-900">{totalCount.toLocaleString()}</span> {itemLabel}
          <span className="text-slate-400 mx-1.5">•</span>
          صفحة <span className="font-bold text-slate-800">{page}</span> من <span className="font-bold text-slate-800">{effectiveTotalPages}</span>
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-2xs text-slate-600 bg-white border border-slate-200/80 rounded-lg px-2 py-1">
            <span>عرض:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={String(opt)} value={opt}>
                  {opt === "all" ? "الكل" : opt}
                </option>
              ))}
            </select>
            <span>بكل صفحة</span>
          </div>
        )}
      </div>

      {/* اليسار: أزرار التنقل بين الصفحات */}
      <div className="flex items-center gap-1">
        {/* زر السابق */}
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange && onPageChange(page - 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-xs font-semibold"
          title="الصفحة السابقة"
        >
          <ChevronRight className="w-3.5 h-3.5" />
          <span>السابق</span>
        </button>

        {/* أرقام الصفحات */}
        <div className="flex items-center gap-1 mx-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`dots-${idx}`} className="px-1 text-slate-400 select-none">
                  ...
                </span>
              );
            }

            const isActive = p === page;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange && onPageChange(p)}
                className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs scale-105"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* زر التالي */}
        <button
          type="button"
          disabled={page >= effectiveTotalPages}
          onClick={() => onPageChange && onPageChange(page + 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-xs font-semibold"
          title="الصفحة التالية"
        >
          <span>التالي</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
