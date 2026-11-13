import { useState, useEffect, useMemo } from "react";
import { Search, Check, Package, X, Layers, AlertCircle, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { getProductsLookup } from "../../products/services/productService";

/**
 * نافذة الإضافة المتقدمة للأصناف في أذونات المخزن
 * تتيح اختيار وإضافة عدة أصناف بضغطة واحدة مع ظهور علامة صح فورية
 */
export function AdvancedProductPickerModal({
  isOpen,
  onClose,
  selectedProductIds = [],
  onToggleProduct,
  notebooksOnly = false,
  isOutbound = false,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (!isOpen) return;
    let ignore = false;
    setLoading(true);

    getProductsLookup({ notebooksOnly })
      .then((data) => {
        if (!ignore) {
          const list = Array.isArray(data) ? [...data] : [];
          list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
          setProducts(list);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("فشل في تحميل الأصناف للنافذة المتقدمة:", err);
          setProducts([]);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, notebooksOnly]);

  // استخراج قائمة الفئات الفريدة للفلترة
  const categories = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      if (p.categoryName && !map.has(p.categoryName)) {
        map.set(p.categoryName, p.categoryName);
      }
    });
    return Array.from(map.values());
  }, [products]);

  // تصفية الأصناف بالبحث والفئة
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const term = search.trim().toLowerCase();
      const matchSearch =
        !term ||
        p.name?.toLowerCase().includes(term) ||
        p.categoryName?.toLowerCase().includes(term) ||
        p.baseUnit?.toLowerCase().includes(term);

      const matchCategory =
        selectedCategory === "all" || p.categoryName === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [products, search, selectedCategory]);

  if (!isOpen) return null;

  const selectedCount = selectedProductIds.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-emerald-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  الإضافة المتقدمة لأصناف الإذن
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {selectedCount} مضاف
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                اضغط على أي صنف لإضافته مباشرة للإذن، وتظهر علامة صح خضراء لتأكيد إضافته.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/50 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم الصنف أو الفئة أو الوحدة..."
              className="w-full pr-10 pl-9 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all font-medium"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-2xs sm:text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                جميع الفئات ({products.length})
              </button>
              {categories.map((cat) => {
                const count = products.filter((p) => p.categoryName === cat).length;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-emerald-700 text-white shadow-2xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Products List / Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {loading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-xs font-bold">جاري تحميل دليل الأصناف بالترتيب المعتمد...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
              <AlertCircle className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">لم يتم العثور على أي صنف مطابق</p>
              <p className="text-xs text-slate-400">
                جرب تغيير كلمة البحث أو اختيار تصنيف آخر من القائمة.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredProducts.map((p) => {
                const isSelected = selectedProductIds.includes(p.id);
                const actualStock =
                  p.totalSubUnitStock !== undefined ? p.totalSubUnitStock : p.availableInEntryUnit;
                const isZeroStock = isOutbound && actualStock <= 0;
                const isCopyPaper = p.unitType === 3 || p.baseUnit === "كرتونة";

                const fullCartons =
                  isCopyPaper && p.unitsPerBaseUnit > 0
                    ? Math.floor(actualStock / p.unitsPerBaseUnit)
                    : 0;
                const looseReams =
                  isCopyPaper && p.unitsPerBaseUnit > 0
                    ? actualStock % p.unitsPerBaseUnit
                    : 0;

                const stockText = isCopyPaper
                  ? looseReams > 0
                    ? `${fullCartons.toLocaleString()} كرتونة و ${looseReams.toLocaleString()} رزمة`
                    : `${fullCartons.toLocaleString()} كرتونة (${actualStock.toLocaleString()} رزمة)`
                  : `${actualStock.toLocaleString()} ${p.entryUnitLabel || "قطعة"}`;

                return (
                  <div
                    key={p.id}
                    onClick={() => !isZeroStock && onToggleProduct(p)}
                    className={`relative p-3.5 rounded-xl border text-right transition-all select-none ${
                      isZeroStock
                        ? "opacity-50 bg-slate-50 border-slate-200 cursor-not-allowed"
                        : isSelected
                        ? "bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs cursor-pointer hover:bg-emerald-50"
                        : "bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300 shadow-2xs cursor-pointer"
                    }`}
                  >
                    {/* Header: Name & Check indicator */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                          {p.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/60 truncate">
                            {p.categoryName || "عام"}
                          </span>
                          <span className="text-2xs text-slate-400 font-medium">
                            {p.entryUnitLabel}
                          </span>
                        </div>
                      </div>

                      {/* Checkmark Button / State */}
                      <div className="shrink-0 mt-0.5">
                        {isSelected ? (
                          <div
                            className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-150"
                            title="تمت الإضافة للإذن (اضغط للإلغاء)"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        ) : (
                          <div
                            className="w-7 h-7 rounded-lg border-2 border-slate-300 bg-white hover:border-emerald-500 hover:bg-emerald-50 text-slate-300 hover:text-emerald-600 flex items-center justify-center transition-all"
                            title="اضغط لإضافة هذا الصنف"
                          >
                            <Check className="w-3.5 h-3.5 opacity-0 hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stock & Unit Info */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center justify-between text-2xs font-semibold">
                      <div className="flex items-center gap-1 text-slate-500">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>الرصيد:</span>
                      </div>
                      <span
                        className={`truncate ${
                          isZeroStock
                            ? "text-rose-600 font-bold"
                            : actualStock <= 10
                            ? "text-amber-600 font-bold"
                            : "text-emerald-700 font-bold"
                        }`}
                      >
                        {isZeroStock ? "غير متاح للصرف (0)" : stockText}
                      </span>
                    </div>

                    {/* Status badge when selected */}
                    {isSelected && (
                      <div className="mt-2 flex items-center gap-1 text-2xs font-bold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>تمت الإضافة للإذن بنجاح</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-emerald-600" />
            <span>تم إضافة {selectedCount} صنف في الإذن</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            إتمام والعودة للإذن
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdvancedProductPickerModal;

