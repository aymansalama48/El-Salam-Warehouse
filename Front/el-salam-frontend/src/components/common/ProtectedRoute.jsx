import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";

/**
 * مكون حماية المسارات (Protected Route)
 * يمنع الوصول للصفحات الداخلية بدون تسجيل دخول، ويدعم التحقق من الدور (Role)
 */
export function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500">جاري التحقق من الجلسة والصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;

