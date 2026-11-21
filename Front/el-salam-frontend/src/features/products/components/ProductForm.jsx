import { useState, useEffect } from "react";
import { PackagePlus, Edit, Tag, Layers, Box, MapPin, Info, AlertCircle, Loader2, AlertTriangle, Sliders, X } from "lucide-react";
import { validateProduct } from "../schemas/productSchema";
import { getCategoriesLookup } from "../../categories/services/categoryService";
import { getProductUnitTypes, DEFAULT_PRODUCT_UNIT_TYPES } from "../services/productService";

/**
 * نموذج المنتجات (ProductForm)
 * يعتمد على نوع المنتج (unitType) المحدد من الباك اند مع حد النواقص الخاص بكل صنف
 */
export function ProductForm({ categories = [], onSubmit, onCancel, initialData }) {
  const isEdit = Boolean(initialData);

  const [categoriesList, setCategoriesList] = useState(categories);
  const [loadingCategories, setLoadingCategories] = useState(categories.length === 0);
  const [unitTypesList, setUnitTypesList] = useState(DEFAULT_PRODUCT_UNIT_TYPES);

  const [name, setName] = useState(initialData?.name || "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || categories[0]?.id || "");
  const [unitType, setUnitType] = useState(initialData?.unitType ?? 1);
  const [initialStockUnit, setInitialStockUnit] = useState(initialData?.unitType === 3 ? 2 : 1);
  const [unitsPerBaseUnit, setUnitsPerBaseUnit] = useState(
    (initialData?.unitsPerBaseUnit ?? (initialData?.unitType === 3 ? 5 : initialData?.unitType === 2 ? 20 : 10)).toString()
  );

  // حد تنبيه النواقص المخصص للصنف
  const [lowStockThreshold, setLowStockThreshold] = useState(
    initialData?.lowStockThreshold != null
      ? String(initialData.lowStockThreshold)
      : initialData?.unitType === 3
      ? "50"
      : "1000"
  );
  const [lowStockThresholdUnit, setLowStockThresholdUnit] = useState(
    initialData?.lowStockThresholdUnit ?? (initialData?.unitType === 3 ? 2 : 1)
  );
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);

  // الرقم الذي يكتبه المستخدم في خانة الرصيد الافتتاحي (في حالة الإضافة فقط)
  const [initialStock, setInitialStock] = useState("");

  const [storageLocation, setStorageLocation] = useState(
    initialData?.storageLocation || ""
  );

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // جلب الفئات وأنواع الوحدات من الـ Backend
  useEffect(() => {
    let ignore = false;

    getProductUnitTypes()
      .then((types) => {
        if (!ignore && Array.isArray(types) && types.length > 0) {
          setUnitTypesList(types);
        }
      })
      .catch((err) => {
        console.error("فشل في تحميل أنواع الوحدات:", err);
      });

    getCategoriesLookup()
      .then((data) => {
        if (!ignore && Array.isArray(data) && data.length > 0) {
          setCategoriesList(data);
          setCategoryId((prev) => {
            if (prev && data.some((c) => c.id === prev)) return prev;
            return initialData?.categoryId || data[0].id;
          });
        }
      })
      .catch((err) => {
        console.error("فشل في تحميل فئات lookup:", err);
      })
      .finally(() => {
        if (!ignore) setLoadingCategories(false);
      });

    return () => {
      ignore = true;
    };
  }, [initialData]);

  const activeProfile =
    unitTypesList.find((u) => u.unitType === Number(unitType)) ||
    unitTypesList[0] ||
    DEFAULT_PRODUCT_UNIT_TYPES[0];

  const baseUnit = activeProfile.baseUnit;
  const subUnit = activeProfile.subUnit;
  const isBoxUnit = activeProfile.unitType === 3;
  const entryUnit = activeProfile.entryUnit;

  const availableUnitTypes = isEdit
    ? initialData?.unitType === 3
      ? unitTypesList.filter((u) => u.unitType === 3)
      : unitTypesList.filter((u) => u.unitType === 1 || u.unitType === 2)
    : unitTypesList;

  const handleUnitTypeChange = (newTypeVal) => {
    const newType = Number(newTypeVal);
    setUnitType(newType);
    if (errors.unitType) setErrors((prev) => ({ ...prev, unitType: null }));

    if (newType === 3) {
      setInitialStockUnit(2);
      setLowStockThresholdUnit(2);
      if (!lowStockThreshold || lowStockThreshold === "1000") setLowStockThreshold("50");
      setUnitsPerBaseUnit("5");
    } else if (newType === 2) {
      setInitialStockUnit(1);
      setLowStockThresholdUnit(1);
      if (!lowStockThreshold || lowStockThreshold === "50") setLowStockThreshold("1000");
      setUnitsPerBaseUnit("1");
    } else {
      setInitialStockUnit(1);
      setLowStockThresholdUnit(1);
      if (!lowStockThreshold || lowStockThreshold === "50") setLowStockThreshold("1000");
      setUnitsPerBaseUnit("1");
    }
  };

  const handleCategorySelect = (selectedId) => {
    setCategoryId(selectedId);
    if (errors.categoryId) setErrors((prev) => ({ ...prev, categoryId: null }));
  };

  const handleNameInput = (val) => {
    setName(val);
    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
  };

  const parsedUnitsPer = Number(unitsPerBaseUnit) || 0;
  const parsedInitialStock = Number(initialStock) || 0;
  const parsedThreshold = Number(lowStockThreshold) || 0;

  const fullPacks = parsedUnitsPer > 0 ? Math.floor(parsedInitialStock / parsedUnitsPer) : 0;
  const restPieces = parsedUnitsPer > 0 ? parsedInitialStock % parsedUnitsPer : 0;
  const totalReams = parsedInitialStock * parsedUnitsPer;

  const getContentLabel = () => `عدد ${subUnit} في ${baseUnit}`;

  const getContentExample = () => {
    if (isBoxUnit) return "مثال: 5 رزم في الكرتونة";
    if (activeProfile.unitType === 2) return "كراس فردي";
    return "كشكول فردي";
  };

  const getStockLabel = () => {
    if (isBoxUnit) {
      return initialStockUnit === 2 ? `عدد الكراتين (الرصيد الافتتاحي)` : `عدد الرزم (الرصيد الافتتاحي)`;
    }
    return `عدد ${subUnit} (الرصيد الافتتاحي)`;
  };

  const getStockPlaceholder = () => {
    if (isBoxUnit) {
      return initialStockUnit === 2 ? `مثال: 50 كرتونة` : `مثال: 250 رزمة`;
    }
    return `مثال: 500 ${subUnit}`;
  };

  const getStockInputBadge = () => {
    if (isBoxUnit) {
      return initialStockUnit === 2 ? "كرتونة" : "رزمة";
    }
    return subUnit;
  };

  const getStockHint = () => {
    if (isBoxUnit) {
      return initialStockUnit === 2
        ? `إجمالي عدد الكراتين المتوفرة بالمستودع`
        : `إجمالي عدد الرزم المتوفرة بالمستودع`;
    }
    return `إجمالي عدد ال${subUnit} المتوفرة بالمستودع`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const thresholdUnit = isBoxUnit ? Number(lowStockThresholdUnit) : 1;

    const finalUnitsPer = isBoxUnit ? (parsedUnitsPer || 5) : 1;

    const formData = isEdit
      ? {
          name: name.trim(),
          categoryId: categoryId || (categoriesList[0]?.id ?? ""),
          unitType: Number(unitType),
          unitsPerBaseUnit: finalUnitsPer,
          storageLocation: storageLocation.trim() || null,
          lowStockThreshold: parsedThreshold,
          lowStockThresholdUnit: thresholdUnit,
        }
      : {
          name: name.trim(),
          categoryId: categoryId || (categoriesList[0]?.id ?? ""),
          unitType: Number(unitType),
          unitsPerBaseUnit: finalUnitsPer,
          initialStock: parsedInitialStock,
          initialStockUnit: isBoxUnit ? initialStockUnit : 1,
          storageLocation: storageLocation.trim() || null,
          lowStockThreshold: parsedThreshold,
          lowStockThresholdUnit: thresholdUnit,
        };

    const validation = validateProduct(formData, isEdit);
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      if (onSubmit) {
        await onSubmit(formData);
      }
    } catch (err) {
      console.error("خطأ أثناء الحفظ:", err);
      if (err.message) {
        setErrors((prev) => ({ ...prev, api: err.message }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const hasNoCategories = categoriesList.length === 0 && !loadingCategories;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 max-w-2xl mx-auto">
      <div className="border-b border-slate-100 pb-4 mb-6 flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isEdit ? "bg-blue-100/80 text-blue-700" : "bg-emerald-100/80 text-emerald-700"
          }`}
        >
          {isEdit ? <Edit className="w-5 h-5" /> : <PackagePlus className="w-5 h-5" />}
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {isEdit ? "تعديل بيانات المنتج" : "إضافة منتج أو صنف جديد"}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {isEdit
              ? "تعديل مواصفات الصنف وحد التنبيه ومكان التخزين (الرصيد يتغير بحركات المخزن)"
              : "تسجيل الصنف ونوع المنتج والرصيد الافتتاحي وحد التنبيه الحرج"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-right">
        {hasNoCategories && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>تنبيه: لا توجد فئات مسجلة في قاعدة البيانات بعد.</span>
          </div>
        )}

        {errors.api && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errors.api}</span>
          </div>
        )}

        {/* اسم المنتج */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-blue-600" />
            اسم المنتج أو الصنف <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameInput(e.target.value)}
            placeholder={isBoxUnit ? "مثال: كرتونة ورق تصوير A4 وزن 80 جم (5 رزم)" : "مثال: كشكول مدرسي مسطر 60 ورقة دبوس"}
            className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white transition-colors font-medium ${
              errors.name ? "border-rose-400 focus:border-rose-500 bg-rose-50/30" : "border-slate-200 focus:border-slate-800"
            }`}
          />
          {errors.name && <p className="text-xs text-rose-500 font-bold mt-1">{errors.name}</p>}
        </div>

        {/* فئة المنتج ونوع المنتج */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                فئة المنتج <span className="text-rose-500">*</span>
              </label>
              {loadingCategories && (
                <span className="text-2xs text-blue-600 font-bold flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  تحميل...
                </span>
              )}
            </div>
            <select
              value={categoryId}
              disabled={loadingCategories || hasNoCategories}
              onChange={(e) => handleCategorySelect(e.target.value)}
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer font-bold ${
                errors.categoryId ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
              }`}
            >
              {loadingCategories ? (
                <option value="">جاري تحميل الفئات...</option>
              ) : hasNoCategories ? (
                <option value="">لا توجد فئات متاحة</option>
              ) : (
                categoriesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
            {errors.categoryId && <p className="text-xs text-rose-500 font-bold mt-1">{errors.categoryId}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              نوع المنتج <span className="text-rose-500">*</span>
            </label>
            <select
              value={unitType}
              onChange={(e) => handleUnitTypeChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer font-bold"
            >
              {availableUnitTypes.map((opt) => (
                <option key={opt.unitType} value={opt.unitType}>
                  {opt.displayName} ({opt.baseUnit})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* محتوى الوحدة والرصيد */}
        <div className={`grid ${isBoxUnit && !isEdit ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-4`}>
          {isBoxUnit && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                عدد الرزم في الكرتونة <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={unitsPerBaseUnit}
                  onChange={(e) => {
                    setUnitsPerBaseUnit(e.target.value);
                    if (errors.unitsPerBaseUnit) setErrors((prev) => ({ ...prev, unitsPerBaseUnit: null }));
                  }}
                  placeholder="5"
                  className={`w-full px-3.5 py-2.5 pl-20 text-xs sm:text-sm font-bold bg-slate-50 border rounded-xl focus:outline-none focus:bg-white transition-colors ${
                    errors.unitsPerBaseUnit ? "border-rose-400 focus:border-rose-500 bg-rose-50/30" : "border-slate-200 focus:border-slate-800"
                  }`}
                />
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                  رزمة
                </span>
              </div>
              {errors.unitsPerBaseUnit ? (
                <p className="text-xs text-rose-500 font-bold mt-1">{errors.unitsPerBaseUnit}</p>
              ) : (
                <p className="text-2xs text-slate-400 mt-1">مثال: 5 رزم في الكرتونة</p>
              )}
            </div>
          )}

          {!isEdit && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  {getStockLabel()}
                </label>
                {isBoxUnit && (
                  <div className="flex items-center gap-1 bg-slate-200/90 p-0.5 rounded-lg border border-slate-300">
                    <button
                      type="button"
                      onClick={() => setInitialStockUnit(2)}
                      className={`px-2.5 py-1 text-2xs font-extrabold rounded-md transition-all cursor-pointer ${
                        initialStockUnit === 2
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      📦 بالكرتونة
                    </button>
                    <button
                      type="button"
                      onClick={() => setInitialStockUnit(1)}
                      className={`px-2.5 py-1 text-2xs font-extrabold rounded-md transition-all cursor-pointer ${
                        initialStockUnit === 1
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      📄 بالرزمة
                    </button>
                  </div>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={initialStock}
                  onChange={(e) => {
                    setInitialStock(e.target.value);
                    if (errors.initialStock) setErrors((prev) => ({ ...prev, initialStock: null }));
                  }}
                  placeholder={getStockPlaceholder()}
                  className={`w-full px-3.5 py-2.5 pl-16 text-xs sm:text-sm font-bold bg-slate-50 border rounded-xl focus:outline-none focus:bg-white transition-colors ${
                    errors.initialStock ? "border-rose-400 focus:border-rose-500 bg-rose-50/30" : "border-slate-200 focus:border-slate-800"
                  }`}
                />
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                  {getStockInputBadge()}
                </span>
              </div>
              {errors.initialStock ? (
                <p className="text-xs text-rose-500 font-bold mt-1">{errors.initialStock}</p>
              ) : (
                <p className="text-2xs text-slate-400 mt-1">{getStockHint()}</p>
              )}
            </div>
          )}
        </div>

        {!isEdit && isBoxUnit && (
          isBoxUnit && (
            <>
              <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200/80 flex items-center justify-between text-xs font-bold shadow-2xs">
                <span className="text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {initialStockUnit === 2
                    ? "إجمالي الرزم المحسوبة تلقائياً:"
                    : "الرصيد المحسوب بالكرتونة تلقائياً:"}
                </span>
                <span className="text-emerald-950 font-extrabold text-xs sm:text-sm bg-white/90 px-2.5 py-1 rounded-lg border border-emerald-200/70 shadow-2xs">
                  {initialStockUnit === 2
                    ? `${totalReams.toLocaleString()} رزمة`
                    : parsedUnitsPer === 0 || parsedInitialStock === 0
                    ? `0 كرتونة`
                    : restPieces > 0
                    ? `${fullPacks} كرتونة و ${restPieces} رزمة`
                    : `${fullPacks} كرتونة`}
                </span>
              </div>

              <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                <span className="text-blue-800 font-medium">معادلة الاحتساب:</span>
                <span className="font-bold text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
                  {initialStockUnit === 2
                    ? `${parsedInitialStock.toLocaleString()} كرتونة × ${parsedUnitsPer} رزمة = ${totalReams.toLocaleString()} رزمة`
                    : parsedInitialStock > 0 && parsedUnitsPer > 0
                    ? `${parsedInitialStock.toLocaleString()} رزمة ÷ ${parsedUnitsPer} = ${fullPacks} كرتونة${restPieces > 0 ? ` و ${restPieces} رزمة` : ""}`
                    : `كل 1 كرتونة = ${parsedUnitsPer || 0} رزمة`}
                </span>
              </div>
            </>
          )
        )}

        {/* زر فتح نافذة حد النفاذ المنبثقة الصغير */}
        <div className="flex items-center justify-between p-3.5 bg-amber-50/60 hover:bg-amber-50/90 border border-amber-200/90 rounded-2xl transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span>حد تنبيه النواقص (الرصيد الحرج)</span>
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                  {parsedThreshold > 0
                    ? `${parsedThreshold.toLocaleString()} ${isBoxUnit ? (lowStockThresholdUnit === 2 ? "كرتونة" : "رزمة") : subUnit}`
                    : "غير محدد (0)"}
                </span>
              </div>
              <p className="text-2xs text-slate-500 mt-0.5">
                اضغط لتعديل وتحديد الرصيد الحرج في نافذة منبثقة مخصصة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsThresholdModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-amber-900 bg-white hover:bg-amber-100/70 border border-amber-300 rounded-xl shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-amber-600" />
            <span>تعديل الحد</span>
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            مكان التخزين بالمستودع
          </label>
          <input
            type="text"
            value={storageLocation}
            onChange={(e) => setStorageLocation(e.target.value)}
            placeholder={isBoxUnit ? "مثال: عنبر ورق التصوير والكراتين - رصة D1" : "مثال: عنبر بضاعة تامة - رصة A1"}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:bg-white transition-colors font-medium"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || hasNoCategories}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة المنتج"}
          </button>
        </div>

        {/* نافذة منبثقة صغيرة لتعديل حد النفاذ والحد الحرج */}
        {isThresholdModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs animate-in fade-in duration-150">
            <div
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-in zoom-in-95 duration-150 text-right"
              dir="rtl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      حد تنبيه النواقص والحد الحرج للصنف
                    </h3>
                    <p className="text-2xs text-slate-500 mt-0.5">
                      {isBoxUnit
                        ? "تحديد الرصيد الحرج لورق التصوير بالكرتونة أو بالرزمة"
                        : "تحديد كمية الحد الأدنى لتنبيه النواقص بالمستودع"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsThresholdModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">كمية الحد الحرج:</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={lowStockThreshold}
                    onChange={(e) => {
                      setLowStockThreshold(e.target.value);
                      if (errors.lowStockThreshold) setErrors((prev) => ({ ...prev, lowStockThreshold: null }));
                    }}
                    placeholder={
                      isBoxUnit
                        ? lowStockThresholdUnit === 2
                          ? "مثال: 50"
                          : "مثال: 250"
                        : "مثال: 1000"
                    }
                    autoFocus
                    className="w-full h-11 px-3.5 pl-24 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white transition-colors"
                  />
                  {isBoxUnit ? (
                    <div className="absolute left-1.5 inset-y-1.5 flex items-center gap-1 bg-amber-100/80 p-0.5 rounded-lg border border-amber-200">
                      <button
                        type="button"
                        onClick={() => setLowStockThresholdUnit(2)}
                        className={`px-2 py-1 text-2xs font-extrabold rounded-md transition-all cursor-pointer ${
                          lowStockThresholdUnit === 2
                            ? "bg-amber-600 text-white shadow-2xs"
                            : "text-amber-800 hover:text-amber-950"
                        }`}
                      >
                        كرتونة
                      </button>
                      <button
                        type="button"
                        onClick={() => setLowStockThresholdUnit(1)}
                        className={`px-2 py-1 text-2xs font-extrabold rounded-md transition-all cursor-pointer ${
                          lowStockThresholdUnit === 1
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-amber-800 hover:text-amber-950"
                        }`}
                      >
                        رزمة
                      </button>
                    </div>
                  ) : (
                    <span className="absolute left-3 text-xs font-bold text-slate-500 pointer-events-none">
                      {subUnit}
                    </span>
                  )}
                </div>
              </div>

              {/* Explanation Note */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-2xs text-amber-900 leading-relaxed font-medium">
                <span>
                  {isBoxUnit
                    ? lowStockThresholdUnit === 2
                      ? `إذا انخفض رصيد المخزن إلى ${parsedThreshold.toLocaleString()} كرتونة أو أقل، سيظهر الصنف كمنخفض المخزون.`
                      : `إذا انخفض رصيد المخزن إلى ${parsedThreshold.toLocaleString()} رزمة أو أقل، سيظهر الصنف كمنخفض المخزون.`
                    : `إذا انخفض رصيد الصنف إلى ${parsedThreshold.toLocaleString()} ${subUnit} أو أقل، سيظهر الصنف كمنخفض المخزون.`}
                </span>
                {isBoxUnit && lowStockThresholdUnit === 2 && parsedThreshold > 0 && parsedUnitsPer > 0 && (
                  <div className="mt-1 font-bold text-amber-800">
                    أي ما يعادل {(parsedThreshold * parsedUnitsPer).toLocaleString()} رزمة إجمالاً.
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsThresholdModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  تأكيد وحفظ الحد
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default ProductForm;
