import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, ChevronDown, ShieldCheck } from "lucide-react";
import { showConfirm, showSuccess } from "../../utils/alertUtils";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { ProfileModal } from "./ProfileModal";

export function UserProfileDropdown() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleOpenProfile = () => {
    setIsOpen(false);
    setIsProfileModalOpen(true);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    const confirmed = await showConfirm({
      title: "تسجيل الخروج",
      text: "هل أنت متأكد من رغبتك في تسجيل الخروج من نظام إدارة مخازن مصنع السلام؟",
      confirmButtonText: "نعم، خروج",
      cancelButtonText: "إلغاء",
      icon: "warning",
    });

    if (confirmed) {
      await logout();
      showSuccess("تم تسجيل الخروج", "تم إنهاء جلسة العمل الخاصة بك بنجاح");
      navigate("/login", { replace: true });
    }
  };

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
    : "سل";

  const formatRoleName = (r) => {
    if (!r) return "موظف";
    if (r.toLowerCase() === "admin") return "مدير النظام";
    if (r.toLowerCase() === "warehousekeeper") return "أمين المخزن";
    return r;
  };

  const primaryRole = user?.roles && user.roles.length > 0 ? formatRoleName(user.roles[0]) : "موظف مستودع";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Clickable Profile Button */}
      <button
        onClick={handleToggle}
        className={`flex items-center gap-3 p-1.5 rounded-xl transition-all duration-150 cursor-pointer ${
          isOpen ? "bg-slate-100 ring-2 ring-slate-200/80" : "hover:bg-slate-100/80"
        }`}
        title="حساب المستخدم"
      >
        <div className="w-9 h-9 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-sm shadow-xs shrink-0 ring-2 ring-emerald-500/20">
          {initials}
        </div>

        <div className="hidden md:block text-right">
          <p className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1">
            {user?.fullName || "المستخدم"}
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </p>
          <p className="text-2xs font-medium text-slate-400">{primaryRole}</p>
        </div>
      </button>

      {/* Profile Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2.5 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Mini Card */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 text-right">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-base shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">{user?.fullName || "المستخدم"}</p>
                <p className="text-xs text-slate-500 truncate" dir="ltr">{user?.email || ""}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-3xs font-semibold bg-emerald-100 text-emerald-800">
                  متصل الآن (Online)
                </span>
              </div>
            </div>
          </div>

          {/* Role Info */}
          <div className="p-3 border-b border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 bg-slate-50/70 p-2 rounded-xl">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span className="text-2xs font-medium">الصلاحية:</span>
              </div>
              <span className="text-2xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                {user?.roles && user.roles.length > 0
                  ? user.roles.map(formatRoleName).join(" ، ")
                  : "موظف مستودع"}
              </span>
            </div>
          </div>

          {/* Action Links */}
          <div className="p-2 space-y-1">
            <button
              onClick={handleOpenProfile}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-right"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>تعديل الملف الشخصي وكلمة المرور</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-right"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>تسجيل الخروج من النظام</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}

export default UserProfileDropdown;
