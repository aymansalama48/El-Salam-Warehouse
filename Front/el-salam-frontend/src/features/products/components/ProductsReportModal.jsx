import { useState, useEffect, useMemo } from "react";
import { 
  X, 
  Layers, 
  AlertCircle, 
  Loader2, 
  FileText, 
  Download, 
  Search, 
  CheckSquare, 
  Check, 
  PackageCheck, 
  ListFilter 
} from "lucide-react";
import { getProductsReportPdf, getProducts } from "../services/productService";
import { validateProductsReport } from "../schemas/productSchema";
import { getCategoriesLookup } from "../../categories/services/categoryService";
import { handlePdfDownloadAndPreview } from "../../../utils/reportUtils";
import { showSuccess, showError } from "../../../utils/alertUtils";

export function ProductsReportModal({ 
  isOpen, 
  onClose, 
  categories: propCategories = [],
  products: propProducts = []
}) {
  const [fetchedCategories, setFetchedCategories] = useState([]);
  const [fetchedProducts, setFetchedProducts] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [selectionMode, setSelectionMode] = useState("all"); // "all" | "custom"
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // جلب الفئات إذا لم تُمرر
  useEffect(() => {
    if (!isOpen || propCategories.length > 0) return;

    let ignore = false;
    getCategoriesLookup()
      .then((data) => {
        if (!ignore && Array.isArray(data)) {
          setFetchedCategories(data);
        }
      })
      .catch((err) => {
        console.error("فشل في جلب الفئات للتقرير:", err);
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, propCategories.length]);

  // جلب المنتجات إذا لم تُمرر
  useEffect(() => {
    if (!isOpen || propProducts.length > 0) return;

    let ignore = false;
    getProducts()
      .then((data) => {
        if (!ignore && Array.isArray(data)) {
          setFetchedProducts(data);
        }
      })
      .catch((err) => {
        console.error("فشل في جلب المنتجات للتقرير:", err);
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, propProducts.length]);

  const categories = propCategories.length > 0 ? propCategories : fetchedCategories;
  const allProducts = propProducts.length > 0 ? propProducts : fetchedProducts;
  const isLoadingProducts = isOpen && propProducts.length === 0 && fetchedProducts.length === 0;

  // تصفية الأصناف المتاحة حسب الفئة المختارة
  const categoryFilteredProducts = useMemo(() => {
    if (!selectedCategoryId || selectedCategoryId === "all") {
      return allProducts;
    }
    return allProducts.filter((p) => p.categoryId === selectedCategoryId);
  }, [allProducts, selectedCategoryId]);

  // تصفية الأصناف المعروضة حسب نص البحث
  const displayedProducts = useMemo(() => {
    if (!productSearch.trim()) return categoryFilteredProducts;
    const query = productSearch.trim().toLowerCase();
    return categoryFilteredProducts.filter(
      (p) =>
        p.name?.toLowerCase().includes(query) ||
        p.categoryName?.toLowerCase().includes(query)
    );
  }, [categoryFilteredProducts, productSearch]);

  if (!isOpen) return null;

  const handleCategoryChange = (newCatId) => {
    setSelectedCategoryId(newCatId);
    setError(null);

    // إذا كان المستخدم محدد أصناف، نبقي فقط على الأصناف التي تنتمي للفئة الجديدة
    if (newCatId !== "all") {
      setSelectedProductIds((prev) => {
        const validIds = new Set(
          allProducts.filter((p) => p.categoryId === newCatId).map((p) => p.id)
        );
        return prev.filter((id) => validIds.has(id));
      });
    }
  };

  const handleToggleProduct = (id) => {
    setError(null);
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    setError(null);
    const visibleIds = displayedProducts.map((p) => p.id);
    setSelectedProductIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleDeselectAll = () => {
    setError(null);
    setSelectedProductIds([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // تطبيق التحقق عبر Zod
    const validation = validateProductsReport({ selectionMode, selectedProductIds });
    if (!validation.success) {
      setError(validation.errors.selectedProductIds || "يرجى تحديد صنف واحد على الأقل.");
      return;
    }

    const isAllCategories = !selectedCategoryId || selectedCategoryId === "all";
    const categoryIdParam = isAllCategories ? null : selectedCategoryId;
    const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
    const productIdsParam = selectionMode === "custom" ? selectedProductIds : null;

    try {
      setLoading(true);
      const blob = await getProductsReportPdf(categoryIdParam, productIdsParam);

      const today = new Date().toISOString().split("T")[0];
      let fileName = `جرد المنتجات ${today}.pdf`;

      if (selectionMode === "custom") {
        if (selectedProductIds.length === 1) {
          const singleProd = allProducts.find((p) => p.id === selectedProductIds[0]);
          fileName = `جرد - ${singleProd?.name || "صنف محدد"} ${today}.pdf`;
        } else {
          fileName = `جرد (${selectedProductIds.length} أصناف) ${today}.pdf`;
        }
      } else if (selectedCategory) {
        fileName = `جرد المنتجات - ${selectedCategory.name} ${today}.pdf`;
      }

      handlePdfDownloadAndPreview(blob, fileName);

      const successDetails =
        selectionMode === "custom"
          ? `تم تنزيل وفتح تقرير جرد لـ (${selectedProductIds.length}) أصناف محددة`
          : `تم تنزيل وفتح تقرير جرد ${selectedCategory ? selectedCategory.name : "جميع الأصناف"} بالكامل`;

      showSuccess("تم إنشاء تقرير الجرد بنجاح", successDetails);
      onClose();
    } catch (err) {
      console.error("خطأ أثناء تحميل تقرير جرد المنتجات:", err);
      const msg = err.message || "تعذر إنشاء ملف تقرير الجرد من الخادم.";
      setError(msg);
      showError("تعذر إنشاء التقرير", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-lg max-h-[calc(100dvh-2rem)] sm:max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-right">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-100/80 text-indigo-700 shrink-0 shadow-2xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                تقرير جرد المنتجات (PDF)
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                توليد بيان جرد رسمي معتمد لأرصدة ومحتويات المستودع
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1) اختيار الفئة */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              فئة المنتجات المطلوب جردها:
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:bg-white font-bold text-slate-800 cursor-pointer"
            >
              <option value="all">جميع الفئات (تقرير الجرد الشامل)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2) نطاق تحديد الأصناف (الكل أو أصناف محددة) */}
          <div>
            <label className="block text-2xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
              <ListFilter className="w-3.5 h-3.5 text-indigo-600" />
              نطاق الأصناف المشمولة بالتقرير:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectionMode("all");
                  setError(null);
                }}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                  selectionMode === "all"
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-600/25 scale-[1.01]"
                    : "border-slate-200 bg-slate-50 hover:bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <PackageCheck className="w-3.5 h-3.5" />
                جميع الأصناف
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectionMode("custom");
                  setError(null);
                }}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                  selectionMode === "custom"
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-600/25 scale-[1.01]"
                    : "border-slate-200 bg-slate-50 hover:bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                تحديد أصناف معينة {selectedProductIds.length > 0 && `(${selectedProductIds.length})`}
              </button>
            </div>
          </div>

          {/* 3) قائمة اختيار الأصناف (تظهر فقط عند تفعيل التحديد المخصص) */}
          {selectionMode === "custom" && (
            <div className="border border-slate-200/90 rounded-xl p-3 bg-slate-50/50 space-y-2.5 animate-in fade-in duration-150">
              {/* شريط البحث وزراير التحديد السريع */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="بحث في الأصناف بالاسم..."
                    className="w-full pr-8.5 pl-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-medium"
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch("")}
                      className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={handleSelectAllVisible}
                    className="px-2.5 py-1 text-2xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200/70 transition-colors cursor-pointer"
                  >
                    تحديد الكل ({displayedProducts.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    disabled={selectedProductIds.length === 0}
                    className="px-2.5 py-1 text-2xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>

              {/* قائمة الأصناف القابلة للتمرير */}
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-slate-200/60 rounded-lg p-1.5 bg-white">
                {isLoadingProducts ? (
                  <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>جاري تحميل الأصناف...</span>
                  </div>
                ) : displayedProducts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 font-medium">
                    لا توجد أصناف متوفرة أو مطابقة للبحث
                  </div>
                ) : (
                  displayedProducts.map((prod) => {
                    const isChecked = selectedProductIds.includes(prod.id);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleToggleProduct(prod.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                          isChecked
                            ? "bg-indigo-50/80 text-indigo-950 font-bold border border-indigo-200/60"
                            : "hover:bg-slate-50 text-slate-700 font-medium border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                              isChecked
                                ? "bg-indigo-600 text-white"
                                : "border border-slate-300 bg-white"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="truncate">{prod.name}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 mr-2 text-2xs">
                          {prod.categoryName && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                              {prod.categoryName}
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                            {prod.baseUnit || "باكو"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ملخص الاختيار */}
              <div className="text-2xs text-slate-500 font-semibold flex items-center justify-between px-1 pt-0.5">
                <span>تم تحديد: <strong className="text-indigo-700 font-bold">{selectedProductIds.length}</strong> صنف</span>
                {categoryFilteredProducts.length > 0 && (
                  <span>إجمالي أصناف الفئة: {categoryFilteredProducts.length}</span>
                )}
              </div>
            </div>
          )}

          {/* نص التوجيه */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-2xs text-indigo-900 flex items-start gap-2">
            <FileText className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p>
              {selectionMode === "custom"
                ? `سيتم استخراج ملف تقرير جرد رسمي معتمد لـ (${selectedProductIds.length}) أصناف محددة بالتفصيل.`
                : selectedCategoryId !== "all"
                ? `يحتوي التقرير على تفاصيل رصيد أصناف فئة (${categories.find((c) => c.id === selectedCategoryId)?.name || ""}) بالوحدات الكبيرة والصغيرة.`
                : "يحتوي التقرير على تفاصيل رصيد كل صنف بالوحدة الكبيرة (باكو / كرتونة) وبالوحدة الصغيرة (كشكول / رزمة) مع إجمالي الرصيد الفعلي لجميع الأصناف."}
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 pb-2 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0 sticky bottom-0 bg-white/95 backdrop-blur-xs z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 shadow-xs">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {loading ? "جاري إنشاء التقرير..." : "موافق"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductsReportModal;
