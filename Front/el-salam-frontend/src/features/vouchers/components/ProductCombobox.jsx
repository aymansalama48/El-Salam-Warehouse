import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Check, Loader2, AlertCircle, X } from "lucide-react";
import { getProductsLookup } from "../../products/services/productService";

export function ProductCombobox({
  selectedProduct = null,
  onSelect,
  notebooksOnly = false,
  isOutbound = false,
  disabledProductIds = [],
  placeholder = "اختر الصنف من القائمة...",
  disabled = false,
  error = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);
  const reqIdRef = useRef(0);

  // Debounce للبحث 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // جلب الأصناف من GET /api/products/lookup
  // يتم الجلب تلقائياً عند فتح القائمة وعند تغير debouncedSearch أو notebooksOnly
  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;
    const currentReqId = ++reqIdRef.current;

    getProductsLookup({
      search: debouncedSearch,
      notebooksOnly,
    })
      .then((data) => {
        if (!ignore && currentReqId === reqIdRef.current) {
          const list = Array.isArray(data) ? [...data] : [];
          if (!debouncedSearch.trim()) {
            list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
          }
          setOptions(list);
          setActiveIndex(0);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore && currentReqId === reqIdRef.current) {
          console.error("فشل في جلب الأصناف من /api/products/lookup:", err);
          setOptions([]);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [debouncedSearch, isOpen, notebooksOnly]);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // التمرير التلقائي للعنصر النشط في القائمة
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.children[activeIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex, isOpen]);

  // فتح / إغلاق القائمة
  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setSearch("");
        setDebouncedSearch("");
        setLoading(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
      return next;
    });
  };

  // عند الكتابة في خانة البحث
  const handleSearchChange = (val) => {
    setSearch(val);
    setLoading(true);
  };

  // التعامل مع اختيار صنف
  const handleSelect = (product) => {
    if (!product) return;
    const isAlreadyChosen = disabledProductIds.includes(product.id) && product.id !== selectedProduct?.id;
    const isZeroStock = isOutbound && ((product.totalSubUnitStock !== undefined ? product.totalSubUnitStock : product.availableInEntryUnit) <= 0);
    if (isAlreadyChosen || isZeroStock) return;

    onSelect(product);
    setIsOpen(false);
    setSearch("");
  };

  // التنقل بالكيبورد (أسهم + Enter + Esc)
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        handleToggle();
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (options[activeIndex]) {
        handleSelect(options[activeIndex]);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full text-right" onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full px-3 py-2 text-xs sm:text-sm bg-white border rounded-lg flex items-center justify-between gap-2 transition-all cursor-pointer font-bold ${
          error
            ? "border-rose-400 bg-rose-50/20 text-rose-800"
            : isOpen
            ? "border-slate-800 ring-2 ring-slate-800/10 shadow-xs"
            : "border-slate-200 hover:border-slate-300 text-slate-800"
        } ${disabled ? "bg-slate-100 opacity-60 cursor-not-allowed" : ""}`}
      >
        <div className="flex items-center gap-2 overflow-hidden truncate">
          {selectedProduct ? (
            <>
              <span className="truncate">{selectedProduct.name}</span>
              <span className="shrink-0 text-2xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                {selectedProduct.entryUnitLabel}
              </span>
            </>
          ) : (
            <span className="text-slate-400 font-medium">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-slate-700" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* خانة البحث في أول القائمة المنسدلة */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="ابحث بالاسم..."
                className="w-full pr-8 pl-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute left-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* قائمة الخيارات */}
          <div ref={listRef} className="max-h-56 overflow-y-auto divide-y divide-slate-50 p-1">
            {loading ? (
              <div className="py-6 px-4 text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                <span>جاري البحث...</span>
              </div>
            ) : options.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-slate-400 font-medium flex flex-col items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-slate-300" />
                <span>
                  {search
                    ? "لا توجد أصناف مطابقة"
                    : notebooksOnly
                    ? "لا توجد أصناف متاحة من صالة الإنتاج"
                    : "لا توجد أصناف متاحة"}
                </span>
              </div>
            ) : (
              options.map((p, idx) => {
                const isSelected = selectedProduct?.id === p.id;
                const isAlreadyChosen = disabledProductIds.includes(p.id) && !isSelected;
                const actualStock = p.totalSubUnitStock !== undefined ? p.totalSubUnitStock : p.availableInEntryUnit;
                const isZeroStock = isOutbound && actualStock <= 0;
                const isDisabled = isAlreadyChosen || isZeroStock;
                const isHighlighted = idx === activeIndex;

                const isCopyPaper = p.unitType === 3 || p.baseUnit === "كرتونة";
                const fullCartons = p.unitsPerBaseUnit > 0 ? Math.floor(actualStock / p.unitsPerBaseUnit) : 0;
                const looseReams = p.unitsPerBaseUnit > 0 ? actualStock % p.unitsPerBaseUnit : 0;
                const copyPaperStockText = looseReams > 0
                  ? `المتاح: ${fullCartons.toLocaleString()} كرتونة و ${looseReams.toLocaleString()} رزمة (${actualStock.toLocaleString()} رزمة)`
                  : `المتاح: ${fullCartons.toLocaleString()} كرتونة (${actualStock.toLocaleString()} رزمة)`;

                return (
                  <div
                    key={p.id}
                    onClick={() => !isDisabled && handleSelect(p)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`px-3 py-2.5 rounded-lg flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer ${
                      isDisabled
                        ? "opacity-45 bg-slate-50/50 cursor-not-allowed text-slate-400"
                        : isSelected
                        ? "bg-emerald-50 text-emerald-950 font-bold"
                        : isHighlighted
                        ? "bg-slate-100 text-slate-900"
                        : "hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    {/* الاسم والفئة والوحدة */}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate">{p.name}</p>
                      <p className="text-2xs text-slate-500 font-medium mt-0.5">
                        {p.categoryName} • {isCopyPaper ? "كرتونة / رزمة" : p.entryUnitLabel}
                      </p>
                    </div>

                    {/* معلومات الرصيد والحالة في الجانب الأيسر */}
                    <div className="shrink-0 flex items-center gap-2">
                      {isOutbound && (
                        <span
                          className={`text-2xs font-bold px-2 py-0.5 rounded ${
                            isZeroStock
                              ? "bg-rose-100 text-rose-700 font-extrabold"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          }`}
                        >
                          {isZeroStock
                            ? "نفد المخزون"
                            : isCopyPaper
                            ? copyPaperStockText
                            : `المتاح: ${p.availableInEntryUnit.toLocaleString()} ${p.entryUnitLabel}`}
                        </span>
                      )}

                      {isAlreadyChosen && (
                        <span className="text-2xs font-semibold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                          محدد في بند آخر
                        </span>
                      )}

                      {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductCombobox;
