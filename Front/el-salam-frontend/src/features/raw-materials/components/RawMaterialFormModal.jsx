import { useState } from "react";
import { X, Layers, Edit } from "lucide-react";
import { validateRawMaterial } from "../schemas/rawMaterialSchema";

export function RawMaterialFormModal({ isOpen, onClose, onSave, initialData }) {
  const [name, setName] = useState(initialData?.name || "");
  const [code, setCode] = useState(initialData?.code || "");
  const [type, setType] = useState(initialData?.type || "رولات ورق");
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || "");
  const [unit, setUnit] = useState(initialData?.unit || "طن");
  const [supplier, setSupplier] = useState(initialData?.supplier || "");
  const [minimumAlert, setMinimumAlert] = useState(initialData?.minimumAlert?.toString() || "10");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const isEdit = Boolean(initialData);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type,
      quantity: quantity === "" ? 0 : quantity,
      unit,
      supplier: supplier.trim() || undefined,
      minimumAlert: minimumAlert === "" ? 0 : minimumAlert,
    };

    const validation = validateRawMaterial(payload);
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    await onSave({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type,
      quantity: Number(quantity) || 0,
      unit,
      supplier: supplier.trim() || "مورد عام",
      minimumAlert: Number(minimumAlert) || 0,
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/40 backdrop-blur-xs select-none" dir="rtl">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl w-full max-w-xl max-h-[calc(100dvh-2rem)] sm:max-h-[90dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isEdit ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>
              {isEdit ? <Edit className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isEdit ? "تعديل خامة الإنتاج" : "إضافة رول ورق / مادة خام جديدة"}
              </h3>
              <p className="text-2xs font-medium text-slate-400">
                {isEdit ? `تعديل بيانات: ${initialData.name}` : "تسجيل مواصفات وكميات الخامات بمستودع المصنع"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                اسم الخامة / الصنف <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                }}
                placeholder="مثال: رول ورق أبيض 70 جم (عرض 70 سم)"
                className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:bg-white transition-colors ${
                  errors.name ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-slate-800"
                }`}
              />
              {errors.name && <p className="text-3xs text-rose-600 font-bold mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                كود الخامة في النظام <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (errors.code) setErrors((prev) => ({ ...prev, code: null }));
                }}
                placeholder="مثال: RM-W70-01"
                className={`w-full px-3 py-2 text-sm font-mono uppercase bg-slate-50 border rounded-lg focus:outline-none focus:bg-white transition-colors text-right ${
                  errors.code ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-slate-800"
                }`}
              />
              {errors.code && <p className="text-3xs text-rose-600 font-bold mt-1">{errors.code}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع الخامة</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-2.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer"
              >
                <option value="رولات ورق">رولات ورق أبيض</option>
                <option value="ورق غلاف">ورق غلاف كوشيه</option>
                <option value="أسلاك وسوست">أسلاك وسوست تجليد</option>
                <option value="كرتون ومواد تعبئة">تعبئة وتغليف</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الكمية بالمخزن</label>
              <input
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: null }));
                }}
                placeholder="0"
                className={`w-full px-3 py-2 text-sm font-mono bg-slate-50 border rounded-lg focus:outline-none focus:bg-white transition-colors ${
                  errors.quantity ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-slate-800"
                }`}
              />
              {errors.quantity && <p className="text-3xs text-rose-600 font-bold mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">وحدة القياس</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-2.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer"
              >
                <option value="طن">طن</option>
                <option value="رول">رول</option>
                <option value="فرخ / رزمة">فرخ / رزمة</option>
                <option value="كيلوجرام">كيلوجرام</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">المورد المعتمد</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="مثال: مطاحن ومصانع الورق الأهلية"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                حد الأمان والتنبيه عند النقص
              </label>
              <input
                type="number"
                min="0"
                value={minimumAlert}
                onChange={(e) => {
                  setMinimumAlert(e.target.value);
                  if (errors.minimumAlert) setErrors((prev) => ({ ...prev, minimumAlert: null }));
                }}
                className={`w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border rounded-lg focus:outline-none focus:bg-white transition-colors ${
                  errors.minimumAlert ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-slate-800"
                }`}
              />
              {errors.minimumAlert && <p className="text-3xs text-rose-600 font-bold mt-1">{errors.minimumAlert}</p>}
            </div>
          </div>

          <div className="pt-3 pb-2 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0 sticky bottom-0 bg-white/95 backdrop-blur-xs z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 shadow-xs">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {submitting ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة الخامة"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RawMaterialFormModal;
