import { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./authContextDef";
import { authService } from "../services/authService";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("auth_token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("auth_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // تحديث البروفايل من الباك إند للتأكد من أحدث البيانات
  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authService.getMyProfile();
      if (profile) {
        setUser((prev) => {
          const updated = {
            ...prev,
            ...profile,
            roles: profile.roles || prev?.roles || [],
            permissions: profile.permissions || prev?.permissions || [],
          };
          localStorage.setItem("auth_user", JSON.stringify(updated));
          return updated;
        });
      }
    } catch {
      // إذا فشل جلب البروفايل، نحافظ على البيانات المخزنة محلياً
    }
  }, []);

  // عند بداية تشغيل التطبيق، نتأكد من صحة التوكن ونجلب البروفايل
  useEffect(() => {
    let ignore = false;
    const initAuth = async () => {
      const savedToken = localStorage.getItem("auth_token");
      if (savedToken) {
        if (!ignore) setToken(savedToken);
        await refreshProfile();
      }
      if (!ignore) setLoading(false);
    };

    initAuth();

    // الاستماع لحدث انتهاء الجلسة الصادر من معترض Axios وتحديث الصلاحيات
    const handleForcedLogout = () => {
      setToken(null);
      setUser(null);
    };

    const handlePermissionsUpdated = () => {
      refreshProfile();
    };

    window.addEventListener("auth:logout", handleForcedLogout);
    window.addEventListener("permissions:updated", handlePermissionsUpdated);
    return () => {
      ignore = true;
      window.removeEventListener("auth:logout", handleForcedLogout);
      window.removeEventListener("permissions:updated", handlePermissionsUpdated);
    };
  }, [refreshProfile]);

  // تسجيل الدخول
  const login = async (credentials) => {
    const authData = await authService.login(credentials);
    if (!authData || !authData.accessToken) {
      throw new Error("لم يتم استلام توكن صالح من الخادم");
    }

    const userData = {
      userId: authData.userId,
      email: authData.email,
      fullName: authData.fullName,
      roles: authData.roles || [],
      permissions: authData.permissions || [],
    };

    localStorage.setItem("auth_token", authData.accessToken);
    if (authData.refreshToken) {
      localStorage.setItem("refresh_token", authData.refreshToken);
    }
    localStorage.setItem("auth_user", JSON.stringify(userData));

    setToken(authData.accessToken);
    setUser(userData);

    // جلب باقي بيانات البروفايل في الخلفية
    refreshProfile();

    return authData;
  };

  // تسجيل الخروج
  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // حتى لو فشل الريكوست في السيرفر، نمسح محلياً
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("auth_user");
      setToken(null);
      setUser(null);
    }
  };

  // تعديل بيانات البروفايل
  const updateProfile = async (profileData) => {
    await authService.updateMyProfile(profileData);
    await refreshProfile();
  };

  // تغيير كلمة المرور
  const changePassword = async (passwordData) => {
    return await authService.changePassword(passwordData);
  };

  // فحص صلاحية / دور المستخدم
  const hasRole = (roleName) => {
    if (!user || !user.roles) return false;
    return user.roles.some(
      (r) => r.trim().toLowerCase() === roleName.trim().toLowerCase()
    );
  };

  const isAdmin = hasRole("Admin");

  // فحص امتلاك صلاحية معينة (يتحقق بدقة من الصلاحيات الممنوحة فعلياً في قاعدة البيانات)
  const hasPermission = (permissionName) => {
    if (!user) return false;
    if (!user.permissions || !Array.isArray(user.permissions)) return false;
    return user.permissions.includes(permissionName);
  };

  // فحص امتلاك أي من الصلاحيات المحددة
  const hasAnyPermission = (permissionNames = []) => {
    if (!user) return false;
    if (!user.permissions || !Array.isArray(user.permissions)) return false;
    return permissionNames.some((p) => user.permissions.includes(p));
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    loading,
    isAdmin,
    login,
    logout,
    refreshProfile,
    updateProfile,
    changePassword,
    hasRole,
    hasPermission,
    hasAnyPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
