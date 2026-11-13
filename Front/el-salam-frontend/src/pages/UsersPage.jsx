import { useState, useEffect, useCallback } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Shield, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Clock, 
  Phone, 
  Mail, 
  RefreshCw,
  X,
  UserPlus
} from "lucide-react";
import { authService } from "../features/auth/services/authService";
import { useAuth } from "../features/auth/hooks/useAuth";
import { validateAssignRole } from "../features/auth/schemas/authSchemas";
import { showConfirm, showSuccess, showError } from "../utils/alertUtils";
import { AddUserModal } from "../features/auth/components/AddUserModal";

/**
 * دالة مساعدة لتعريب أسماء الأدوار
 */
function getRoleLabel(role) {
  if (!role) return "بدون دور";
  const r = role.toLowerCase();
  if (r === "admin") return "مدير النظام";
  if (r === "warehousekeeper") return "أمين المخزن";
  return role;
}

/**
 * صفحة إدارة مستخدمي النظام وحسابات الموظفين
 */
export function UsersPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission("Users.View");
  const canCreate = hasPermission("Users.Create");
  const canManage = hasPermission("Users.Manage");
  const canAssignRoles = hasPermission("Users.AssignRoles");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  // حالة مودال إضافة مستخدم جديد
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // حالة مودال إدارة أدوار المستخدم
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [availableRoles, setAvailableRoles] = useState(["Admin", "WarehouseKeeper"]);
  const [newRoleToAdd, setNewRoleToAdd] = useState("");
  const [roleValidationError, setRoleValidationError] = useState("");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // جلب قائمة المستخدمين يدوياً عند الحاجة
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authService.getAllUsers({
        pageNumber,
        pageSize,
        role: selectedRole,
        searchTerm: searchTerm.trim(),
      });

      if (response) {
        setUsers(response.items || []);
        setTotalCount(response.totalCount || 0);
        setTotalPages(response.totalPages || 1);
      }
    } catch (err) {
      showError("خطأ في التحميل", err.message || "تعذر جلب بيانات المستخدمين");
    } finally {
      setLoading(false);
    }
  }, [pageNumber, pageSize, selectedRole, searchTerm]);

  // جلب قائمة الأدوار المتاحة في السيستم
  useEffect(() => {
    let ignore = false;
    authService
      .getAllRolesWithPermissions()
      .then((rolesData) => {
        if (!ignore && Array.isArray(rolesData) && rolesData.length > 0) {
          const names = rolesData.map((r) => r.roleName);
          setAvailableRoles(names);
        }
      })
      .catch(() => {
        // الاعتماد على الأدوار الافتراضية
      });

    return () => {
      ignore = true;
    };
  }, []);

  // المزامنة التلقائية لجدول المستخدمين عند تغير الفلاتر
  useEffect(() => {
    let ignore = false;
    authService
      .getAllUsers({
        pageNumber,
        pageSize,
        role: selectedRole,
        searchTerm: searchTerm.trim(),
      })
      .then((response) => {
        if (!ignore && response) {
          setUsers(response.items || []);
          setTotalCount(response.totalCount || 0);
          setTotalPages(response.totalPages || 1);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          showError("خطأ في التحميل", err.message || "تعذر جلب بيانات المستخدمين");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [pageNumber, pageSize, selectedRole, searchTerm]);

  // تفعيل / تعطيل الحساب
  const handleToggleStatus = async (user) => {
    const isActivating = !user.isActive;
    const actionText = isActivating ? "تفعيل" : "تعطيل";

    const confirmed = await showConfirm({
      title: `${actionText} الحساب`,
      text: `هل أنت متأكد من رغبتك في ${actionText} حساب الموظف (${user.fullName})؟`,
      confirmButtonText: `نعم، ${actionText}`,
      cancelButtonText: "إلغاء",
      icon: isActivating ? "question" : "warning",
    });

    if (!confirmed) return;

    try {
      if (isActivating) {
        await authService.activateUser(user.id);
        showSuccess("تم التفعيل", `تم تفعيل حساب ${user.fullName} بنجاح`);
      } else {
        await authService.deactivateUser(user.id);
        showSuccess("تم التعطيل", `تم تعطيل حساب ${user.fullName} بنجاح`);
      }
      fetchUsers();
    } catch (err) {
      showError("فشلت العملية", err.message || `تعذر ${actionText} الحساب`);
    }
  };

  // إضافة دور لمستخدم باستخدام Zod
  const handleAddRole = async () => {
    if (!roleModalUser) return;

    const validation = validateAssignRole({ roleName: newRoleToAdd });
    if (!validation.success) {
      setRoleValidationError(validation.errors.roleName || "يرجى اختيار دور وظيفي");
      return;
    }

    if (roleModalUser.roles?.includes(newRoleToAdd)) {
      setRoleValidationError("هذا الدور مسند للمستخدم بالفعل");
      return;
    }

    setRoleValidationError("");
    setIsUpdatingRole(true);
    try {
      await authService.assignRoleToUser(roleModalUser.id, newRoleToAdd);
      showSuccess("تمت الإضافة", `تم إسناد دور (${newRoleToAdd}) للمستخدم بنجاح`);
      const updatedRoles = [...(roleModalUser.roles || []), newRoleToAdd];
      setRoleModalUser({ ...roleModalUser, roles: updatedRoles });
      setNewRoleToAdd("");
      fetchUsers();
    } catch (err) {
      showError("فشل إسناد الدور", err.message || "حدث خطأ أثناء إسناد الدور");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // إزالة دور من مستخدم
  const handleRemoveRole = async (roleName) => {
    if (!roleModalUser) return;

    const confirmed = await showConfirm({
      title: "سحب الدور",
      text: `هل أنت متأكد من سحب دور (${roleName}) من ${roleModalUser.fullName}؟`,
      confirmButtonText: "نعم، سحب",
      cancelButtonText: "إلغاء",
      icon: "warning",
    });

    if (!confirmed) return;

    setIsUpdatingRole(true);
    try {
      await authService.removeRoleFromUser(roleModalUser.id, roleName);
      showSuccess("تم السحب", `تم سحب دور (${roleName}) بنجاح`);
      const updatedRoles = (roleModalUser.roles || []).filter((r) => r !== roleName);
      setRoleModalUser({ ...roleModalUser, roles: updatedRoles });
      fetchUsers();
    } catch (err) {
      showError("فشل سحب الدور", err.message || "حدث خطأ أثناء سحب الدور");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // تبديل الدور المباشر لمستخدم (سحب القديم وإسناد الجديد)
  const handleQuickSwitchRole = async (targetRole) => {
    if (!roleModalUser) return;
    setIsUpdatingRole(true);
    try {
      const currentRoles = roleModalUser.roles || [];
      for (const r of currentRoles) {
        if (r !== targetRole) {
          await authService.removeRoleFromUser(roleModalUser.id, r);
        }
      }
      if (!currentRoles.includes(targetRole)) {
        await authService.assignRoleToUser(roleModalUser.id, targetRole);
      }
      showSuccess("تم تغيير الدور", `تم تعيين المستخدم كـ (${getRoleLabel(targetRole)}) بنجاح`);
      setRoleModalUser({ ...roleModalUser, roles: [targetRole] });
      fetchUsers();
    } catch (err) {
      showError("فشل تغيير الدور", err.message || "حدث خطأ أثناء تعديل دور المستخدم");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // إحصائيات سريعة
  const activeCount = users.filter((u) => u.isActive).length;
  const adminCount = users.filter((u) => u.roles?.includes("Admin")).length;

  if (!canView) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-slate-800 mb-2">عفواً، لا تمتلك صلاحية عرض المستخدمين</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          تم تعطيل أو إلغاء صلاحية (عرض حسابات الموظفين) لهذا الدور. يرجى مراجعة مسؤول النظام لتفعيل الصلاحية لك.
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
            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
            إدارة حسابات الموظفين
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            متابعة حسابات الموظفين، تفعيلها، وإسناد الأدوار والصلاحيات
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {canCreate && (
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow-blue-500/25 ring-2 ring-blue-600/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة موظف جديد</span>
            </button>
          )}

          <button
            onClick={fetchUsers}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* 2. بطاقات الإحصائيات السريعة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-semibold text-slate-400">إجمالي الحسابات</p>
            <p className="text-lg font-black text-slate-900">{totalCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-semibold text-slate-400">حسابات نشطة</p>
            <p className="text-lg font-black text-emerald-600">{activeCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-semibold text-slate-400">مدراء النظام</p>
            <p className="text-lg font-black text-purple-600">{adminCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-semibold text-slate-400">الأدوار المتاحة</p>
            <p className="text-lg font-black text-slate-800">{availableRoles.length}</p>
          </div>
        </div>
      </div>

      {/* 3. شريط الفلاتر والبحث */}
      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="بحث بالاسم أو البريد الإلكتروني..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPageNumber(1);
            }}
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 pr-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        </div>

        {/* أزرار التصفية السريعة للأدوار */}
        <div className="flex flex-wrap items-center gap-1.5 order-2 lg:order-none">
          <button
            type="button"
            onClick={() => {
              setSelectedRole("");
              setPageNumber(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedRole === ""
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            الجميع
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedRole("Admin");
              setPageNumber(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedRole === "Admin"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            مدراء النظام
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedRole("WarehouseKeeper");
              setPageNumber(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedRole === "WarehouseKeeper"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            أمناء المخازن
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setPageNumber(1);
              }}
              className="text-xs sm:text-sm px-3 py-2.5 pl-8 border border-slate-200 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none cursor-pointer appearance-none"
            >
              <option value="">جميع الأدوار الوظيفية</option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5 pointer-events-none" />
          </div>

          <div className="relative shrink-0">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPageNumber(1);
              }}
              className="text-xs sm:text-sm px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none cursor-pointer"
            >
              <option value="5">5 لكل صفحة</option>
              <option value="10">10 لكل صفحة</option>
              <option value="20">20 لكل صفحة</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. جدول المستخدمين */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold text-2xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">الموظف</th>
                <th className="py-3 px-4">الهاتف</th>
                <th className="py-3 px-4">الأدوار الممنوحة</th>
                <th className="py-3 px-4">حالة الحساب</th>
                <th className="py-3 px-4">تاريخ الإنشاء</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-7 h-7 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-xs font-semibold">جاري تحميل بيانات المستخدمين...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <UserX className="w-8 h-8 text-slate-300" />
                      <span className="text-xs font-semibold">لا يوجد مستخدمين مطابقين للبحث</span>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const initials = u.fullName
                    ? u.fullName
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                    : "مو";

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* الموظف (الاسم والبريد) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{u.fullName || "—"}</p>
                            <p className="text-2xs text-slate-400 truncate flex items-center gap-1 mt-0.5" dir="ltr">
                              <Mail className="w-3 h-3 shrink-0 text-slate-400" />
                              <span>{u.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* رقم الهاتف */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {u.phoneNumber ? (
                          <span className="flex items-center gap-1.5" dir="ltr">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{u.phoneNumber}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* الأدوار */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {u.roles && u.roles.length > 0 ? (
                            u.roles.map((role) => {
                              const isAdminRole = role.toLowerCase() === "admin";
                              return (
                                <span
                                  key={role}
                                  className={`px-2 py-0.5 rounded-lg text-2xs font-bold inline-flex items-center gap-1 ${
                                    isAdminRole
                                      ? "bg-purple-50 text-purple-700 border border-purple-200/60"
                                      : "bg-blue-50 text-blue-700 border border-blue-200/60"
                                  }`}
                                >
                                  <Shield className="w-3 h-3" />
                                  <span>{getRoleLabel(role)}</span>
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-2xs text-slate-400 font-medium">بدون دور</span>
                          )}
                        </div>
                      </td>

                      {/* حالة الحساب */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>نشط</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>معطل</span>
                          </span>
                        )}
                      </td>

                      {/* تاريخ الإنشاء */}
                      <td className="py-3.5 px-4 text-slate-500 text-2xs whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(u.createdAt).toLocaleDateString("ar-EG")}</span>
                        </span>
                      </td>

                      {/* الإجراءات */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* زر إدارة الأدوار */}
                          {canAssignRoles && (
                            <button
                              onClick={() => setRoleModalUser(u)}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors cursor-pointer"
                              title="إدارة أدوار وصلاحيات المستخدم"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          )}

                          {/* زر تفعيل / تعطيل الحساب */}
                          {canManage && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                u.isActive
                                  ? "bg-rose-50 hover:bg-rose-100 text-rose-600"
                                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                              }`}
                              title={u.isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
                            >
                              {u.isActive ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {!canAssignRoles && !canManage && (
                            <span className="text-3xs text-slate-400 font-medium">عرض فقط</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. ترقيم الصفحات (Pagination) */}
        {!loading && totalPages > 1 && (
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-2xs text-slate-500 font-medium">
              الصفحة {pageNumber} من {totalPages} (إجمالي {totalCount} مستخدم)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                السابق
              </button>
              <button
                disabled={pageNumber >= totalPages}
                onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. مودال إدارة الأدوار لمستخدم محدد */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">إدارة أدوار المستخدم</h3>
                  <p className="text-2xs text-slate-500">{roleModalUser.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setRoleModalUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* التبديل السريع للدور الأساسي */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  التعيين السريع للدور الأساسي:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isUpdatingRole || roleModalUser.roles?.includes("WarehouseKeeper")}
                    onClick={() => handleQuickSwitchRole("WarehouseKeeper")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      roleModalUser.roles?.includes("WarehouseKeeper")
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-black cursor-default"
                        : "bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50"
                    } disabled:opacity-50`}
                  >
                    <span>أمين مخزن</span>
                    {roleModalUser.roles?.includes("WarehouseKeeper") && <span className="text-2xs">(الحالي)</span>}
                  </button>

                  <button
                    type="button"
                    disabled={isUpdatingRole || roleModalUser.roles?.includes("Admin")}
                    onClick={() => handleQuickSwitchRole("Admin")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      roleModalUser.roles?.includes("Admin")
                        ? "bg-purple-50 text-purple-700 border-purple-300 font-black cursor-default"
                        : "bg-white text-slate-700 border-slate-200 hover:border-purple-400 hover:bg-purple-50/50"
                    } disabled:opacity-50`}
                  >
                    <span>مدير نظام</span>
                    {roleModalUser.roles?.includes("Admin") && <span className="text-2xs">(الحالي)</span>}
                  </button>
                </div>
              </div>
              {/* الأدوار الحالية */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  الأدوار الممنوحة حالياً:
                </label>
                {roleModalUser.roles && roleModalUser.roles.length > 0 ? (
                  <div className="space-y-2">
                    {roleModalUser.roles.map((role) => (
                      <div
                        key={role}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-slate-800">{getRoleLabel(role)}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveRole(role)}
                          disabled={isUpdatingRole}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="سحب هذا الدور"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">لا توجد أدوار مسندة لهذا المستخدم حالياً</p>
                )}
              </div>

              {/* إضافة دور جديد */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  إسناد دور جديد:
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={newRoleToAdd}
                    onChange={(e) => {
                      setNewRoleToAdd(e.target.value);
                      if (roleValidationError) setRoleValidationError("");
                    }}
                    className={`flex-1 text-xs px-3 py-2 border rounded-xl bg-white text-slate-700 outline-none cursor-pointer ${
                      roleValidationError
                        ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                        : "border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                    }`}
                  >
                    <option value="">اختر دوراً لإضافته...</option>
                    {availableRoles
                      .filter((r) => !roleModalUser.roles?.includes(r))
                      .map((role) => (
                        <option key={role} value={role}>
                          {getRoleLabel(role)}
                        </option>
                      ))}
                  </select>

                  <button
                    onClick={handleAddRole}
                    disabled={isUpdatingRole}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>إسناد</span>
                  </button>
                </div>
                {roleValidationError && (
                  <p className="text-3xs text-rose-600 font-bold mt-1.5">{roleValidationError}</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 7. مودال إضافة موظف جديد */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onUserCreated={fetchUsers}
      />
    </div>
  );
}

export default UsersPage;
