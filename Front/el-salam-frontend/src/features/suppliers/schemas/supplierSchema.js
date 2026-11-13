import { z } from "zod";

/**
 * مخطط التحقق لبيانات موردي الخامات (Zod)
 */
export const supplierSchema = z.object({
  name: z
    .string({ required_error: "اسم شركة أو جهة التوريد مطلوب." })
    .trim()
    .min(2, "اسم المورد مطلوب (حرفين على الأقل).")
    .max(100, "اسم المورد لا يجب أن يتجاوز 100 حرف."),
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
  supplyType: z
    .string({ required_error: "نوع التوريد مطلوب." })
    .trim()
    .min(1, "نوع التوريد مطلوب."),
  address: z
    .string()
    .trim()
    .max(150, "العنوان لا يجب أن يتجاوز 150 حرف.")
    .optional()
    .nullable()
    .or(z.literal("")),
  taxNumber: z
    .string()
    .trim()
    .max(50, "السجل الضريبي لا يجب أن يتجاوز 50 حرف.")
    .optional()
    .nullable()
    .or(z.literal("")),
});

/**
 * دالة التحقق من صحة بيانات المورد
 */
export function validateSupplier(data) {
  const result = supplierSchema.safeParse(data);
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

