import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useSettings } from "../context/SettingsContext";
import { validateLogin } from "../features/auth/schemas/authSchemas";
import { BookCopy, Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";

/**
 * صفحة تسجيل الدخول لنظام إدارة مستودع السلام
 * مدعومة بالفاليديشن الكامل عبر مكتبة Zod
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const { settings } = useSettings();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  const from = location.state?.from?.pathname || "/";

  // لو المستخدم مسجل دخوله بالفعل، نوجهه مباشرة للرئيسية
  if (isAuthenticated) {
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // تطبيق الفاليديشن باستخدام Zod
    const validation = validateLogin({ email, password });
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || "فشل تسجيل الدخول، تأكد من صحة البيانات المدخلة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center p-4 select-none" dir="rtl">
      <div className="w-full max-w-md">
        {/* بطاقة تسجيل الدخول الرئيسية */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 sm:p-10 relative overflow-hidden">
          {/* لمسة جمالية في الخلفية */}
          <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-blue-600 via-emerald-500 to-teal-400" />

          {/* ترويسة اللوجو والترحيب */}
          <div className="text-center mb-8">
            <div className={`inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4 overflow-hidden ${
              settings?.logoUrl ? "bg-transparent" : "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
            }`}>
              {settings?.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.warehouseName || "شعار المنشأة"}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'block';
                      e.currentTarget.parentElement?.classList?.add('bg-slate-900', 'text-white', 'shadow-lg');
                    }
                  }}
                />
              ) : null}
              <BookCopy
                className="w-8 h-8 text-emerald-400"
                style={{ display: settings?.logoUrl ? 'none' : 'block' }}
              />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {settings?.warehouseName || "مصنع السلام للكراسات"}
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              {settings?.subtitle || "نظام إدارة المخازن المركزية والتشغيل (WMS)"}
            </p>
          </div>

          {/* تنبيه الخطأ العام إن وجد */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-2.5 text-rose-700 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* نموذج الدخول */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* حقل البريد الإلكتروني */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                البريد الإلكتروني للموظف
              </label>
              <div className="relative">
                <input
                  type="email"
                  dir="ltr"
                  placeholder="admin@elsalamwarehouse.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                  disabled={loading}
                  className={`w-full text-xs sm:text-sm px-3.5 py-2.5 pr-10 border rounded-xl outline-none text-left placeholder:text-right placeholder:text-slate-300 transition-all disabled:bg-slate-50 ${
                    errors.email
                      ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                  }`}
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
              {errors.email && (
                <p className="text-3xs text-rose-600 font-bold mt-1">{errors.email}</p>
              )}
            </div>

            {/* حقل كلمة المرور */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                  }}
                  disabled={loading}
                  className={`w-full text-xs sm:text-sm px-3.5 py-2.5 pr-10 pl-10 border rounded-xl outline-none text-left placeholder:text-right placeholder:text-slate-300 transition-all disabled:bg-slate-50 ${
                    errors.password
                      ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                  }`}
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute left-2.5 top-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-3xs text-rose-600 font-bold mt-1">{errors.password}</p>
              )}
            </div>

            {/* زر تسجيل الدخول */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري تسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-emerald-400" />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>

          {/* تلميح الحساب الافتراضي */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-3xs text-slate-400 leading-relaxed">
              الحساب الإداري الافتراضي:{" "}
              <span className="font-mono text-slate-600 font-bold select-all">
                admin@elsalamwarehouse.com
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
