import { useState, useEffect } from "react";
import { X, Sliders, Layers, Box, AlertCircle, Loader2, Check, Search, BookOpen, AlertTriangle } from "lucide-react";
import { getStockAlertThresholds, updateStockAlertThresholds } from "../services/productService";
import { showSuccess, showError } from "../../../utils/alertUtils";

export function StockAlertSettingsModal({ isOpen, onClose, onSaved }) {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;
    setLoading(true);
    setError(null);

    getStockAlertThresholds()
      .then((data) => {
        if (!ignore) {
          const loadedItems = (data.items || []).map((item) => ({
            ...item,
            thresholdInput: String(item.lowStockThreshold ?? (item.unitType === 3 ? 50 : 1000)),
            thresholdUnit: item.lowStockThresholdUnit ?? (item.unitType === 3 ? 2 : 1),
          }));
          setItems(loadedItems);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("فشل في جلب حدود التنبيه:", err);
          setError("تعذر جلب إعدادات الأصناف من الخادم");
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleThresholdChange = (productId, value) => {
    setItems((prev) =>
      prev.map((it) => (it.productId === productId ? { ...it, thresholdInput: value } : it))
    );
  };

  const handleUnitToggle = (productId, unitVal) => {
    setItems((prev) =>
      prev.map((it) => (it.productId === productId ? { ...it, thresholdUnit: unitVal } : it))
    );
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoryName.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === "all") return matchesSearch;
    if (filterType === "copyPaper") return matchesSearch && item.unitType === 3;
    if (filterType === "notebooks") return matchesSearch && (item.unitType === 1 || item.unitType === 2);
    return matchesSearch;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // تجهيز البايلود
    const payloadItems = items.map((it) => {
      const val = parseInt(it.thresholdInput, 10);
      return {
        productId: it.productId,
        lowStockThreshold: isNaN(val) || val < 0 ? 0 : val,
        lowStockThresholdUnit: it.unitType === 3 ? Number(it.thresholdUnit) : 1,
      };
    });

    setSaving(true);
    setError(null);

    try {
      await updateStockAlertThresholds({
        items: payloadItems,
      });

      showSuccess("تم تحديث حدود التنبيه", "تم حفظ حدود النواقص المخصصة لجميع الأصناف بنجاح");

      if (onSaved) {
        await onSaved();
      }
      onClose();
    } catch (err) {
      console.error("خطأ أثناء حفظ حدود التنبيه:", err);
      setError(err.message || "حدث خطأ أثناء حفظ الإعدادات في الخادم");
      showError("تعذر حفظ الإعدادات", err.message || "يرجى التحقق من الاتصال بالخادم والمحاولة ثانية");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-settings-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 id="alert-settings-title" className="text-base font-bold text-slate-900">
                إعدادات حدود تنبيه النواقص لكل صنف
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                تحديد الرصيد الحرج لكل صنف (بالكشكول / الكراس، وبالكرتونة أو الرزمة لورق التصوير)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث باسم الصنف أو الفئة..."
              className="w-full pr-9 pl-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 rounded-lg font-bold text-2xs transition-colors cursor-pointer ${
                filterType === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              الكل ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("copyPaper")}
              className={`px-3 py-1 rounded-lg font-bold text-2xs transition-colors cursor-pointer ${
                filterType === "copyPaper" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📄 ورق تصوير ({items.filter((i) => i.unitType === 3).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("notebooks")}
              className={`px-3 py-1 rounded-lg font-bold text-2xs transition-colors cursor-pointer ${
                filterType === "notebooks" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📚 كشاكيل وكراريس ({items.filter((i) => i.unitType !== 3).length})
            </button>
          </div>
        </div>

        {/* Form Body - Scrollable Items List */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 space-y-3">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <span className="text-xs font-medium">جاري تحميل أصناف المخزن...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Box className="w-8 h-8 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-bold text-slate-600">لا توجد أصناف مطابقة للبحث</p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isPaper = item.unitType === 3;
                const subUnit = item.subUnit || "كشكول";
                const baseUnit = item.baseUnit || (isPaper ? "كرتونة" : "باكو");
                const numVal = parseInt(item.thresholdInput, 10) || 0;
                const isCarton = isPaper && item.thresholdUnit === 2;
                const currentThresholdUnitLabel = isPaper ? (isCarton ? "كرتونة" : "رزمة") : subUnit;

                const thresholdInSubUnits = isPaper
                  ? (isCarton ? numVal * (item.unitsPerBaseUnit || 5) : numVal)
                  : numVal;
                const isLowStock = item.totalSubUnitStock <= thresholdInSubUnits && item.totalSubUnitStock > 0;
                const isOut = item.totalSubUnitStock === 0;

                return (
                  <div
                    key={item.productId}
                    className={`p-4 bg-white hover:bg-slate-50/70 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all shadow-2xs ${
                      isLowStock
                        ? "border-amber-300 ring-1 ring-amber-400/25 bg-amber-50/20"
                        : isOut
                        ? "border-rose-200 bg-rose-50/20"
                        : "border-slate-200/90"
                    }`}
                  >
                    {/* Item Info */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {item.productName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-2xs font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {item.categoryName}
                        </span>
                        {isLowStock && (
                          <span className="px-2 py-0.5 rounded-md text-3xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            قارب على النفاد
                          </span>
                        )}
                        {isOut && (
                          <span className="px-2 py-0.5 rounded-md text-3xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                            نفد الرصيد
                          </span>
                        )}
                      </div>
                      <div className="text-2xs text-slate-500 flex flex-wrap items-center gap-x-2">
                        <span className="font-medium">الرصيد الفعلي الحالي:</span>
                        <span className="font-bold text-slate-800">
                          {isPaper ? (
                            item.remainingSubUnits > 0
                              ? `${item.fullBaseUnits} كرتونة و ${item.remainingSubUnits} رزمة`
                              : `${item.fullBaseUnits} كرتونة`
                          ) : (
                            item.remainingSubUnits > 0
                              ? `${item.fullBaseUnits} باكو و ${item.remainingSubUnits} ${subUnit}`
                              : `${item.totalSubUnitStock.toLocaleString()} ${subUnit}`
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Threshold Input & Unit Toggle */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                      {isPaper ? (
                        <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleUnitToggle(item.productId, 2)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                              item.thresholdUnit === 2
                                ? "bg-amber-600 text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            كرتونة
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUnitToggle(item.productId, 1)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                              item.thresholdUnit === 1
                                ? "bg-blue-600 text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            رزمة
                          </button>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200">
                          بال{subUnit}
                        </span>
                      )}

                      <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                        <span className="px-2.5 py-1.5 bg-slate-50 text-slate-500 text-xs font-semibold select-none border-l border-slate-100">
                          حد النفاذ:
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={item.thresholdInput}
                          onChange={(e) => handleThresholdChange(item.productId, e.target.value)}
                          placeholder="0"
                          required
                          className="w-20 px-2 py-1.5 text-xs sm:text-sm font-bold text-slate-900 text-center focus:outline-none"
                        />
                        <span className="px-2.5 py-1.5 bg-slate-50 text-slate-700 text-xs font-bold select-none border-r border-slate-100">
                          {currentThresholdUnitLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Note */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-2xs text-amber-900 leading-relaxed flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">ملاحظة التخصيص الدقيق:</span> يتم تطبيق حد النواقص لكل صنف بشكل مستقل. إذا وصل رصيد الصنف إلى هذا الحد أو أقل، يُصنف كـ "قارب على النفاد" ويظهر فوراً في بطاقة النواقص بالداشبورد وقائمة الأصناف.
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0">
            <span className="text-2xs font-bold text-slate-500">
              إجمالي الأصناف: {items.length} صنف
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={saving || loading || items.length === 0}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري حفظ الحدود...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    حفظ وتطبيق الحدود
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
