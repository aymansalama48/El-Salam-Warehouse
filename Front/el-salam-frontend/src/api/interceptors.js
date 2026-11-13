import axios from "axios";

/**
 * فئة مخصصة لأخطاء الـ API
 */
export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

// متغيرات طابور تجديد التوكن لمنع تكرار طلبات التجديد المتزامنة
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * تجهيز معترضات الـ Request و الـ Response لـ Axios
 */
export function setupInterceptors(axiosInstance) {
  // 1. معترض الطلبات (Request Interceptor)
  axiosInstance.interceptors.request.use(
    (config) => {
      // إرفاق التوكن في حال توفره
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 2. معترض الاستجابات (Response Interceptor)
  axiosInstance.interceptors.response.use(
    (response) => {
      // إذا كانت الاستجابة 204 No Content
      if (response.status === 204) {
        return { success: true };
      }

      const resData = response.data;

      // تفريغ البيانات تلقائياً من غلاف Result<T> الخاص بـ ASP.NET Core: { data: [...] }
      if (resData && typeof resData === "object" && "data" in resData) {
        return resData.data;
      }

      return resData;
    },
    async (error) => {
      const originalRequest = error.config;

      // في حالة انقطاع الاتصال أو عدم تشغيل السيرفر
      if (!error.response) {
        const networkMessage =
          error.code === "ECONNABORTED"
            ? "انتهت مهلة انتظار الخادم، يرجى المحاولة لاحقاً."
            : "تعذر الاتصال بخادم الـ Backend - يرجى التأكد من تشغيل السيرفر.";
        return Promise.reject(new ApiError(networkMessage, 0, error));
      }

      const { status } = error.response;
      const isAuthEndpoint =
        originalRequest?.url?.includes("/accounts/login") ||
        originalRequest?.url?.includes("/accounts/refresh-token");

      // محاولة تجديد التوكن تلقائياً عند انتهاء الصلاحية (401 Unauthorized)
      if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
        const refreshToken = localStorage.getItem("refresh_token");

        if (refreshToken) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return axiosInstance(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const baseURL = axiosInstance.defaults.baseURL || "/api";
            const refreshResponse = await axios.post(`${baseURL}/accounts/refresh-token`, {
              refreshToken,
            });

            const authData = refreshResponse.data?.data || refreshResponse.data;

            if (authData?.accessToken) {
              localStorage.setItem("auth_token", authData.accessToken);
              if (authData.refreshToken) {
                localStorage.setItem("refresh_token", authData.refreshToken);
              }
              if (authData.fullName) {
                localStorage.setItem(
                  "auth_user",
                  JSON.stringify({
                    userId: authData.userId,
                    email: authData.email,
                    fullName: authData.fullName,
                    roles: authData.roles || [],
                  })
                );
              }

              processQueue(null, authData.accessToken);
              originalRequest.headers.Authorization = `Bearer ${authData.accessToken}`;
              return axiosInstance(originalRequest);
            }
          } catch (refreshErr) {
            processQueue(refreshErr, null);
            localStorage.removeItem("auth_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("auth_user");
            window.dispatchEvent(new Event("auth:logout"));
          } finally {
            isRefreshing = false;
          }
        } else {
          // لا يوجد refresh token، نمسح بيانات الجلسة ونوجه لتسجيل الدخول
          localStorage.removeItem("auth_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("auth_user");
          window.dispatchEvent(new Event("auth:logout"));
        }
      }

      let data = error.response.data;
      let message = "حدث خطأ أثناء معالجة الطلب";

      // إذا كان الطلب responseType: 'blob' والباك إند أرجع خطأ بصيغة JSON
      if (typeof Blob !== "undefined" && data instanceof Blob) {
        try {
          const text = await data.text();
          data = JSON.parse(text);
        } catch {
          // ليس كائن JSON صالح
        }
      }

      // قراءة رسائل الـ ProblemDetails / FluentValidation الصادرة من الباك إند
      if (typeof data === "object" && data !== null) {
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          message = data.errors[0]?.description || data.errors[0]?.Description || message;
        } else if (data.errors && typeof data.errors === "object") {
          // في حال أرجع الـ ModelState قاموس أخطاء: { "Name": ["..."] }
          const firstKey = Object.keys(data.errors)[0];
          if (firstKey && Array.isArray(data.errors[firstKey])) {
            message = data.errors[firstKey][0];
          }
        } else {
          message = data.detail || data.Detail || data.title || data.Title || data.message || message;
        }
      }

      return Promise.reject(new ApiError(message, status, data));
    }
  );
}
