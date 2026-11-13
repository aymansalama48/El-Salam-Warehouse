import { z } from "zod";

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const categorySchema = z.object({
  name: z
    .string({ required_error: "اسم الفئة مطلوب." })
    .trim()
    .min(1, "اسم الفئة مطلوب.")
    .max(100, "اسم الفئة لا يجب أن يتجاوز 100 حرف."),
  colorHex: z
    .string({ required_error: "لون التمييز مطلوب." })
    .trim()
    .min(1, "لون التمييز مطلوب.")
    .regex(HEX_COLOR_REGEX, "تنسيق اللون غير صحيح (يجب أن يكون كود HEX صالح، مثال: #2563EB)."),
  description: z
    .string()
    .max(500, "الوصف لا يجب أن يتجاوز 500 حرف.")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export const updateCategorySchema = categorySchema.extend({
  id: z.string({ required_error: "معرف الفئة مطلوب." }).min(1, "معرف الفئة مطلوب."),
});

/**
 * دالة مساعدة لتشغيل الفاليديشن واستخراج رسائل الأخطاء
 */
export function validateCategory(data, isEdit = false) {
  const schema = isEdit ? updateCategorySchema : categorySchema;
  const result = schema.safeParse(data);
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

