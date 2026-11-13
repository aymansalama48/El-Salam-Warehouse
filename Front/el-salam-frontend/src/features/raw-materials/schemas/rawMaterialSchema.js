import { z } from "zod";

/**
 * مخطط التحقق للمواد الخام ورولات الورق (Zod)
 */
export const rawMaterialSchema = z.object({
  name: z
    .string({ required_error: "اسم الخامة أو رول الورق مطلوب." })
    .trim()
    .min(2, "اسم الخامة مطلوب (حرفين على الأقل).")
    .max(100, "اسم الخامة لا يجب أن يتجاوز 100 حرف."),
  code: z
    .string({ required_error: "كود الخامة مطلوب." })
    .trim()
    .min(2, "كود الخامة مطلوب.")
    .max(50, "كود الخامة لا يجب أن يتجاوز 50 حرف."),
  type: z
    .string({ required_error: "نوع الخامة مطلوب." })
    .trim()
    .min(1, "نوع الخامة مطلوب."),
  quantity: z
    .coerce
    .number({ invalid_type_error: "الكمية يجب أن تكون رقماً صالحاً." })
    .min(0, "الكمية لا يمكن أن تكون سالبة."),
  unit: z
    .string({ required_error: "وحدة القياس مطلوبة." })
    .trim()
    .min(1, "وحدة القياس مطلوبة."),
  supplier: z
    .string()
    .trim()
    .max(100, "اسم المورد لا يجب أن يتجاوز 100 حرف.")
    .optional()
    .nullable()
    .or(z.literal("")),
  minimumAlert: z
    .coerce
    .number({ invalid_type_error: "حد الإنذار يجب أن يكون رقماً صالحاً." })
    .min(0, "حد الإنذار لا يمكن أن يكون سالباً."),
});

/**
 * دالة التحقق من صحة بيانات المادة الخام
 */
export function validateRawMaterial(data) {
  const result = rawMaterialSchema.safeParse(data);
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

