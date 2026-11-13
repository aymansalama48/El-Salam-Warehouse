import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { useSettings } from "../../context/SettingsContext";

const pageTitles = {
  "/": "لوحة متابعة المستودع والإنتاج الورقي",
  "/finished-goods": "سجل المنتجات التامة والكشاكيل",
  "/products": "سجل المنتجات التامة والكشاكيل",
  "/categories": "فئات الأصناف والحلول الورقية",
  "/stock-ledger": "دفتر اليومية وحركة المخزون",
  "/transactions": "دفتر اليومية وحركة المخزون",
  "/inbound": "أذونات الوارد والاستلام المخزني",
  "/outbound": "أذونات المنصرف والصرف للعملاء",
  "/returns": "أذونات المرتجع وبضاعة الإرجاع",
  "/settings": "إعدادات المنشأة والشعار الرسمي",
};

export function Header({ onOpenMobile }) {
  const location = useLocation();
  const currentTitle = pageTitles[location.pathname] || "نظام إدارة المخازن";
  const { settings } = useSettings();

  return (
    <header className="h-16 bg-white border-b border-slate-200/70 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 select-none">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button (Only on Mobile) */}
        <button
          onClick={onOpenMobile}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden cursor-pointer"
          aria-label="فتح القائمة الجانبية"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
            {currentTitle}
          </h1>
          <p className="text-2xs sm:text-xs font-medium text-slate-400 hidden sm:block">
            {settings?.warehouseName || "مصنع السلام"} {settings?.subtitle ? `- ${settings.subtitle}` : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Interactive Notifications Popover */}
        <NotificationsDropdown />

        <div className="h-6 w-px bg-slate-200"></div>

        {/* Interactive User Profile & Actions Dropdown */}
        <UserProfileDropdown />
      </div>
    </header>
  );
}
