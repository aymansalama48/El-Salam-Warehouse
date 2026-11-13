import { z } from "zod";

/**
 * مخطط التحقق لبيانات العملاء ومنافذ التوزيع (Zod)
 */
export const customerSchema = z.object({
  name: z
    .string({ required_error: "اسم العميل أو المنشأة مطلوب." })
    .trim()
    .min(2, "اسم العميل مطلوب (حرفين على الأقل).")
    .max(100, "اسم العميل لا يجب أن يتجاوز 100 حرف."),
  contactPerson: z
    .string()
    .trim()
    .max(100, "اسم المسؤول لا يجب أن يتجاوز 100 حرف.")
    .optional()
    .nullable()
    .or(z.literal("")),
  phone: z
    .string({ required_error: "رقم الهاتف مطلوب." })
    .trim()
    .min(5, "رقم الهاتف مطلوب ومكون من 5 أرقام على الأقل."),
  email: z
    .string()
    .trim()
    .email("صيغة البريد الإلكتروني غير صالحة.")
    .optional()
    .nullable()
    .or(z.literal("")),
  city: z
    .string()
    .trim()
    .max(100, "المدينة / المحافظة لا يجب أن تتجاوز 100 حرف.")
    .optional()
    .nullable()
    .or(z.literal("")),
  category: z
    .string({ required_error: "نوع النشاط التجاري مطلوب." })
    .trim()
    .min(1, "نوع النشاط التجاري مطلوب."),
});

/**
 * دالة التحقق من صحة بيانات العميل
 */
export function validateCustomer(data) {
  const result = customerSchema.safeParse(data);
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

