import { useState, useEffect } from "react";
import { 
  X, 
  Calendar, 
  Printer, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  FileText, 
  Filter, 
  Building2, 
  Layers, 
  CheckCircle2,
  FolderTree
} from "lucide-react";
import { getDaybookReportPdf } from "../services/daybookService";
import { validateDaybookReport } from "../schemas/daybookReportSchema";
import { getCategoriesLookup } from "../../categories/services/categoryService";
import { 
  getReportDateShortcuts, 
  handlePdfDownloadAndPreview 
} from "../../../utils/reportUtils";
import { showSuccess, showError } from "../../../utils/alertUtils";

export function DaybookReportModal({ isOpen, onClose, categories = [] }) {
  const shortcuts = getReportDateShortcuts();

  const [categoriesList, setCategoriesList] = useState(categories);
  const [fromDate, setFromDate] = useState(shortcuts.today.fromDate);
  const [toDate, setToDate] = useState(shortcuts.today.toDate);
  const [activeShortcut, setActiveShortcut] = useState("today");

  // الفلاتر الإضافية
  const [voucherType, setVoucherType] = useState(null); // null = الكل, 1 = وارد, 2 = منصرف
  const [voucherSource, setVoucherSource] = useState(null); // null = الكل, 2 = صالة الإنتاج, 1 = جهات خارجية
  const [categoryMode, setCategoryMode] = useState("all"); // "all" | "paper" | "notebooks" | "custom"
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoriesList(categories);
    } else if (isOpen) {
      getCategoriesLookup()
        .then((cats) => {
          if (Array.isArray(cats)) setCategoriesList(cats);
        })
        .catch(() => {});
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  // فحص ما إذا كان التاريخان يطابقان أحد الاختصارات
  const checkMatchingShortcut = (from, to) => {
    for (const [key, sc] of Object.entries(shortcuts)) {
      if (sc.fromDate === from && sc.toDate === to) {
        return key;
      }
    }
    return null;
  };

  const handleApplyShortcut = (shortcutKey) => {
    const sc = shortcuts[shortcutKey];
    if (sc) {
      setFromDate(sc.fromDate);
      setToDate(sc.toDate);
      setActiveShortcut(shortcutKey);
      setError(null);
    }
  };

  const handleFromDateChange = (val) => {
    setFromDate(val);
    setActiveShortcut(checkMatchingShortcut(val, toDate));
    setError(null);
  };

  const handleToDateChange = (val) => {
    setToDate(val);
    setActiveShortcut(checkMatchingShortcut(fromDate, val));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    let targetUnitType = null;
    let targetCategoryId = null;

    if (categoryMode === "paper") {
      targetUnitType = 3; // ورق تصوير
    } else if (categoryMode === "notebooks") {
      targetUnitType = 1; // كشاكيل وكراريس
    } else if (categoryMode === "custom") {
      if (!selectedCategoryId) {
        setError("يرجى اختيار الفئة المحددة من القائمة.");
        return;
      }
      targetCategoryId = selectedCategoryId;
    }

    // التحقق عبر Zod
    const validation = validateDaybookReport({ 
      fromDate, 
      toDate, 
      voucherType,
      source: voucherSource,
      unitType: targetUnitType,
      categoryId: targetCategoryId
    });

    if (!validation.success) {
      const firstError = Object.values(validation.errors)[0];
      setError(firstError || "يرجى التحقق من تواريخ التقرير المدخلة.");
      return;
    }

    try {
      setLoading(true);

      const blob = await getDaybookReportPdf({
        fromDate,
        toDate,
        type: voucherType,
        source: voucherSource,
        unitType: targetUnitType,
        categoryId: targetCategoryId,
      });

      // إنشاء اسم ملف ذكي يعبر بدقة عن الفلاتر
      const parts = ["دفتر_اليومية"];
      if (voucherType === 1) parts.push("وارد");
      if (voucherType === 2) parts.push("منصرف");
      if (voucherType === 3) parts.push("مرتجع");
      if (voucherSource === 2) parts.push("إنتاج");
      if (voucherSource === 1) parts.push("خارجي");
      if (categoryMode === "paper") parts.push("ورق_تصوير");
      if (categoryMode === "notebooks") parts.push("كشاكيل");
      if (categoryMode === "custom" && targetCategoryId) {
        const cat = categoriesList.find((c) => c.id === targetCategoryId);
        if (cat?.name) parts.push(cat.name.trim().replace(/\s+/g, "_"));
      }
      parts.push(`${fromDate}_إلى_${toDate}`);
      const fileName = `${parts.join("_")}.pdf`;

      handlePdfDownloadAndPreview(blob, fileName);

      showSuccess("تم إنشاء التقرير بنجاح", `تم تنزيل ومعاينة تقرير دفتر اليومية المخصص للفترة من ${fromDate} إلى ${toDate}`);
      onClose();
    } catch (err) {
      console.error("خطأ أثناء استخراج تقرير دفتر اليومية:", err);
      const msg = err.message || "تعذر إنشاء ملف التقرير من الخادم.";
      setError(msg);
      showError("تعذر إنشاء التقرير", msg);
    } finally {
      setLoading(false);
    }
  };

  // توليد ملخص نصي ديناميكي للشروط المحددة
  const getSummaryBadges = () => {
    const list = [];
    
    // نوع الحركة
    if (voucherType === 1) list.push("إذونات الوارد فقط");
    else if (voucherType === 2) list.push("إذونات الصرف فقط");
    else if (voucherType === 3) list.push("إذونات المرتجع فقط");
    else list.push("الوارد والصرف والمرتجع معاً");

    // المصدر
    if (voucherSource === 2) list.push("صالة الإنتاج والتجليد فقط");
    else if (voucherSource === 1) list.push("جهات خارجية / موردين وعملاء");
    else list.push("كافة المصادر والجهات");

    // التصنيف
    if (categoryMode === "paper") list.push("ورق تصوير فقط");
    else if (categoryMode === "notebooks") list.push("كشاكيل وكراريس فقط");
    else if (categoryMode === "custom" && selectedCategoryId) {
      const c = categoriesList.find((x) => x.id === selectedCategoryId);
      list.push(c ? `فئة: ${c.name}` : "فئة مخصصة");
    } else list.push("جميع الفئات والأصناف");

    return list;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-xl max-h-[calc(100dvh-2rem)] sm:max-h-[92dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-right">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/90 via-white to-slate-50/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600 text-white shrink-0 shadow-xs ring-4 ring-blue-50">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                طباعة تقرير دفتر اليومية المخصص (PDF)
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                تصفية الحركات حسب نوع السند، المصدر، ونوع الفئة خلال الفترة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer disabled:opacity-40"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 flex-1 min-h-0 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. نوع الحركة (وارد / منصرف / الكل) */}
          <div className="space-y-1.5">
            <label className="block text-2xs font-extrabold text-slate-600 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              1. نوع الحركة في التقرير:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: null, label: "الكل (شامل)", activeClass: "border-blue-600 bg-blue-600 text-white shadow-xs" },
                { value: 1, label: "📥 وارد فقط", activeClass: "border-emerald-600 bg-emerald-600 text-white shadow-xs" },
                { value: 2, label: "📤 منصرف فقط", activeClass: "border-rose-600 bg-rose-600 text-white shadow-xs" },
                { value: 3, label: "🔄 مرتجع فقط", activeClass: "border-amber-600 bg-amber-600 text-white shadow-xs" },
              ].map((opt) => {
                const isActive = voucherType === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setVoucherType(opt.value)}
                    className={`py-2 px-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                      isActive
                        ? `${opt.activeClass} ring-2 ring-blue-600/20`
                        : "border-slate-200 bg-slate-50/70 hover:bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. مصدر الحركة / الجهة (صالة الإنتاج / جهات خارجية / الكل) */}
          <div className="space-y-1.5">
            <label className="block text-2xs font-extrabold text-slate-600 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              2. مصدر الحركة / الجهة:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { value: null, label: "كافة المصادر والجهات", activeClass: "border-indigo-600 bg-indigo-600 text-white shadow-xs" },
                { value: 2, label: "🏭 صالة الإنتاج والتجليد", activeClass: "border-purple-600 bg-purple-600 text-white shadow-xs" },
                { value: 1, label: "🏢 جهات خارجية (عملاء وموردين)", activeClass: "border-slate-800 bg-slate-800 text-white shadow-xs" },
              ].map((opt) => {
                const isActive = voucherSource === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setVoucherSource(opt.value)}
                    className={`py-2 px-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                      isActive
                        ? `${opt.activeClass} ring-2 ring-indigo-600/20`
                        : "border-slate-200 bg-slate-50/70 hover:bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. تصنيف الأصناف والفئات (ورق تصوير / كشاكيل / فئة مخصصة / الكل) */}
          <div className="space-y-1.5">
            <label className="block text-2xs font-extrabold text-slate-600 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              3. تصنيف الفئات والمنتجات:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: "all", label: "كل الفئات والأصناف" },
                { key: "paper", label: "📄 ورق تصوير فقط" },
                { key: "notebooks", label: "📒 كشاكيل وكراريس" },
                { key: "custom", label: "🎯 فئة محددة..." },
              ].map((m) => {
                const isActive = categoryMode === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setCategoryMode(m.key)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                      isActive
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/20"
                        : "border-slate-200 bg-slate-50/70 hover:bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* قائمة منسدلة للفئات عند اختيار "فئة محددة" */}
            {categoryMode === "custom" && (
              <div className="pt-1.5 animate-in fade-in duration-150">
                <div className="relative">
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-800 shadow-2xs"
                  >
                    <option value="">-- اختر الفئة المطلوبة من القائمة --</option>
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.productsCount || 0} صنف مسجل)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 4. اختصارات سريعة للفترة */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-2xs font-extrabold text-slate-600 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              4. اختصارات سريعة للفترة:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: "today", label: "اليوم" },
                { key: "yesterday", label: "أمس" },
                { key: "last7Days", label: "آخر 7 أيام" },
                { key: "thisMonth", label: "هذا الشهر" },
              ].map(({ key, label }) => {
                const isActive = activeShortcut === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleApplyShortcut(key)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                      isActive
                        ? "border-blue-600 bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/20"
                        : "border-slate-200 bg-slate-50/70 hover:bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. حقلا التاريخ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* من تاريخ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                من تاريخ <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={fromDate}
                onChange={(e) => handleFromDateChange(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:bg-white font-medium"
              />
            </div>

            {/* إلى تاريخ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                إلى تاريخ <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={toDate}
                onChange={(e) => handleToDateChange(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:bg-white font-medium"
              />
            </div>
          </div>

          {/* 6. صندوق ملخص الفلترة المعتمد */}
          <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs space-y-1.5">
            <span className="font-extrabold text-blue-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              ملخص شروط التقرير المطلوب:
            </span>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {getSummaryBadges().map((b, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-white border border-blue-200 text-blue-950 font-extrabold text-2xs shadow-2xs"
                >
                  {b}
                </span>
              ))}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-blue-600 text-white font-bold text-2xs shadow-2xs">
                {fromDate === toDate ? `عن يوم ${fromDate}` : `الفترة: ${fromDate} إلى ${toDate}`}
              </span>
            </div>
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
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري استخراج ملف الـ PDF...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>توليد وطباعة التقرير (PDF)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DaybookReportModal;
