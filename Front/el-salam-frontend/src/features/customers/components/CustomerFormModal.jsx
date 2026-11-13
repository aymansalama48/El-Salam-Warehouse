import { useState } from "react";
import { X, UserPlus, Store, Edit } from "lucide-react";
import { validateCustomer } from "../schemas/customerSchema";

export function CustomerFormModal({ isOpen, onClose, onSave, initialData }) {
  const [name, setName] = useState(initialData?.name || "");
  const [contactPerson, setContactPerson] = useState(initialData?.contactPerson || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [email, setEmail] = useState(initialData?.email && initialData.email !== "—" ? initialData.email : "");
  const [city, setCity] = useState(initialData?.city && initialData.city !== "—" ? initialData.city : "");
  const [category, setCategory] = useState(initialData?.category || "تاجر جملة معتمد");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const isEdit = Boolean(initialData);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      city: city.trim() || undefined,
      category,
    };

    const validation = validateCustomer(payload);
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    await onSave({
      name: name.trim(),
      contactPerson: contactPerson.trim() || "غير محدد",
      phone: phone.trim(),
      email: email.trim() || "—",
      city: city.trim() || "—",
      category,
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/40 backdrop-blur-xs select-none" dir="rtl">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl w-full max-w-xl max-h-[calc(100dvh-2rem)] sm:max-h-[90dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isEdit ? "bg-blue-50 text-blue-700" : "bg-blue-50 text-blue-700"}`}>
              {isEdit ? <Edit className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isEdit ? "تعديل بيانات جهة الصرف" : "تسجيل جهة صرف / عميل جديد"}
              </h3>
              <p className="text-2xs font-medium text-slate-400">
                {isEdit ? `تعديل ملف: ${initialData.name}` : "بيانات تجار الجملة، الموزعين، ومنافذ التوزيع"}
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
                اسم الجهة / التاجر <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                  }}
                  placeholder="مثال: مؤسسة الفاروق للورق"
                  className={`w-full pl-3 pr-9 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:bg-white transition-colors ${
                    errors.name ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-slate-800"
                  }`}
                />
              </div>
              {errors.name && <p className="text-3xs text-rose-600 font-bold mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الشخص المسؤول</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="مثال: أ. علاء الفاروق"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                رقم الهاتف <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
                }}
                placeholder="01xxxxxxxxx"
                className={`w-full px-3 py-2 text-sm font-mono bg-slate-50 border rounded-lg focus:outline-none focus:bg-white transition-colors text-right ${
                  errors.phone ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-slate-800"
                }`}
              />
              {errors.phone && <p className="text-3xs text-rose-600 font-bold mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الفئة التجارية</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer"
              >
                <option value="تاجر جملة معتمد">تاجر جملة معتمد</option>
                <option value="موزع إقليمي">موزع إقليمي</option>
                <option value="مكتبات تجزئة كبرى">مكتبات تجزئة كبرى</option>
                <option value="فرع توزيع داخلي">فرع توزيع / منفذ مصنع</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">المدينة أو المنطقة</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="مثال: الفجالة - القاهرة"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                }}
                placeholder="client@mail.com"
                className={`w-full px-3.5 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:bg-white transition-colors ${
                  errors.email ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-slate-800"
                }`}
              />
              {errors.email && <p className="text-3xs text-rose-600 font-bold mt-1">{errors.email}</p>}
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
              {submitting ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة العميل"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerFormModal;
