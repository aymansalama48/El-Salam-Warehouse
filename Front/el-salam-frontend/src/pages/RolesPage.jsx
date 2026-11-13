import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  ShieldCheck, 
  Shield, 
  Save, 
  RefreshCw, 
  Layers, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { authService } from "../features/auth/services/authService";
import { useAuth } from "../features/auth/hooks/useAuth";
import { showSuccess, showError } from "../utils/alertUtils";

/**
 * خريطة تعريب أسماء ووصف الأدوار الوظيفية
 */
const ROLE_ARABIC_CONFIG = {
  Admin: {
    title: "مدير النظام",
    description: "يمتلك كامل الصلاحيات لإدارة المستودع، الأصناف، التقارير، وحسابات الموظفين.",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
  },
  WarehouseKeeper: {
    title: "أمين المخزن",
    description: "مسؤول عن حركات استلام وصرف البضاعة، جرد المخزون، ومتابعة دفتر اليومية.",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
  },
};

/**
 * دالة مساعدة للحصول على اسم وتفاصيل الدور بالعربي
 */
function getRoleMeta(role) {
  const conf = ROLE_ARABIC_CONFIG[role?.roleName];
  return {
    title: conf?.title || role?.roleName || "دور وظيفي",
    description: conf?.description || role?.description || "دور قياسي في النظام",
    isSystem: role?.isSystemRole,
  };
}

/**
 * مكون السويتش (Toggle Switch) بتصميم تفاعلي وسلس
 */
