import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";

export function DashboardLayout() {
  // حالة الموبايل: فتح/إغلاق كـ Drawer
  const [mobileOpen, setMobileOpen] = useState(false);

  // معرفة هل الشاشة الحالية ديسكتوب (>= 1024px) أم موبايل/تابلت
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // حالة الشاشات الكبيرة: توسيع أو طي إلى شريط مصغر (Mini Rail)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("elsalam_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("elsalam_sidebar_collapsed", String(next));
      } catch {
        // تجاهل في حالة تعطل localStorage
      }
      return next;
    });
  };

  // مراقبة تغيير حجم الشاشة وإغلاق دراور الموبايل تلقائياً عند التكبير للديسكتوب
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // في شاشات الموبايل القائمة تفتح كـ Drawer كامل ولا تُطوى أبداً، الطي مخصص للشاشات الكبيرة فقط
  const effectiveCollapsed = isDesktop && !mobileOpen ? isCollapsed : false;

  return (
    <div 
      dir="rtl" 
      className="h-screen w-screen overflow-hidden bg-slate-50 flex flex-row font-sans text-slate-800 antialiased selection:bg-emerald-500 selection:text-white"
    >
      {/* 1. Sidebar with Independent Scroll & Desktop Collapsible Rail */}
      <Sidebar 
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        isCollapsed={effectiveCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* 2. Main Application Area */}
      <div className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden">
        {/* Fixed Header */}
        <Header 
          onOpenMobile={() => setMobileOpen(true)}
        />

        {/* Independent Scrollable Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl w-full mx-auto pb-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
