import axiosInstance from "../../../api/axiosInstance";
import { ENDPOINTS } from "../../../api/endpoints";

/**
 * سيرفيس شامل للمصادقة وإدارة حسابات المستخدمين والصلاحيات
 * متطابق بالكامل مع الـ Endpoints الخاصة بـ AccountsController و PermissionManagementController
 */
export const authService = {
  // 1. تسجيل الدخول
  async login({ email, password }) {
    return await axiosInstance.post(ENDPOINTS.ACCOUNTS.LOGIN, {
      email,
      password,
    });
  },

  // 2. تجديد التوكن
  async refreshToken(refreshToken) {
    return await axiosInstance.post(ENDPOINTS.ACCOUNTS.REFRESH, {
      refreshToken,
    });
  },

  // 3. تسجيل الخروج
  async logout(refreshToken) {
    return await axiosInstance.post(ENDPOINTS.ACCOUNTS.LOGOUT, {
      refreshToken,
    });
  },

  // 4. تغيير كلمة المرور للمستخدم الحالي
  async changePassword({ currentPassword, newPassword, confirmNewPassword }) {
    return await axiosInstance.post(ENDPOINTS.ACCOUNTS.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
  },

  // 5. استرجاع بيانات الملف الشخصي للمستخدم الحالي
  async getMyProfile() {
    return await axiosInstance.get(ENDPOINTS.ACCOUNTS.ME);
  },

  // 6. تحديث بيانات الملف الشخصي للمستخدم الحالي
  async updateMyProfile({ firstName, middleName, lastName, phoneNumber }) {
    return await axiosInstance.put(ENDPOINTS.ACCOUNTS.ME, {
      firstName,
      middleName,
      lastName,
      phoneNumber,
    });
  },

  // 7. تحديث رابط الصورة الشخصية
  async updateProfilePicture(avatarUrl) {
    return await axiosInstance.patch(ENDPOINTS.ACCOUNTS.ME_PICTURE, {
      avatarUrl,
    });
  },

  // 8. جلب مستخدمي النظام مع دعم البحث والفلترة والترقيم
  async getAllUsers({ pageNumber = 1, pageSize = 10, role = "", searchTerm = "" } = {}) {
    const params = { pageNumber, pageSize };
    if (role) params.role = role;
    if (searchTerm) params.searchTerm = searchTerm;

    return await axiosInstance.get(ENDPOINTS.ACCOUNTS.USERS, { params });
  },

  // إنشاء حساب موظف جديد في النظام
  async createUser(userData) {
    return await axiosInstance.post(ENDPOINTS.ACCOUNTS.USERS, userData);
  },

  // 9. تفعيل حساب مستخدم
  async activateUser(userId) {
    return await axiosInstance.patch(ENDPOINTS.ACCOUNTS.ACTIVATE(userId));
  },

  // 10. تعطيل حساب مستخدم
  async deactivateUser(userId) {
    return await axiosInstance.patch(ENDPOINTS.ACCOUNTS.DEACTIVATE(userId));
  },

  // 11. إسناد دور لمستخدم
  async assignRoleToUser(userId, roleName) {
    return await axiosInstance.post(ENDPOINTS.ACCOUNTS.ASSIGN_ROLE(userId), {
      roleName,
    });
  },

  // 12. إزالة دور من مستخدم
  async removeRoleFromUser(userId, roleName) {
    return await axiosInstance.delete(ENDPOINTS.ACCOUNTS.REMOVE_ROLE(userId, roleName));
  },

  // 13. جلب جميع الصلاحيات المعرفة في السيستم
  async getAllPermissions() {
    return await axiosInstance.get(ENDPOINTS.PERMISSIONS.BASE);
  },

  // 14. جلب الأدوار مع قائمة صلاحيات كل دور
  async getAllRolesWithPermissions() {
    return await axiosInstance.get(ENDPOINTS.PERMISSIONS.ROLES);
  },

  // 15. جلب صلاحيات دور معين عبر معرفه
  async getRolePermissions(roleId) {
    return await axiosInstance.get(ENDPOINTS.PERMISSIONS.ROLE_BY_ID(roleId));
  },

  // 16. تحديث وتعيين كامل قائمة صلاحيات دور معين
  async updateRolePermissions(roleId, permissionIds) {
    return await axiosInstance.put(
      ENDPOINTS.PERMISSIONS.ROLE_PERMISSIONS(roleId),
      permissionIds
    );
  },

  // 17. إسناد صلاحية منفردة لدور
  async assignPermissionToRole(roleId, permissionId) {
    return await axiosInstance.post(
      ENDPOINTS.PERMISSIONS.ASSIGN_ROLE_PERMISSION(roleId, permissionId)
    );
  },

  // 18. حذف صلاحية منفردة من دور
  async removePermissionFromRole(roleId, permissionId) {
    return await axiosInstance.delete(
      ENDPOINTS.PERMISSIONS.REMOVE_ROLE_PERMISSION(roleId, permissionId)
    );
  },
};

