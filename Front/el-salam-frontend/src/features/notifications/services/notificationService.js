import { apiClient, ENDPOINTS } from "../../../api";

/**
 * خدمة جلب الإشعارات والتنبيهات الحية للمستودع
 */
export const notificationService = {
  /**
   * جلب قائمة الإشعارات والتنبيهات الحية من الخادم
   * @param {number} limit 
   * @returns {Promise<Array>}
   */
  async getNotifications(limit = 20) {
    try {
      const response = await apiClient.get(ENDPOINTS.NOTIFICATIONS.GET_ALL, {
        params: { limit },
      });
      return Array.isArray(response) ? response : (response?.data || []);
    } catch (error) {
      console.error("فشل في جلب الإشعارات من الخادم:", error);
      return [];
    }
  },
};

export default notificationService;

