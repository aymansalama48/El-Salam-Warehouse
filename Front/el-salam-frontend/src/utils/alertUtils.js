import Swal from "sweetalert2";

// خيارات التصميم الموحدة للنظام
const defaultCustomClass = {
  popup: "salam-swal-popup",
  title: "salam-swal-title",
  htmlContainer: "salam-swal-content",
  actions: "salam-swal-actions",
  confirmButton: "salam-swal-btn-primary",
  cancelButton: "salam-swal-btn-secondary",
};

/**
 * رسالة نجاح
 */
export const showSuccess = (title = "تمت العملية بنجاح", text = "", timer = 2200) => {
  return Swal.fire({
    icon: "success",
    title,
    text,
    timer,
    timerProgressBar: true,
    showConfirmButton: !timer,
    confirmButtonText: "حسناً",
    customClass: defaultCustomClass,
    buttonsStyling: false,
  });
};

/**
 * رسالة خطأ
 */
export const showError = (title = "حدث خطأ ما", text = "يرجى المحاولة مرة أخرى لاحقاً") => {
  return Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonText: "إغلاق",
    customClass: defaultCustomClass,
    buttonsStyling: false,
  });
};

/**
 * رسالة تحذير
 */
export const showWarning = (title = "تنبيه", text = "") => {
  return Swal.fire({
    icon: "warning",
    title,
    text,
    confirmButtonText: "متابعة",
    customClass: defaultCustomClass,
    buttonsStyling: false,
  });
};

/**
 * رسالة معلومات
 */
export const showInfo = (title = "معلومة", text = "") => {
  return Swal.fire({
    icon: "info",
    title,
    text,
    confirmButtonText: "فهمت ذلك",
    customClass: defaultCustomClass,
    buttonsStyling: false,
  });
};

/**
 * نافذة تأكيد الإجراء (Confirm Dialog)
 */
export const showConfirm = async ({
  title = "هل أنت متأكد؟",
  text = "لا يمكن التراجع عن هذا الإجراء لاحقاً",
  confirmButtonText = "نعم، متأكد",
  cancelButtonText = "إلغاء",
  icon = "warning",
} = {}) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true, // في RTL الأفضل وضع زر التأكيد والإلغاء بترتيب طبيعي
    customClass: defaultCustomClass,
    buttonsStyling: false,
  });

  return result.isConfirmed;
};

/**
 * إشعار سريع زاوية الشاشة (Toast)
 */
export const showToast = (title, icon = "success") => {
  const Toast = Swal.mixin({
    toast: true,
    position: "bottom-start",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    customClass: {
      popup: "salam-swal-popup text-sm font-medium",
    },
  });

  return Toast.fire({
    icon,
    title,
  });
};

