import { z } from "zod";

/**
 * مخطط التحقق لتسجيل الدخول (Login Schema)
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: "البريد الإلكتروني مطلوب." })
    .trim()
    .min(1, "البريد الإلكتروني مطلوب.")
    .email("صيغة البريد الإلكتروني غير صالحة."),
  password: z
    .string({ required_error: "كلمة المرور مطلوبة." })
    .min(1, "كلمة المرور مطلوبة."),
});

/**
 * مخطط التحقق لبيانات الملف الشخصي (Profile Schema)
 */
export const profileSchema = z.object({
  firstName: z
    .string({ required_error: "الاسم الأول مطلوب." })
    .trim()
    .min(1, "الاسم الأول مطلوب.")
    .max(50, "الاسم الأول لا يجب أن يتجاوز 50 حرف."),
  middleName: z
    .string()
    .trim()
    .max(50, "الاسم الأوسط لا يجب أن يتجاوز 50 حرف.")
    .optional()
    .nullable()
    .or(z.literal("")),
  lastName: z
    .string({ required_error: "اللقب أو اسم العائلة مطلوب." })
    .trim()
    .min(1, "اللقب أو اسم العائلة مطلوب.")
    .max(50, "اللقب لا يجب أن يتجاوز 50 حرف."),
  phoneNumber: z
    .string()
    .trim()
    .refine(
      (val) => !val || /^01[0125][0-9]{8}$/.test(val),
      "رقم الهاتف غير صالح، يجب أن يكون 11 رقماً ويبدأ بـ 010 أو 011 أو 012 أو 015."
    )
    .optional()
    .nullable()
    .or(z.literal("")),
});

/**
 * مخطط التحقق لتغيير كلمة المرور (Change Password Schema)
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: "كلمة المرور الحالية مطلوبة." })
      .min(1, "كلمة المرور الحالية مطلوبة."),
    newPassword: z
      .string({ required_error: "كلمة المرور الجديدة مطلوبة." })
      .min(6, "كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف."),
    confirmNewPassword: z
      .string({ required_error: "يرجى تأكيد كلمة المرور الجديدة." })
      .min(1, "يرجى تأكيد كلمة المرور الجديدة."),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "كلمة المرور الجديدة غير متطابقة مع التأكيد.",
    path: ["confirmNewPassword"],
  });

/**
 * مخطط التحقق لإسناد دور وظيفي للمستخدم
 */
export const assignRoleSchema = z.object({
  roleName: z
    .string({ required_error: "يرجى اختيار دور وظيفي." })
    .trim()
    .min(1, "يرجى اختيار دور وظيفي لإسناده."),
});

/**
 * دالة استخراج أخطاء Zod الموحدة
 */
function extractErrors(result) {
  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }

  const errors = {};
  if (result.error && result.error.issues) {
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (field && !errors[field]) {
        errors[field] = issue.message;
      }
    }
  }

  return { success: false, errors };
}

export function validateLogin(data) {
  return extractErrors(loginSchema.safeParse(data));
}

export function validateProfile(data) {
  return extractErrors(profileSchema.safeParse(data));
}

export function validateChangePassword(data) {
  return extractErrors(changePasswordSchema.safeParse(data));
}

export function validateAssignRole(data) {
  return extractErrors(assignRoleSchema.safeParse(data));
}

/**
 * مخطط التحقق لإنشاء موظف / مستخدم جديد
 */
export const createUserSchema = z
  .object({
    firstName: z
      .string({ required_error: "الاسم الأول مطلوب." })
      .trim()
      .min(1, "الاسم الأول مطلوب.")
      .max(50, "الاسم الأول لا يجب أن يتجاوز 50 حرف."),
    middleName: z
      .string()
      .trim()
      .max(50, "الاسم الأوسط لا يجب أن يتجاوز 50 حرف.")
      .optional()
      .nullable()
      .or(z.literal("")),
    lastName: z
      .string({ required_error: "اسم العائلة مطلوب." })
      .trim()
      .min(1, "اسم العائلة مطلوب.")
      .max(50, "اسم العائلة لا يجب أن يتجاوز 50 حرف."),
    email: z
      .string({ required_error: "البريد الإلكتروني مطلوب." })
      .trim()
      .min(1, "البريد الإلكتروني مطلوب.")
      .email("صيغة البريد الإلكتروني غير صالحة."),
    phoneNumber: z
      .string()
      .trim()
      .refine(
        (val) => !val || /^01[0125][0-9]{8}$/.test(val),
        "رقم الهاتف غير صالح، يجب أن يكون 11 رقماً ويبدأ بـ 010 أو 011 أو 012 أو 015."
      )
      .optional()
      .nullable()
      .or(z.literal("")),
    role: z
      .string({ required_error: "يرجى تحديد الدور الوظيفي." })
      .trim()
      .min(1, "يرجى تحديد الدور الوظيفي للموظف."),
    password: z
      .string({ required_error: "كلمة المرور مطلوبة." })
      .min(6, "يجب ألا تقل كلمة المرور عن 6 أحرف."),
    confirmPassword: z
      .string({ required_error: "يرجى تأكيد كلمة المرور." })
      .min(1, "يرجى تأكيد كلمة المرور."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمة المرور غير متطابقة مع التأكيد.",
    path: ["confirmPassword"],
  });

export function validateCreateUser(data) {
  return extractErrors(createUserSchema.safeParse(data));
}