function ToggleSwitch({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
        checked ? "bg-purple-600" : "bg-slate-200"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? "-translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/**
 * صفحة إدارة الأدوار ومصفوفة الصلاحيات (RBAC) - معربة بالكامل وبسويتشات احترافية
 */
export function RolesPage() {
  const { hasPermission } = useAuth();
  const canViewRoles = hasPermission("Roles.View");
  const canManageRoles = hasPermission("Roles.Manage");

  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [rolePermissionsMap, setRolePermissionsMap] = useState({}); // { [roleId]: Set<permissionId> }
  const [initialPermissionsMap, setInitialPermissionsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // جلب كافة الأدوار والصلاحيات من الباك إند
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [permissionsData, rolesData] = await Promise.all([
        authService.getAllPermissions(),
        authService.getAllRolesWithPermissions(),
      ]);

      setAllPermissions(Array.isArray(permissionsData) ? permissionsData : []);

      if (Array.isArray(rolesData) && rolesData.length > 0) {
        setRoles(rolesData);

        const permMap = {};
        rolesData.forEach((role) => {
          const ids = new Set((role.permissions || []).map((p) => p.id));
          permMap[role.roleId] = ids;
        });

        setRolePermissionsMap(permMap);
        setInitialPermissionsMap(
          Object.fromEntries(
            Object.entries(permMap).map(([k, v]) => [k, Array.from(v)])
          )
        );

        setSelectedRoleId((prev) => prev || rolesData[0].roleId);
      }
    } catch (err) {
      showError("خطأ في التحميل", err.message || "تعذر جلب الصلاحيات والأدوار");
    } finally {
      setLoading(false);
    }
  }, []);

  // التحميل الأولي عند تركيب الصفحة
  useEffect(() => {
    let ignore = false;
    Promise.all([
      authService.getAllPermissions(),
      authService.getAllRolesWithPermissions(),
    ])
      .then(([permissionsData, rolesData]) => {
        if (ignore) return;

        setAllPermissions(Array.isArray(permissionsData) ? permissionsData : []);

        if (Array.isArray(rolesData) && rolesData.length > 0) {
          setRoles(rolesData);

          const permMap = {};
          rolesData.forEach((role) => {
            const ids = new Set((role.permissions || []).map((p) => p.id));
            permMap[role.roleId] = ids;
          });

          setRolePermissionsMap(permMap);
          setInitialPermissionsMap(
            Object.fromEntries(
              Object.entries(permMap).map(([k, v]) => [k, Array.from(v)])
            )
          );

          setSelectedRoleId((prev) => prev || rolesData[0].roleId);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!ignore) {
          showError("خطأ في التحميل", err.message || "تعذر جلب الصلاحيات والأدوار");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // الدور المحدد حالياً
  const activeRole = useMemo(() => {
    return roles.find((r) => r.roleId === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  const activeRoleMeta = useMemo(() => {
    return getRoleMeta(activeRole);
  }, [activeRole]);

  // الصلاحيات المحددة للدور النشط
  const activeRolePermissionIds = useMemo(() => {
    return selectedRoleId && rolePermissionsMap[selectedRoleId]
      ? rolePermissionsMap[selectedRoleId]
      : new Set();
  }, [selectedRoleId, rolePermissionsMap]);

  // تجميع الصلاحيات حسب الموديول (Module)
  const permissionsByModule = useMemo(() => {
    const groups = {};
    allPermissions.forEach((perm) => {
      const mod = perm.module || "صلاحيات عامة";
      if (!groups[mod]) {
        groups[mod] = [];
      }
      groups[mod].push(perm);
    });
    return groups;
  }, [allPermissions]);

  // تبديل اختيار صلاحية معينة بالسويتش
  const handleTogglePermission = (permissionId) => {
    if (!selectedRoleId || !canManageRoles) return;

    setRolePermissionsMap((prev) => {
      const currentSet = new Set(prev[selectedRoleId] || []);
      if (currentSet.has(permissionId)) {
        currentSet.delete(permissionId);
      } else {
        currentSet.add(permissionId);
      }
      return {
        ...prev,
        [selectedRoleId]: currentSet,
      };
    });
  };

  // تحديد / إلغاء تحديد كل صلاحيات موديول معين
  const handleToggleModuleAll = (modulePermissions) => {
    if (!selectedRoleId || !canManageRoles) return;

    setRolePermissionsMap((prev) => {
      const currentSet = new Set(prev[selectedRoleId] || []);
      const allSelected = modulePermissions.every((p) => currentSet.has(p.id));

      modulePermissions.forEach((p) => {
        if (allSelected) {
          currentSet.delete(p.id);
        } else {
          currentSet.add(p.id);
        }
      });

      return {
        ...prev,
        [selectedRoleId]: currentSet,
      };
    });
  };

  // التحقق مما إذا كان هناك تغييرات غير محفوظة للدور الحالي
  const hasChanges = useMemo(() => {
    if (!selectedRoleId || !initialPermissionsMap[selectedRoleId] || !canManageRoles) return false;
    const initialArr = initialPermissionsMap[selectedRoleId] || [];
    const currentSet = activeRolePermissionIds;

    if (initialArr.length !== currentSet.size) return true;
    return initialArr.some((id) => !currentSet.has(id));
  }, [selectedRoleId, initialPermissionsMap, activeRolePermissionIds, canManageRoles]);

  // حفظ التعديلات في الباك إند
  const handleSaveChanges = async () => {
    if (!selectedRoleId || !hasChanges || !canManageRoles) return;

    setSaving(true);
    try {
      const permissionIdsList = Array.from(activeRolePermissionIds);
      await authService.updateRolePermissions(selectedRoleId, permissionIdsList);

      showSuccess("تم الحفظ بنجاح", `تم تحديث صلاحيات دور (${activeRoleMeta.title}) بنجاح`);

      // إشعار سياق المصادقة بتحديث الصلاحيات لحظياً
      window.dispatchEvent(new CustomEvent("permissions:updated"));

      // تحديث الحالة الأولية لمنع زر الحفظ غير الضروري
      setInitialPermissionsMap((prev) => ({
        ...prev,
        [selectedRoleId]: permissionIdsList,
      }));
    } catch (err) {
      showError("فشل الحفظ", err.message || "حدث خطأ أثناء حفظ الصلاحيات");
    } finally {
      setSaving(false);
    }
  };

  if (!canViewRoles) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-slate-800 mb-2">عفواً، لا تمتلك صلاحية عرض الأدوار</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          تم تعطيل أو إلغاء صلاحية (عرض الأدوار والصلاحيات) لهذا الدور. يرجى مراجعة مسؤول النظام لتفعيل الصلاحية لك.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 select-none" dir="rtl">
      {/* 1. ترويسة الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" />
            إدارة الأدوار ومصفوفة الصلاحيات
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            تعيين وضبط صلاحيات الوصول للوظائف المختلفة بالنظام بدقة عبر مفاتيح التشغيل
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchData}
            disabled={loading || saving}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
            title="تحديث البيانات من السيرفر"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
            <span>تحديث البيانات</span>
          </button>

          {canManageRoles && (
            <button
              onClick={handleSaveChanges}
              disabled={!hasChanges || saving}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                hasChanges
                  ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/25 ring-2 ring-purple-600/30"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ التعديلات</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2. اختيار الدور الحالي ومعلومات الدور */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* قائمة الأدوار لاختيار دور */}
        <div className="md:col-span-1 space-y-2.5">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            اختر الدور الوظيفي للتعديل:
          </label>
          <div className="space-y-2.5">
            {roles.map((role) => {
              const isSelected = role.roleId === selectedRoleId;
              const count = rolePermissionsMap[role.roleId]?.size || 0;
              const meta = getRoleMeta(role);

              return (
                <div
                  key={role.roleId}
                  onClick={() => setSelectedRoleId(role.roleId)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20 shadow-xs"
                      : "bg-white border-slate-200/80 hover:bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-purple-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">{meta.title}</p>
                      <p className="text-2xs text-slate-500 line-clamp-1 mt-0.5">
                        {meta.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-3xs font-black shrink-0 ${
                      isSelected
                        ? "bg-purple-200/80 text-purple-900"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {count} صلاحية
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* بطاقة معلومات الدور النشط */}
        <div className="md:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {activeRole ? `صلاحيات: ${activeRoleMeta.title}` : "اختر دوراً لعرض صلاحياته"}
                </h3>
              </div>

              {activeRoleMeta.isSystem && (
                <span className="px-3 py-1 rounded-full text-2xs font-bold bg-purple-50 text-purple-800 border border-purple-200/60">
                  دور نظام أساسي
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {activeRoleMeta.description}
            </p>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              إجمالي الصلاحيات الممنوحة:{" "}
              <b className="text-purple-700 font-bold">{activeRolePermissionIds.size}</b> من أصل{" "}
              <b className="text-slate-800 font-bold">{allPermissions.length}</b>
            </span>

            {hasChanges && (
              <span className="text-amber-600 font-bold flex items-center gap-1.5 text-xs animate-pulse">
                <AlertCircle className="w-4 h-4" />
                <span>يوجد تعديلات غير محفوظة!</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. مصفوفة الصلاحيات مع مفاتيح السويتش مجمعة حسب الموديول */}
      <div className="space-y-5">
        {loading ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-100">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-purple-600 rounded-full animate-spin" />
              <span className="text-xs font-bold text-slate-500">
                جاري تحميل مصفوفة الصلاحيات من الخادم...
              </span>
            </div>
          </div>
        ) : Object.keys(permissionsByModule).length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs">
            لا توجد صلاحيات مسجلة في قاعدة البيانات حالياً
          </div>
        ) : (
          Object.entries(permissionsByModule).map(([moduleName, modulePermissions]) => {
            const allSelectedInModule = modulePermissions.every((p) =>
              activeRolePermissionIds.has(p.id)
            );
            const activeInModuleCount = modulePermissions.filter((p) =>
              activeRolePermissionIds.has(p.id)
            ).length;

            return (
              <div
                key={moduleName}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden"
              >
                {/* رأس الموديول */}
                <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <h4 className="font-bold text-xs sm:text-sm text-slate-800">
                      قسم: {moduleName}
                    </h4>
                    <span className="text-3xs px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-700 font-bold">
                      {activeInModuleCount} من {modulePermissions.length} مفعل
                    </span>
                  </div>

                  {canManageRoles && (
                    <button
                      type="button"
                      onClick={() => handleToggleModuleAll(modulePermissions)}
                      className="text-2xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-purple-100/60 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{allSelectedInModule ? "إلغاء تفعيل كل القسم" : "تفعيل كل القسم"}</span>
                    </button>
                  )}
                </div>

                {/* كروت الصلاحيات بمفاتيح التبديل (Toggle Switch) */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {modulePermissions.map((perm) => {
                    const isChecked = activeRolePermissionIds.has(perm.id);

                    return (
                      <div
                        key={perm.id}
                        onClick={() => canManageRoles && handleTogglePermission(perm.id)}
                        className={`p-4 rounded-xl border transition-all ${
                          !canManageRoles ? "cursor-default" : "cursor-pointer"
                        } flex items-center justify-between gap-3 ${
                          isChecked
                            ? "bg-purple-50/40 border-purple-200/90 shadow-2xs ring-1 ring-purple-500/10"
                            : "bg-white border-slate-200/70 hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-900 leading-snug">
                            {perm.displayName || perm.name}
                          </p>
                          {perm.description && (
                            <p className="text-2xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                              {perm.description}
                            </p>
                          )}
                        </div>

                        {/* مفتاح التبديل الاحترافي (Toggle Switch) */}
                        <div className="shrink-0 pt-0.5">
                          <ToggleSwitch
                            checked={isChecked}
                            disabled={!canManageRoles || saving}
                            onChange={() => handleTogglePermission(perm.id)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default RolesPage;
