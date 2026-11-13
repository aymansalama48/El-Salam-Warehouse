import { useState } from "react";
import { X, User, Mail, Phone, Lock, Check, Shield } from "lucide-react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { validateProfile, validateChangePassword } from "../../features/auth/schemas/authSchemas";
import { showSuccess, showError } from "../../utils/alertUtils";

/**
 * دالة مساعدة لتجهيز البيانات الأولية للملف الشخصي
 */
function getInitialProfileData(user) {
  let fName = user?.firstName || "";
  let mName = user?.middleName || "";
  let lName = user?.lastName || "";

  if (!fName && user?.fullName) {
    const parts = user.fullName.trim().split(" ");
    fName = parts[0] || "";
    if (parts.length === 2) {
      lName = parts[1] || "";
    } else if (parts.length > 2) {
      mName = parts.slice(1, -1).join(" ");
      lName = parts[parts.length - 1];
    }
  }

  return {
    firstName: fName,
    middleName: mName,
    lastName: lName,
    phoneNumber: user?.phoneNumber || "",
  };
}

/**
 * مكون المحتوى الداخلي للنموذج
 */
function ProfileModalContent({ onClose }) {
  const { user, updateProfile, changePassword } = useAuth();

  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'password'

  // بيانات الملف الشخصي مجهزة مباشرة من بيانات المستخدم
  const [profileData, setProfileData] = useState(() => getInitialProfileData(user));
  const [profileErrors, setProfileErrors] = useState({});

  // بيانات تغيير كلمة المرور
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);

  // حفظ الملف الشخصي باستخدام Zod
  const handleSaveProfile = async (e) => {
    e.preventDefault();

    const validation = validateProfile(profileData);
    if (!validation.success) {
      setProfileErrors(validation.errors);
      return;
    }

    setProfileErrors({});
    setLoading(true);
    try {
      await updateProfile(profileData);
      showSuccess("تم التحديث بنجاح", "تم حفظ بيانات الملف الشخصي بنجاح");
      onClose();
    } catch (err) {
      showError("خطأ", err.message || "فشل تحديث بيانات الملف الشخصي");
    } finally {
      setLoading(false);
    }
  };

  // تغيير كلمة المرور باستخدام Zod
  const handleChangePassword = async (e) => {
    e.preventDefault();

    const validation = validateChangePassword(passwordData);
    if (!validation.success) {
      setPasswordErrors(validation.errors);
      return;
    }

    setPasswordErrors({});
    setLoading(true);
    try {
      await changePassword(passwordData);
      showSuccess("تم التغيير بنجاح", "تم تغيير كلمة المرور الخاصة بك بنجاح");
      setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      onClose();
    } catch (err) {
      showError("خطأ في تغيير كلمة المرور", err.message || "فشل تغيير كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
    : "سل";

  return (
    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 max-h-[calc(100dvh-2rem)] sm:max-h-[90dvh] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-sm shadow-xs">
            {initials}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">الملف الشخصي وإعدادات الحساب</h3>
            <p className="text-xs text-slate-400">إدارة بيانات حسابك وكلمة المرور</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* التبويبات Tabs */}
      <div className="flex border-b border-slate-100 px-4 sm:px-6 pt-2 bg-slate-50/30 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "profile"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          البيانات الأساسية
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("password")}
          className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "password"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          تغيير كلمة المرور
        </button>
      </div>

      {/* Tab 1: الملف الشخصي */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الاسم الأول <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => {
                    setProfileData({ ...profileData, firstName: e.target.value });
                    if (profileErrors.firstName) setProfileErrors((p) => ({ ...p, firstName: null }));
                  }}
                  className={`w-full text-xs px-3 py-2 pr-8 border rounded-xl outline-none ${
                    profileErrors.firstName
                      ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  }`}
                />
                <User className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
              {profileErrors.firstName && (
                <p className="text-3xs text-rose-600 font-bold mt-1">{profileErrors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الاسم الأوسط
              </label>
              <input
                type="text"
                value={profileData.middleName}
                onChange={(e) => {
                  setProfileData({ ...profileData, middleName: e.target.value });
                  if (profileErrors.middleName) setProfileErrors((p) => ({ ...p, middleName: null }));
                }}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              />
              {profileErrors.middleName && (
                <p className="text-3xs text-rose-600 font-bold mt-1">{profileErrors.middleName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                اللقب / العائلة <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={profileData.lastName}
                onChange={(e) => {
                  setProfileData({ ...profileData, lastName: e.target.value });
                  if (profileErrors.lastName) setProfileErrors((p) => ({ ...p, lastName: null }));
                }}
                className={`w-full text-xs px-3 py-2 border rounded-xl outline-none ${
                  profileErrors.lastName
                    ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                }`}
              />
              {profileErrors.lastName && (
                <p className="text-3xs text-rose-600 font-bold mt-1">{profileErrors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                البريد الإلكتروني (المسجل)
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full text-xs px-3 py-2 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed outline-none"
                  dir="ltr"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                رقم الهاتف المحمول
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={profileData.phoneNumber}
                  onChange={(e) => {
                    setProfileData({ ...profileData, phoneNumber: e.target.value });
                    if (profileErrors.phoneNumber) setProfileErrors((p) => ({ ...p, phoneNumber: null }));
                  }}
                  placeholder="010XXXXXXXX"
                  className={`w-full text-xs px-3 py-2 pr-8 border rounded-xl outline-none ${
                    profileErrors.phoneNumber
                      ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  }`}
                  dir="ltr"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
              {profileErrors.phoneNumber && (
                <p className="text-3xs text-rose-600 font-bold mt-1">{profileErrors.phoneNumber}</p>
              )}
            </div>
          </div>

          {/* الأدوار الممنوحة */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              الأدوار والصلاحيات الممنوحة
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200/60">
              {user?.roles && user.roles.length > 0 ? (
                user.roles.map((r) => (
                  <span
                    key={r}
                    className="px-2 py-0.5 rounded-lg text-2xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center gap-1"
                  >
                    <Shield className="w-3 h-3" />
                    <span>{r}</span>
                  </span>
                ))
              ) : (
                <span className="text-2xs text-slate-400">لا توجد أدوار مسندة</span>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 pb-2 border-t border-slate-100 shrink-0 sticky bottom-0 bg-white/95 backdrop-blur-xs z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 shadow-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              {loading ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: تغيير كلمة المرور */}
      {activeTab === "password" && (
        <form onSubmit={handleChangePassword} className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto" noValidate>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              كلمة المرور الحالية <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => {
                  setPasswordData({ ...passwordData, currentPassword: e.target.value });
                  if (passwordErrors.currentPassword) setPasswordErrors((p) => ({ ...p, currentPassword: null }));
                }}
                className={`w-full text-xs px-3 py-2 pr-8 border rounded-xl outline-none ${
                  passwordErrors.currentPassword
                    ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                }`}
                dir="ltr"
              />
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            </div>
            {passwordErrors.currentPassword && (
              <p className="text-3xs text-rose-600 font-bold mt-1">{passwordErrors.currentPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              كلمة المرور الجديدة <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => {
                  setPasswordData({ ...passwordData, newPassword: e.target.value });
                  if (passwordErrors.newPassword) setPasswordErrors((p) => ({ ...p, newPassword: null }));
                }}
                className={`w-full text-xs px-3 py-2 pr-8 border rounded-xl outline-none ${
                  passwordErrors.newPassword
                    ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                }`}
                dir="ltr"
              />
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            </div>
            {passwordErrors.newPassword && (
              <p className="text-3xs text-rose-600 font-bold mt-1">{passwordErrors.newPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              تأكيد كلمة المرور الجديدة <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords ? "text" : "password"}
                value={passwordData.confirmNewPassword}
                onChange={(e) => {
                  setPasswordData({ ...passwordData, confirmNewPassword: e.target.value });
                  if (passwordErrors.confirmNewPassword) setPasswordErrors((p) => ({ ...p, confirmNewPassword: null }));
                }}
                className={`w-full text-xs px-3 py-2 pr-8 border rounded-xl outline-none ${
                  passwordErrors.confirmNewPassword
                    ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                }`}
                dir="ltr"
              />
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            </div>
            {passwordErrors.confirmNewPassword && (
              <p className="text-3xs text-rose-600 font-bold mt-1">{passwordErrors.confirmNewPassword}</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="showPass"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="showPass" className="text-2xs text-slate-600 cursor-pointer">
              إظهار كلمات المرور المدخلة
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 pb-2 border-t border-slate-100 shrink-0 sticky bottom-0 bg-white/95 backdrop-blur-xs z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 shadow-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              {loading ? "جاري التغيير..." : "تغيير كلمة المرور"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/**
 * مودال تعديل الملف الشخصي وتغيير كلمة المرور للمستخدم المسجل حالياً
 */
export function ProfileModal({ isOpen, onClose }) {
  const { user } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 select-none" dir="rtl">
      <ProfileModalContent key={user?.email || "user-modal"} onClose={onClose} />
    </div>
  );
}

export default ProfileModal;
