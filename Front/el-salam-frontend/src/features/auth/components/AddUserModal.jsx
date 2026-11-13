import { useState } from "react";
import { 
  X, 
  UserPlus, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Check 
} from "lucide-react";
import { authService } from "../services/authService";
import { validateCreateUser } from "../schemas/authSchemas";
import { showSuccess, showError } from "../../../utils/alertUtils";

/**
 * مودال إضافة حساب موظف جديد (مع التحقق الشامل عبر Zod)
 */
export function AddUserModal({ isOpen, onClose, onUserCreated }) {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "WarehouseKeeper",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateCreateUser(formData);
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await authService.createUser({
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        middleName: formData.middleName ? formData.middleName.trim() : null,
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber ? formData.phoneNumber.trim() : null,
        role: formData.role,
      });

      showSuccess(
        "تم إنشاء الحساب بنجاح",
        `تم تسجيل حساب الموظف (${formData.firstName} ${formData.lastName}) بنجاح ويمكنه الآن تسجيل الدخول للنظام.`
      );

      // تصفير النموذج والإغلاق
      setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        role: "WarehouseKeeper",
        password: "",
        confirmPassword: "",
      });

      if (onUserCreated) onUserCreated();
      onClose();
    } catch (err) {
      showError("تعذر إنشاء الحساب", err.message || "حدث خطأ غير متوقع أثناء إنشاء حساب الموظف");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl max-h-[calc(100dvh-2rem)] sm:max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        dir="rtl"
      >
        {/* رأس المودال */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xs text-blue-300">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">إضافة حساب موظف جديد</h3>
              <p className="text-2xs text-blue-200/80 mt-0.5">
                أدخل بيانات الموظف وعيّن دوره الوظيفي في المستودع
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* نموذج الإدخال */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* الاسم الأول والأوسط واسم العائلة */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-2xs font-bold text-slate-700 mb-1">
                الاسم الأول <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="محمد"
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden transition-all ${
                    errors.firstName ? "border-rose-400 ring-2 ring-rose-100" : "border-slate-200 focus:border-blue-500"
                  }`}
                />
              </div>
              {errors.firstName && (
                <p className="text-3xs text-rose-500 mt-1 font-bold">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-2xs font-bold text-slate-700 mb-1">
                الاسم الأوسط <span className="text-slate-400 font-normal">(اختياري)</span>
              </label>
              <input
                type="text"
                value={formData.middleName}
                onChange={(e) => handleChange("middleName", e.target.value)}
                placeholder="أحمد"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-2xs font-bold text-slate-700 mb-1">
                اسم العائلة <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="علي"
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden transition-all ${
                  errors.lastName ? "border-rose-400 ring-2 ring-rose-100" : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {errors.lastName && (
                <p className="text-3xs text-rose-500 mt-1 font-bold">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* البريد الإلكتروني ورقم الهاتف */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-bold text-slate-700 mb-1">
                البريد الإلكتروني <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  dir="ltr"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="employee@elsalam.com"
                  className={`w-full pr-8 pl-3 py-2 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden transition-all text-left ${
                    errors.email ? "border-rose-400 ring-2 ring-rose-100" : "border-slate-200 focus:border-blue-500"
                  }`}
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
              {errors.email && (
                <p className="text-3xs text-rose-500 mt-1 font-bold">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-2xs font-bold text-slate-700 mb-1">
                رقم الهاتف <span className="text-slate-400 font-normal">(اختياري)</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  dir="ltr"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange("phoneNumber", e.target.value)}
                  placeholder="01012345678"
                  className={`w-full pr-8 pl-3 py-2 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden transition-all text-left ${
                    errors.phoneNumber ? "border-rose-400 ring-2 ring-rose-100" : "border-slate-200 focus:border-blue-500"
                  }`}
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
              {errors.phoneNumber && (
                <p className="text-3xs text-rose-500 mt-1 font-bold">{errors.phoneNumber}</p>
              )}
            </div>
          </div>

          {/* الدور الوظيفي */}
          <div>
            <label className="block text-2xs font-bold text-slate-700 mb-1.5">
              الدور الوظيفي <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => handleChange("role", "WarehouseKeeper")}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  formData.role === "WarehouseKeeper"
                    ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20"
                    : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${formData.role === "WarehouseKeeper" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">أمين مخزن</p>
                    <p className="text-3xs text-slate-500">حركات الأصناف والمخزن</p>
                  </div>
                </div>
                {formData.role === "WarehouseKeeper" && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </div>

              <div
                onClick={() => handleChange("role", "Admin")}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  formData.role === "Admin"
                    ? "bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20"
                    : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${formData.role === "Admin" ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">مدير نظام</p>
                    <p className="text-3xs text-slate-500">كامل صلاحيات الإدارة</p>
                  </div>
                </div>
                {formData.role === "Admin" && (
                  <Check className="w-4 h-4 text-purple-600" />
                )}
              </div>
            </div>
            {errors.role && (
              <p className="text-3xs text-rose-500 mt-1 font-bold">{errors.role}</p>
            )}
          </div>

          {/* كلمة المرور وتأكيد كلمة المرور */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-2xs font-bold text-slate-700 mb-1">
                كلمة المرور <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  dir="ltr"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pr-8 pl-8 py-2 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden transition-all text-left ${
                    errors.password ? "border-rose-400 ring-2 ring-rose-100" : "border-slate-200 focus:border-blue-500"
                  }`}
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-3xs text-rose-500 mt-1 font-bold">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-2xs font-bold text-slate-700 mb-1">
                تأكيد كلمة المرور <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  dir="ltr"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pr-8 pl-3 py-2 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden transition-all text-left ${
                    errors.confirmPassword ? "border-rose-400 ring-2 ring-rose-100" : "border-slate-200 focus:border-blue-500"
                  }`}
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
              {errors.confirmPassword && (
                <p className="text-3xs text-rose-500 mt-1 font-bold">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="pt-3 pb-2 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0 sticky bottom-0 bg-white/95 backdrop-blur-xs z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 shadow-xs">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري إنشاء الحساب...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>إنشاء الحساب</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddUserModal;

