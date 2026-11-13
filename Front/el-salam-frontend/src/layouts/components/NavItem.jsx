import { NavLink } from "react-router-dom";

export function NavItem({ to, icon: Icon, label, badge, isCollapsed, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      end={to === "/"}
      title={isCollapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center rounded-xl transition-all duration-150 group relative ${
          isCollapsed
            ? "justify-center p-2.5 w-11 h-11 mx-auto"
            : "justify-between px-3.5 py-2.5 text-xs sm:text-sm font-medium"
        } ${
          isActive
            ? isCollapsed
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-blue-50/90 text-blue-700 font-semibold border-r-3 border-blue-600 shadow-2xs"
            : isCollapsed
            ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100/80"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border-r-3 border-transparent"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
            {Icon && (
              <Icon
                className={`w-5 h-5 transition-colors duration-150 shrink-0 ${
                  isActive
                    ? isCollapsed
                      ? "text-white"
                      : "text-blue-600"
                    : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
            )}
            {!isCollapsed && <span className="truncate">{label}</span>}
          </div>

          {!isCollapsed && badge && (
            <span
              className={`text-2xs px-2 py-0.5 rounded-full font-bold shrink-0 ${
                isActive
                  ? "bg-blue-100 text-blue-800"
                  : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
              }`}
            >
              {badge}
            </span>
          )}

          {/* Floating Tooltip in Collapsed Mode */}
          {isCollapsed && (
            <span className="hidden lg:group-hover:flex absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 rounded-md shadow-md whitespace-nowrap z-50 pointer-events-none items-center gap-1.5 animate-in fade-in duration-150">
              {label}
              {badge && (
                <span className="px-1.5 py-0.2 rounded bg-slate-700 text-slate-200 text-2xs">
                  {badge}
                </span>
              )}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}
