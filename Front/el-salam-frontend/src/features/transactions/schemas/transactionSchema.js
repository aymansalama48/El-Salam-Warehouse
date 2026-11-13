import { z } from "zod";

/**
 * مخطط التحقق لمعاملات المستودع (Zod)
 */
export const transactionSchema = z.object({
  type: z.enum(["inflow", "outflow"], { required_error: "نوع الحركة مطلوب." }),
  itemName: z
    .string({ required_error: "اسم الصنف مطلوب." })
    .trim()
    .min(1, "اسم الصنف مطلوب."),
  packsCount: z
    .coerce
    .number({ invalid_type_error: "عدد البواكي/الكراتين يجب أن يكون رقماً صحيحاً." })
    .positive("عدد البواكي/الكراتين يجب أن يكون أكبر من صفر."),
  party: z
    .string({ required_error: "الجهة المستلمة أو الموردة مطلوبة." })
    .trim()
    .min(1, "الجهة المستلمة أو الموردة مطلوبة."),
  referenceDoc: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
  officer: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
});

/**
 * دالة التحقق من صحة بيانات المعاملة
 */
export function validateTransaction(data) {
  const result = transactionSchema.safeParse(data);
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

