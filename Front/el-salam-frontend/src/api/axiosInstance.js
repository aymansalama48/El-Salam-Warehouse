import axios from "axios";
import { setupInterceptors } from "./interceptors";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // مهلة كافية حتى 60 ثانية لتفادي انقطاع الاتصال في الخوادم السحابية المشتركة
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// تفعيل المعترضات المركزية (Interceptors)
setupInterceptors(axiosInstance);

export default axiosInstance;

