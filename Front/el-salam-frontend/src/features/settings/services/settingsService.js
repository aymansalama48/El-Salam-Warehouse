import { apiClient, ENDPOINTS } from "../../../api";

/**
 * خدمة إعدادات المنشأة والشعار الرسمي
 */

export const getSettings = async () => {
  const data = await apiClient.get(ENDPOINTS.SETTINGS.GET);
  return data;
};

export const updateSettings = async (payload) => {
  const data = await apiClient.put(ENDPOINTS.SETTINGS.UPDATE, payload);
  return data;
};

export const uploadLogo = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const data = await apiClient.post(ENDPOINTS.SETTINGS.UPLOAD_LOGO, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

