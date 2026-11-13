import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardHome from "../pages/DashboardHome";
import ProductsPage from "../pages/ProductsPage";
import CategoriesPage from "../pages/CategoriesPage";
import DailyTransactionsPage from "../pages/DailyTransactionsPage";
import InboundPage from "../pages/InboundPage";
import OutboundPage from "../pages/OutboundPage";
import ReturnsPage from "../pages/ReturnsPage";
import LoginPage from "../pages/LoginPage";
import UsersPage from "../pages/UsersPage";
import RolesPage from "../pages/RolesPage";
import SettingsPage from "../pages/SettingsPage";
import ProtectedRoute from "../components/common/ProtectedRoute";

export function AppRoutes() {
  return (
    <Routes>
      {/* 1. صفحة تسجيل الدخول (Public) */}
      <Route path="/login" element={<LoginPage />} />

      {/* 2. مسارات لوحة التحكم المحمية بالكامل (Protected Routes) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* أ. الرئيسية */}
        <Route index element={<DashboardHome />} />

        {/* ب. إدارة المخزون (المنتجات التامة والفئات) */}
        <Route path="finished-goods" element={<ProductsPage />} />
        <Route path="products" element={<Navigate to="/finished-goods" replace />} />
        <Route path="categories" element={<CategoriesPage />} />

        {/* ج. الحركات والعمليات */}
        <Route path="stock-ledger" element={<DailyTransactionsPage />} />
        <Route path="transactions" element={<Navigate to="/stock-ledger" replace />} />
        <Route path="inbound" element={<InboundPage />} />
        <Route path="outbound" element={<OutboundPage />} />
        <Route path="returns" element={<ReturnsPage />} />

        {/* د. إدارة النظام والمستخدمين (Admin Only) */}
        <Route
          path="users"
          element={
            <ProtectedRoute requiredRole="Admin">
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="roles"
          element={
            <ProtectedRoute requiredRole="Admin">
              <RolesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute requiredRole="Admin">
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* مسار افتراضي في حال عدم العثور على الصفحة */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
