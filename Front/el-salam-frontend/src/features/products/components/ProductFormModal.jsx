import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  PackagePlus, 
  Edit, 
  Tag, 
  Layers, 
  MapPin, 
  Info, 
  Box, 
  AlertCircle, 
  Loader2, 
  AlertTriangle,
  BookOpen,
  FileText,
  Sparkles,
  Check
} from "lucide-react";
import { validateProduct } from "../schemas/productSchema";
import { getCategoriesLookup } from "../../categories/services/categoryService";
import { getProductUnitTypes, DEFAULT_PRODUCT_UNIT_TYPES } from "../services/productService";
import { UnitSelect } from "../../../components/common/UnitSelect";

export function ProductFormModal({ isOpen, onClose, onSave, initialData, categories = [] }) {
  const isEdit = Boolean(initialData);

  // التاب النشط: 'notebooks' (كراسات وكشاكيل) أو 'paper' (ورق تصوير)
  const [activeTab, setActiveTab] = useState(() => {
    if (initialData?.unitType === 3) return "paper";
    return "notebooks";
  });

  const [categoriesList, setCategoriesList] = useState(categories);
  const [loadingCategories, setLoadingCategories] = useState(categories.length === 0);
  const [unitTypesList, setUnitTypesList] = useState(DEFAULT_PRODUCT_UNIT_TYPES);

  const [name, setName] = useState(initialData?.name || "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || categories[0]?.id || "");
  const [unitType, setUnitType] = useState(initialData?.unitType ?? 1);
  const [unitsPerBaseUnit, setUnitsPerBaseUnit] = useState(
    (initialData?.unitsPerBaseUnit ?? (initialData?.unitType === 3 ? 5 : initialData?.unitType === 2 ? 20 : 10)).toString()
  );

  // الرقم الذي يكتبه المستخدم في خانة الرصيد (في حالة الإضافة فقط)
  const [initialStock, setInitialStock] = useState("");
  const [initialStockUnit, setInitialStockUnit] = useState(initialData?.unitType === 3 ? 2 : 1);

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

  const [storageLocation, setStorageLocation] = useState(
    initialData?.storageLocation || ""
  );

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // فحص هل الفئة تنتمي لورق التصوير
  const isPaperCategory = (cat) => {
    if (!cat) return false;
    const n = (cat.name || "").trim().toLowerCase();
    return n.includes("ورق") || n.includes("تصوير");
  };

  // الفئات المصفاة المعروضة حسب التاب المختار
  const displayedCategories = useMemo(() => {
    if (activeTab === "paper") {
      const paperCats = categoriesList.filter(isPaperCategory);
      return paperCats.length > 0 ? paperCats : categoriesList;
    } else {
      const notebookCats = categoriesList.filter((c) => !isPaperCategory(c));
      return notebookCats.length > 0 ? notebookCats : categoriesList;
    }
  }, [categoriesList, activeTab]);

  // جلب الفئات وأنواع الوحدات من الـ Backend عند فتح النافذة
  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;

    // جلب أنواع الوحدات المدعومة من الباك اند
    getProductUnitTypes()
      .then((types) => {
        if (!ignore && Array.isArray(types) && types.length > 0) {
          setUnitTypesList(types);
        }
      })
      .catch((err) => {
        console.error("فشل في تحميل أنواع الوحدات:", err);
      });

    // جلب الفئات
    getCategoriesLookup()
      .then((data) => {
        if (!ignore && Array.isArray(data) && data.length > 0) {
          setCategoriesList(data);
          setCategoryId((prev) => {
            if (prev && data.some((c) => c.id === prev)) return prev;
            if (initialData?.categoryId) return initialData.categoryId;
            if (activeTab === "paper") {
              const paperCat = data.find(isPaperCategory);
              return paperCat ? paperCat.id : data[0].id;
            } else {
              const notebookCat = data.find((c) => !isPaperCategory(c));
              return notebookCat ? notebookCat.id : data[0].id;
            }
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
  }, [isOpen, initialData]);

  // مزامنة الحقول عند فتح نافذة التعديل أو الإضافة
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setName(initialData.name || "");
      setCategoryId(initialData.categoryId || "");
      const uType = initialData.unitType ?? 1;
      setUnitType(uType);
      setActiveTab(uType === 3 ? "paper" : "notebooks");
      setUnitsPerBaseUnit((initialData.unitsPerBaseUnit ?? (uType === 3 ? 5 : uType === 2 ? 20 : 10)).toString());
      setLowStockThreshold(initialData.lowStockThreshold != null ? String(initialData.lowStockThreshold) : uType === 3 ? "50" : "1000");
      setLowStockThresholdUnit(initialData.lowStockThresholdUnit ?? (uType === 3 ? 2 : 1));
      setStorageLocation(initialData.storageLocation || "");
      setErrors({});
    } else {
      // وضع إضافة جديد: إذا كان التاب ورق تصوير نضبط الإعدادات الافتراضية للورق
      if (activeTab === "paper") {
        setUnitType(3);
        setUnitsPerBaseUnit("5");
        setInitialStockUnit(2);
        setLowStockThreshold("50");
        setLowStockThresholdUnit(2);
        const paperCat = categoriesList.find(isPaperCategory);
        if (paperCat) setCategoryId(paperCat.id);
      } else {
        setUnitType(1);
        setUnitsPerBaseUnit("1");
        setInitialStockUnit(1);
        setLowStockThreshold("1000");
        setLowStockThresholdUnit(1);
        const notebookCat = categoriesList.find((c) => !isPaperCategory(c));
        if (notebookCat) setCategoryId(notebookCat.id);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // تحديد مواصفات نوع المنتج النشط
  const activeProfile =
    unitTypesList.find((u) => u.unitType === Number(unitType)) ||
    unitTypesList[0] ||
    DEFAULT_PRODUCT_UNIT_TYPES[0];

  const baseUnit = activeProfile.baseUnit;
  const subUnit = activeProfile.subUnit;
  const isBoxUnit = Number(unitType) === 3;
  const entryUnit = activeProfile.entryUnit; // 1 = SubUnit | 2 = BaseUnit

  // أنواع المنتجات المتاحة للاختيار في الكشاكيل/الكراريس
  const notebookUnitTypes = unitTypesList.filter((u) => u.unitType === 1 || u.unitType === 2);

  // التبديل الذكي بين تابي (كراسات وكشاكيل) و (ورق تصوير)
  const handleTabSwitch = (tab) => {
    if (isEdit) return; // في التعديل نوع الصنف ثابت لمنع تعارض الأرصدة
    setActiveTab(tab);
    setErrors({});

    if (tab === "paper") {
      setUnitType(3);
      setUnitsPerBaseUnit("5");
      setInitialStockUnit(2); // افتراضي بالكرتونة
      setLowStockThresholdUnit(2); // بالكرتونة
      setLowStockThreshold("50");

      const paperCat = categoriesList.find(isPaperCategory);
      if (paperCat) {
        setCategoryId(paperCat.id);
      }
    } else {
      // كراسات وكشاكيل: افتراضياً كشكول
      setUnitType(1);
      setUnitsPerBaseUnit("1");
      setInitialStockUnit(1);
      setLowStockThresholdUnit(1);
      setLowStockThreshold("1000");

      const notebookCat = categoriesList.find((c) => !isPaperCategory(c));
      if (notebookCat) {
        setCategoryId(notebookCat.id);
      }
    }
  };

  // تغيير نوع المنتج داخل تاب الكشاكيل والكراريس
  const handleNotebookUnitChange = (newTypeVal) => {
    const newType = Number(newTypeVal);
    setUnitType(newType);
    if (errors.unitType) setErrors((prev) => ({ ...prev, unitType: null }));

    setInitialStockUnit(1);
    setLowStockThresholdUnit(1);
    setUnitsPerBaseUnit("1");
    if (!lowStockThreshold || lowStockThreshold === "50") setLowStockThreshold("1000");

    // توجيه الفئة تلقائياً إن وجدت
    if (newType === 2) {
      const krasCat = categoriesList.find((c) => (c.name || "").toLowerCase().includes("كراس"));
      if (krasCat) setCategoryId(krasCat.id);
    } else if (newType === 1) {
      const kashkolCat = categoriesList.find((c) => (c.name || "").toLowerCase().includes("كشكول"));
      if (kashkolCat) setCategoryId(kashkolCat.id);
    }
  };

  // اختيار الفئة مع التوجيه التلقائي لنوع المنتج (كراس / كشكول)
  const handleCategorySelect = (selectedId) => {
    setCategoryId(selectedId);
    if (errors.categoryId) setErrors((prev) => ({ ...prev, categoryId: null }));

    if (activeTab === "notebooks") {
      const selectedCat = categoriesList.find((c) => c.id === selectedId);
      if (selectedCat) {
        const catName = (selectedCat.name || "").toLowerCase();
        if (catName.includes("كراس") && Number(unitType) !== 2) {
          setUnitType(2);
        } else if (catName.includes("كشكول") && Number(unitType) !== 1) {
          setUnitType(1);
        }
      }
    }
  };

  const handleNameInput = (val) => {
    setName(val);
    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
  };

  // الحسابات الحية للعرض في الفورم فقط
  const parsedUnitsPer = Number(unitsPerBaseUnit) || 0;
  const parsedInitialStock = Number(initialStock) || 0;

  // 1) في حالة entryUnit = 1 (كشكول أو كراس):
  const fullPacks = parsedUnitsPer > 0 ? Math.floor(parsedInitialStock / parsedUnitsPer) : 0;
  const restPieces = parsedUnitsPer > 0 ? parsedInitialStock % parsedUnitsPer : 0;

  // 2) في حالة entryUnit = 2 (كرتونة ورق):
  const totalReams = parsedInitialStock * parsedUnitsPer;

  const parsedThreshold = Number(lowStockThreshold) || 0;
  const thresholdUnit = isBoxUnit ? Number(lowStockThresholdUnit) : 1;

  const getContentLabel = () => `عدد ${subUnit} في ${baseUnit}`;

  const getContentExample = () => {
    if (isBoxUnit) return "مثال: 5 رزم في الكرتونة";
    if (activeProfile.unitType === 2) return "كراس فردي";
    return "كشكول فردي";
  };

  const getStockLabel = () => {
    if (isBoxUnit) {
      return "الرصيد الافتتاحي بالمستودع";
    }
    return `عدد ${subUnit} (الرصيد الافتتاحي)`;
  };

  const getStockPlaceholder = () => {
    if (isBoxUnit) {
      return initialStockUnit === 2 ? "مثال: 50" : "مثال: 250";
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

    const finalUnitsPer = isBoxUnit ? (parsedUnitsPer || 5) : 1;
    const finalUnitType = activeTab === "paper" ? 3 : Number(unitType);
    const finalCategoryId = categoryId || (activeTab === "paper" ? categoriesList.find(isPaperCategory)?.id : displayedCategories[0]?.id) || categoriesList[0]?.id;

    const formData = isEdit
      ? {
          name: name.trim(),
          categoryId: finalCategoryId,
          unitType: finalUnitType,
          unitsPerBaseUnit: finalUnitsPer,
          storageLocation: storageLocation.trim() || null,
          lowStockThreshold: parsedThreshold,
          lowStockThresholdUnit: thresholdUnit,
        }
      : {
          name: name.trim(),
          categoryId: finalCategoryId,
          unitType: finalUnitType,
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
      await onSave(formData);
      onClose();
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

  const paperCategoryObject = categoriesList.find((c) => c.id === categoryId) || categoriesList.find(isPaperCategory);

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-xl max-h-[calc(100dvh-2rem)] sm:max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                isEdit 
                  ? "bg-blue-100/80 text-blue-700" 
                  : activeTab === "paper" 
                  ? "bg-emerald-100/90 text-emerald-700" 
                  : "bg-blue-100/90 text-blue-700"
              }`}
            >
              {isEdit ? (
                <Edit className="w-5 h-5" />
              ) : activeTab === "paper" ? (
                <FileText className="w-5 h-5" />
              ) : (
                <PackagePlus className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                {isEdit
                  ? "تعديل بيانات المنتج"
                  : activeTab === "paper"
                  ? "إضافة صنف ورق تصوير جديد"
                  : "إضافة صنف كراس أو كشكول جديد"}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {isEdit
                  ? "تعديل مواصفات الصنف وحد تنبيه النواقص ومكان التخزين"
                  : activeTab === "paper"
                  ? "تسجيل ورق التصوير بالكرتونة والرزم والرصيد وحد التنبيه"
                  : "تسجيل الكراس أو الكشكول بالعدد الفردي والرصيد وحد التنبيه"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="p-4 sm:p-6 space-y-4 text-right flex-1 overflow-y-auto">
            {/* التابات العلوية الذكية لاختيار العائلة (كراسات وكشاكيل أو ورق تصوير) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  نوع الصنف المطلوب إضافته:
                </span>
                {isEdit && (
                  <span className="text-2xs text-slate-500 font-bold bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                    نوع الصنف ثابت في وضع التعديل
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/90 gap-1.5 shadow-2xs">
                {/* تاب كراسات وكشاكيل */}
                <button
                  type="button"
                  disabled={isEdit}
                  onClick={() => handleTabSwitch("notebooks")}
                  className={`flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    activeTab === "notebooks"
                      ? "bg-white text-blue-700 shadow-sm border border-blue-200/80 ring-2 ring-blue-500/15"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  } ${isEdit && activeTab !== "notebooks" ? "opacity-35 cursor-not-allowed" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                    activeTab === "notebooks" ? "bg-blue-600 text-white shadow-xs" : "bg-slate-200 text-slate-600"
                  }`}>
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <div className="leading-tight font-extrabold">كراسات وكشاكيل</div>
                    <div className="text-2xs font-medium text-slate-400">بالواحدة (كشكول / كراس)</div>
                  </div>
                </button>

                {/* تاب ورق تصوير */}
                <button
                  type="button"
                  disabled={isEdit}
                  onClick={() => handleTabSwitch("paper")}
                  className={`flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    activeTab === "paper"
                      ? "bg-white text-emerald-700 shadow-sm border border-emerald-200/80 ring-2 ring-emerald-500/15"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  } ${isEdit && activeTab !== "paper" ? "opacity-35 cursor-not-allowed" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                    activeTab === "paper" ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-200 text-slate-600"
                  }`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <div className="leading-tight font-extrabold">ورق تصوير</div>
                    <div className="text-2xs font-medium text-slate-400">بالكرتونة والرزمة</div>
                  </div>
                </button>
              </div>
            </div>

            {hasNoCategories && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>تنبيه: لا توجد فئات مسجلة في قاعدة البيانات بعد. يرجى إضافة فئة من صفحة الفئات أولاً.</span>
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
                <Box className={`w-3.5 h-3.5 ${activeTab === "paper" ? "text-emerald-600" : "text-blue-600"}`} />
                اسم المنتج أو الصنف <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameInput(e.target.value)}
                placeholder={
                  activeTab === "paper" 
                    ? "مثال: كرتونة ورق تصوير A4 وزن 80 جم (5 رزم)" 
                    : unitType === 2
                    ? "مثال: كراس 28 ورقة مسطر عادي"
                    : "مثال: كشكول مدرسي مسطر 60 ورقة دبوس"
                }
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white transition-colors font-medium ${
                  errors.name ? "border-rose-400 focus:border-rose-500 bg-rose-50/30" : "border-slate-200 focus:border-slate-800"
                }`}
              />
              {errors.name && <p className="text-xs text-rose-500 font-bold mt-1">{errors.name}</p>}
            </div>

            {/* فئة المنتج ونوع المنتج */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* فئة المنتج */}
              {activeTab === "paper" ? (
                /* في ورق التصوير: الفئة محددة تلقائياً كـ ورق تصوير */
                <div>
                  <div className="flex items-center mb-1.5 h-5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      فئة المنتج <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  {displayedCategories.length > 1 ? (
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full h-10 px-3.5 text-xs sm:text-sm bg-emerald-50/50 border border-emerald-300 rounded-xl text-emerald-950 focus:outline-none focus:border-emerald-600 cursor-pointer font-bold"
                    >
                      {displayedCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full h-10 px-3.5 text-xs sm:text-sm bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900 font-extrabold flex items-center justify-between whitespace-nowrap">
                      <span className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">{paperCategoryObject?.name || "ورق تصوير"}</span>
                      </span>
                      <span className="text-2xs text-emerald-600 font-medium shrink-0">فئة ورق التصوير</span>
                    </div>
                  )}
                  {errors.categoryId && <p className="text-xs text-rose-500 font-bold mt-1">{errors.categoryId}</p>}
                </div>
              ) : (
                /* في الكشاكيل والكراريس: إظهار الفئات المرتبطة بالكشاكيل والكراريس فقط بدون ورق التصوير */
                <div>
                  <div className="flex items-center justify-between mb-1.5 h-5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      فئة المنتج <span className="text-rose-500">*</span>
                    </label>
                    {loadingCategories && (
                      <span className="text-2xs text-blue-600 font-bold flex items-center gap-1 shrink-0">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        تحميل...
                      </span>
                    )}
                  </div>
                  <select
                    value={categoryId}
                    disabled={loadingCategories || hasNoCategories}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                    className={`w-full h-10 px-3.5 text-xs sm:text-sm bg-slate-50 border rounded-xl text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer font-bold ${
                      errors.categoryId ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                    }`}
                  >
                    {loadingCategories ? (
                      <option value="">جاري تحميل الفئات...</option>
                    ) : hasNoCategories ? (
                      <option value="">لا توجد فئات متاحة</option>
                    ) : (
                      displayedCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    )}
                  </select>
                  {errors.categoryId && <p className="text-xs text-rose-500 font-bold mt-1">{errors.categoryId}</p>}
                </div>
              )}

              {/* نوع المنتج ووحدة القياس */}
              {activeTab === "paper" ? (
                /* في ورق التصوير: نوع الصنف مثبت بالكرتونة والرزمة بدون الحاجة للاختيار وبنفس حجم الفئة تماماً */
                <div>
                  <div className="flex items-center mb-1.5 h-5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      نوع المنتج <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <div className="w-full h-10 px-3.5 text-xs sm:text-sm bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900 font-extrabold flex items-center justify-between whitespace-nowrap">
                    <span className="flex items-center gap-2 shrink-0">
                      <Box className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>ورق تصوير</span>
                    </span>
                    <span className="text-2xs font-bold text-emerald-700 bg-white/90 px-2.5 py-0.5 rounded-md border border-emerald-200/80 shadow-2xs shrink-0">
                      كرتونة
                    </span>
                  </div>
                </div>
              ) : (
                /* في الكشاكيل والكراريس: اختيار بين كشكول أو كراس */
                <div>
                  <div className="flex items-center justify-between mb-1.5 h-5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      نوع المنتج <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <select
                    value={unitType}
                    onChange={(e) => handleNotebookUnitChange(e.target.value)}
                    className="w-full h-10 px-3.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer font-bold"
                  >
                    {notebookUnitTypes.map((opt) => (
                      <option key={opt.unitType} value={opt.unitType}>
                        {opt.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* محتوى الوحدة والرصيد الافتتاحي */}
            <div className={`grid ${isBoxUnit && !isEdit ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-4`}>
              {/* محتوى الكرتونة: يظهر فقط لورق التصوير */}
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
                    <p className="text-2xs text-slate-400 mt-1">المعتاد في مصانع الورق: 5 رزم في الكرتونة</p>
                  )}
                </div>
              )}

              {/* خانة الرصيد الافتتاحي: تظهر فقط عند إضافة منتج جديد (في التعديل لا يوجد رصيد) */}
              {!isEdit && (
                <div>
                  <div className="flex items-center justify-between mb-1.5 h-5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Layers className={`w-3.5 h-3.5 ${isBoxUnit ? "text-emerald-600" : "text-blue-600"}`} />
                      {getStockLabel()}
                    </label>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="0"
                      value={initialStock}
                      onChange={(e) => {
                        setInitialStock(e.target.value);
                        if (errors.initialStock) setErrors((prev) => ({ ...prev, initialStock: null }));
                      }}
                      placeholder={getStockPlaceholder()}
                      className={`w-full h-10 px-3.5 ${isBoxUnit ? "pl-28" : "pl-16"} text-xs sm:text-sm font-bold bg-slate-50 border rounded-xl focus:outline-none focus:bg-white transition-colors ${
                        errors.initialStock ? "border-rose-400 focus:border-rose-500 bg-rose-50/30" : "border-slate-200 focus:border-slate-800"
                      }`}
                    />
                    {isBoxUnit ? (
                      <div className="absolute left-1.5 inset-y-1.5 flex items-center">
                        <UnitSelect
                          value={initialStockUnit}
                          onChange={(val) => setInitialStockUnit(val)}
                          theme="emerald"
                          options={[
                            { value: 2, label: "كرتونة" },
                            { value: 1, label: "رزمة" },
                          ]}
                        />
                      </div>
                    ) : (
                      <span className="absolute left-3 text-xs font-bold text-slate-400 pointer-events-none">
                        {subUnit}
                      </span>
                    )}
                  </div>
                  {errors.initialStock ? (
                    <p className="text-xs text-rose-500 font-bold mt-1">{errors.initialStock}</p>
                  ) : (
                    <p className="text-2xs text-slate-400 mt-1">{getStockHint()}</p>
                  )}
                </div>
              )}
            </div>

            {/* المربع الأخضر وشريط المعادلة: عرض فوري لورق التصوير في الإضافة فقط */}
            {!isEdit && isBoxUnit && (
              <>
                {/* المربع الأخضر */}
                <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200/80 flex items-center justify-between text-xs font-bold shadow-2xs">
                  <span className="text-emerald-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {initialStockUnit === 2
                      ? "إجمالي الرزم المحسوبة تلقائياً:"
                      : "الرصيد المحسوب بالكرتونة تلقائياً:"}
                  </span>
                  <span className="text-emerald-950 font-extrabold text-xs sm:text-sm bg-white/90 px-2.5 py-1 rounded-lg border border-emerald-200/70 shadow-2xs">
                    {initialStockUnit === 2
                      ? `${(parsedInitialStock * parsedUnitsPer).toLocaleString()} رزمة`
                      : parsedUnitsPer === 0 || parsedInitialStock === 0
                      ? `0 كرتونة`
                      : restPieces > 0
                      ? `${fullPacks} كرتونة و ${restPieces} رزمة`
                      : `${fullPacks} كرتونة`}
                  </span>
                </div>

                {/* شريط المعادلة */}
                <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                  <span className="text-blue-800 font-medium">معادلة الاحتساب:</span>
                  <span className="font-bold text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
                    {initialStockUnit === 2
                      ? `${parsedInitialStock.toLocaleString()} كرتونة × ${parsedUnitsPer} رزمة = ${(parsedInitialStock * parsedUnitsPer).toLocaleString()} رزمة`
                      : parsedInitialStock > 0 && parsedUnitsPer > 0
                      ? `${parsedInitialStock.toLocaleString()} رزمة ÷ ${parsedUnitsPer} = ${(parsedInitialStock / parsedUnitsPer).toFixed(2).replace(/\.00$/, "")} كرتونة (${fullPacks} كرتونة${restPieces > 0 ? ` و ${restPieces} رزمة` : ""})`
                      : `كل 1 كرتونة = ${parsedUnitsPer || 0} رزمة`}
                  </span>
                </div>
              </>
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

            {/* مكان التخزين بالمستودع */}
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
              <p className="text-2xs text-slate-400 mt-1">
                تحديد الرصة أو العنبر لتسهيل الوصول للصنف داخل المخزن
              </p>
            </div>
          </div>

          {/* Footer Buttons (Fixed outside scrollable body, never overlaps) */}
          <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0 bg-slate-50/90 shadow-2xs">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting || hasNoCategories}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${
                activeTab === "paper" 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : "bg-slate-900 hover:bg-slate-800"
              }`}
            >
              {submitting ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : activeTab === "paper" ? "إضافة ورق التصوير" : "إضافة المنتج"}
            </button>
          </div>
        </form>

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
                    <div className="absolute left-1.5 inset-y-1.5 flex items-center">
                      <UnitSelect
                        value={lowStockThresholdUnit}
                        onChange={(val) => setLowStockThresholdUnit(val)}
                        theme="amber"
                        options={[
                          { value: 2, label: "كرتونة" },
                          { value: 1, label: "رزمة" },
                        ]}
                      />
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
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
}

export default ProductFormModal;