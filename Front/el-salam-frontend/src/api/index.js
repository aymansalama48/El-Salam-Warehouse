import { axiosInstance } from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import { ApiError } from "./interceptors";

export const apiClient = {
  get: (url, config) => axiosInstance.get(url, config),
  post: (url, data, config) => axiosInstance.post(url, data, config),
  put: (url, data, config) => axiosInstance.put(url, data, config),
  delete: (url, config) => axiosInstance.delete(url, config),
  patch: (url, data, config) => axiosInstance.patch(url, data, config),
};

export { axiosInstance, ENDPOINTS, ApiError };
export default apiClient;

