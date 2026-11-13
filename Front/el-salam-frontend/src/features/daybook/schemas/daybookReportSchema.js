import { z } from "zod";
import { getDaysDifference } from "../../../utils/reportUtils";

/**
 * مخطط التحقق لتقرير دفتر اليومية (Zod)
 */
export const daybookReportSchema = z
  .object({
    fromDate: z
      .string({ required_error: "يرجى تحديد تاريخ البداية (من تاريخ)." })
      .trim()
      .min(1, "يرجى تحديد تاريخ البداية (من تاريخ)."),
    toDate: z
      .string({ required_error: "يرجى تحديد تاريخ النهاية (إلى تاريخ)." })
      .trim()
      .min(1, "يرجى تحديد تاريخ النهاية (إلى تاريخ)."),
    voucherType: z.number().nullable().optional(),
    source: z.number().nullable().optional(),
    unitType: z.number().nullable().optional(),
    categoryId: z.string().nullable().optional(),
  })
  .refine((data) => data.fromDate <= data.toDate, {
    message: "تاريخ البداية (من تاريخ) يجب أن يكون قبل أو يساوي تاريخ النهاية (إلى تاريخ).",
    path: ["fromDate"],
  })
  .refine((data) => getDaysDifference(data.fromDate, data.toDate) <= 366, {
    message: "الفترة المحددة طويلة جداً، الحد الأقصى المسموح به هو سنة واحدة (366 يوماً).",
    path: ["toDate"],
  });

/**
 * دالة التحقق من صحة فلاتر تقرير دفتر اليومية
 */
export function validateDaybookReport(data) {
  const result = daybookReportSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }

  const errors = {};
  if (result.error && result.error.issues) {
    for (const issue of result.error.issues) {
      const field = issue.path[0] || "general";
      if (!errors[field]) {
        errors[field] = issue.message;
      }
    }
  }

  return { success: false, errors };
}

