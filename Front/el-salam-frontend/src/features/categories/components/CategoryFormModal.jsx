import { useState } from "react";
import { X, FolderPlus, Edit, Tag, Palette, FileText, AlertCircle, Check } from "lucide-react";
import { validateCategory } from "../schemas/categorySchema";

const PRESET_COLORS = [
  { label: "أزرق", hex: "#2563EB", bg: "bg-blue-600" },
  { label: "أخضر", hex: "#10B981", bg: "bg-emerald-600" },
  { label: "بنفسجي", hex: "#8B5CF6", bg: "bg-purple-600" },
  { label: "برتقالي", hex: "#F59E0B", bg: "bg-amber-500" },
  { label: "وردي", hex: "#F43F5E", bg: "bg-rose-500" },
  { label: "رمادي", hex: "#64748B", bg: "bg-slate-500" },
  { label: "نيلي", hex: "#4F46E5", bg: "bg-indigo-600" },
  { label: "تركواز", hex: "#06B6D4", bg: "bg-cyan-500" },
];

export function CategoryFormModal({ isOpen, onClose, onSave, initialData }) {
  const [name, setName] = useState(initialData?.name || "");
  const [colorHex, setColorHex] = useState(
    initialData?.colorHex || initialData?.color || "#2563EB"
  );
  const [description, setDescription] = useState(initialData?.description || "");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(initialData);

  if (!isOpen) return null;

  const handleNameChange = (val) => {
    setName(val);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handleColorChange = (hex) => {
    setColorHex(hex);
    if (errors.colorHex) {
      setErrors((prev) => ({ ...prev, colorHex: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // تشغيل الفاليديشن باستخدام Zod ومطابقة شروط الـ Backend
    const validation = validateCategory(
      {
        id: initialData?.id,
        name,
        colorHex,
        description,
      },
      isEdit
    );

    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      await onSave({
        name: validation.data.name,
        colorHex: validation.data.colorHex,
        description: validation.data.description || "",
      });
      onClose();
    } catch (err) {
      setErrors({ form: err.message || "فشلت عملية الحفظ" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-lg max-h-[calc(100dvh-2rem)] sm:max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs text-white"
              style={{ backgroundColor: colorHex }}
            >
              {isEdit ? <Edit className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                {isEdit ? "تعديل بيانات الفئة" : "إضافة فئة وتصنيف جديد"}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {isEdit ? `تعديل: ${initialData.name}` : "تسجيل الفئة واللون المميز متوافق مع نظام المخزن"}
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-right flex-1 overflow-y-auto">
          {errors.form && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* اسم الفئة */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                اسم الفئة <span className="text-rose-500">*</span>
              </span>
              <span className="text-2xs font-semibold text-slate-400 font-mono">
                {name.length}/100
              </span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="مثال: كشاكيل مدرسية، كشاكيل سلك، ورق طباعة وتصوير..."
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none transition-colors ${
                errors.name
                  ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                  : "border-slate-200 focus:border-slate-800 focus:bg-white"
              }`}
            />
            {errors.name && (
              <p className="text-2xs font-bold text-rose-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.name}
              </p>
            )}
          </div>

          {/* لون التمييز */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-slate-400" />
                لون التمييز (ColorHex) <span className="text-rose-500">*</span>
              </span>
              <span className="text-2xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                {colorHex.toUpperCase()}
              </span>
            </label>

            {/* ألوان جاهزة منتقاة */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {PRESET_COLORS.map((c) => {
                  const isSelected = colorHex.toLowerCase() === c.hex.toLowerCase();
                  return (
                    <button
                      type="button"
                      key={c.hex}
                      onClick={() => handleColorChange(c.hex)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? "ring-3 ring-offset-2 ring-slate-800 scale-110 shadow-xs"
                          : "opacity-75 hover:opacity-100 hover:scale-105"
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={`${c.label} (${c.hex})`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-xs" />}
                    </button>
                  );
                })}

                {/* Color Picker حر مخصص */}
                <div className="relative flex items-center">
                  <input
                    type="color"
                    id="customColor"
                    value={colorHex}
                    onChange={(e) => handleColorChange(e.target.value.toUpperCase())}
                    className="w-7 h-7 rounded-full border border-slate-300 p-0 cursor-pointer overflow-hidden opacity-0 absolute inset-0 z-10"
                    title="اختيار لون مخصص..."
                  />
                  <div
                    className="w-7 h-7 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center hover:border-slate-600 transition-colors cursor-pointer"
                    style={{ backgroundColor: colorHex }}
                    title="اختيار لون مخصص..."
                  >
                    <Palette className="w-3.5 h-3.5 text-white mix-blend-difference" />
                  </div>
                </div>
              </div>

              {/* حقل إدخال مباشر لكود HEX */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 text-xs">
                <span className="text-slate-500 font-medium">كود اللون:</span>
                <input
                  type="text"
                  maxLength={7}
                  value={colorHex}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder="#2563EB"
                  className="px-2.5 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 w-28 uppercase"
                />
                <span className="text-2xs text-slate-400">تنسيق: #RRGGBB</span>
              </div>
            </div>

            {errors.colorHex && (
              <p className="text-2xs font-bold text-rose-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.colorHex}
              </p>
            )}
          </div>

          {/* وصف الفئة */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                وصف الفئة <span className="text-2xs font-normal text-slate-400">(اختياري)</span>
              </span>
              <span className="text-2xs font-semibold text-slate-400 font-mono">
                {description.length}/500
              </span>
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر لمواصفات وتفاصيل هذه الفئة بالمخزن (اختياري)..."
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none transition-colors resize-none ${
                errors.description
                  ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                  : "border-slate-200 focus:border-slate-800 focus:bg-white"
              }`}
            />
            {errors.description && (
              <p className="text-2xs font-bold text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 pb-2 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0 sticky bottom-0 bg-white/95 backdrop-blur-xs z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 shadow-xs">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {submitting ? "جاري التحقق والحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة الفئة"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
