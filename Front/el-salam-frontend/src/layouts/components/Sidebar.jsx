import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  BookOpen, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  RotateCcw,
  BookCopy, 
  X, 
  ShieldCheck,
  Users,
  Settings,
  PanelRightClose,
  PanelRightOpen
} from "lucide-react";
import { NavItem } from "./NavItem";
import { useVoucherSummary } from "../../features/vouchers/hooks/useVoucherSummary";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useSettings } from "../../context/SettingsContext";

export function Sidebar({ 
  mobileOpen, 
  onCloseMobile, 
  isCollapsed, 
  onToggleCollapse 
}) {
  const { summary } = useVoucherSummary();
  const { isAdmin, hasPermission } = useAuth();
  const { settings } = useSettings();
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [settings?.logoUrl]);

  // في وضع الموبايل (Drawer) القائمة تكون مفتوحة بالكامل دائماً، الطي للأيقونات مخصص للشاشات الكبيرة فقط
  const effectiveCollapsed = mobileOpen ? false : isCollapsed;

  // بناء عناصر القائمة بناءً على الصلاحيات الفعلية للمستخدم
  const rawSections = [
    {
      title: "الرئيسية",
      items: [
        hasPermission("Dashboard.View") && {
          to: "/",
          label: "لوحة التحكم",
          icon: LayoutDashboard,
        },
      ].filter(Boolean),
    },
    {
      title: "إدارة المخزون",
      items: [
        hasPermission("Products.View") && {
          to: "/finished-goods",
          label: "المنتجات التامة",
          icon: Package,
        },
        hasPermission("Categories.View") && {
          to: "/categories",
          label: "فئات الأصناف",
          icon: Tags,
        },
      ].filter(Boolean),
    },
    {
      title: "الحركات والعمليات",
      items: [
        (isAdmin || hasPermission("Daybook.View")) && {
          to: "/stock-ledger",
          label: "دفتر اليومية",
          icon: BookOpen,
        },
        (isAdmin || hasPermission("Vouchers.View")) && {
          to: "/inbound",
          label: "أذونات الوارد",
          icon: ArrowDownToLine,
          badge: `${summary.inboundToday} اليوم`,
        },
        (isAdmin || hasPermission("Vouchers.View")) && {
          to: "/outbound",
          label: "أذونات المنصرف",
          icon: ArrowUpFromLine,
          badge: `${summary.outboundToday} اليوم`,
        },
        (isAdmin || hasPermission("Vouchers.View")) && {
          to: "/returns",
          label: "أذونات المرتجع",
          icon: RotateCcw,
          badge: `${summary.returnsToday || 0} اليوم`,
        },
      ].filter(Boolean),
    },
    {
      title: "إدارة النظام",
      items: [
        hasPermission("Users.View") && {
          to: "/users",
          label: "المستخدمين والموظفين",
          icon: Users,
        },
        hasPermission("Roles.View") && {
          to: "/roles",
          label: "الأدوار والصلاحيات",
          icon: ShieldCheck,
        },
        hasPermission("Settings.View") && {
          to: "/settings",
          label: "إعدادات المنشأة والشعار",
          icon: Settings,
        },
      ].filter(Boolean),
    },
  ];

  // تصفية الأقسام الفارغة التي لا يملك المستخدم صلاحية لأي عنصر فيها
  const navigationSections = rawSections.filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`h-screen bg-white border-l border-slate-200/70 flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 select-none ${
          /* Mobile Drawer */
          mobileOpen 
            ? "fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] translate-x-0 shadow-2xl" 
            : "fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] translate-x-full lg:translate-x-0"
        } ${
          /* Desktop In-Flow */
          effectiveCollapsed 
            ? "lg:static lg:z-auto lg:w-20" 
            : "lg:static lg:z-auto lg:w-72"
        }`}
      >
        {/* Top: Logo & Single Dynamic Collapse Button */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 shrink-0">
          <div className={`flex items-center gap-3 ${effectiveCollapsed ? "lg:justify-center lg:w-full" : "min-w-0"}`}>
            <div 
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-colors overflow-hidden ${
                settings?.logoUrl && !logoFailed
                  ? "bg-transparent hover:opacity-90"
                  : "bg-slate-900 text-white shadow-xs hover:bg-slate-800"
              }`}
              onClick={effectiveCollapsed ? onToggleCollapse : undefined}
              title={effectiveCollapsed ? "انقر لتوسيع الشريط الجانبي" : (settings?.warehouseName || "مصنع السلام")}
            >
              {settings?.logoUrl && !logoFailed ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.warehouseName || "شعار المنشأة"}
                  className="w-full h-full object-contain"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <BookCopy className="w-5 h-5 text-emerald-400" />
              )}
            </div>

            {/* Brand Title (Full Text without truncation) */}
            {!effectiveCollapsed && (
              <div className="min-w-0">
                <h2 className="font-bold text-base text-slate-900 tracking-tight leading-snug whitespace-nowrap">
                  {settings?.warehouseName || "مصنع السلام"}
                </h2>
                <p className="text-xs font-medium text-slate-400 whitespace-nowrap">
                  {settings?.subtitle || "للكراسات والحلول الورقية"}
                </p>
              </div>
            )}
          </div>

          {/* Single Dynamic Desktop Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className={`hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ${
              effectiveCollapsed ? "lg:hidden" : "block"
            }`}
            title="طي القائمة الجانبية"
          >
            <PanelRightClose className="w-5 h-5" />
          </button>

          {/* Mobile Close Button (X) */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer shrink-0"
            title="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Expand Button in Collapsed Mode (Centered in Rail) */}
        {effectiveCollapsed && (
          <div className="hidden lg:flex justify-center py-2 border-b border-slate-100">
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              title="توسيع القائمة الجانبية"
            >
              <PanelRightOpen className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Navigation Section with Independent Scroll */}
        <nav className="p-3 space-y-4 flex-1 overflow-y-auto overflow-x-hidden">
          {navigationSections.map((section, idx) => (
            <div key={section.title || idx} className="space-y-1">
              {effectiveCollapsed ? (
                <div className="hidden lg:block w-7 h-px bg-slate-200 mx-auto my-2.5" />
              ) : (
                <p className="px-3 text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 whitespace-nowrap">
                  {section.title}
                </p>
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    badge={item.badge}
                    isCollapsed={effectiveCollapsed}
                    onClick={onCloseMobile}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Status Card */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
          {effectiveCollapsed ? (
            <div className="flex justify-center" title="نظام إدارة المخازن">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-800">مستودع المصنع المركزي</span>
              </div>
              <p className="text-2xs font-medium text-slate-400">
                نظام إدارة المخازن
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
