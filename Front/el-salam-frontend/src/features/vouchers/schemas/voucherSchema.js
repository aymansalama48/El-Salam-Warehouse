import { z } from "zod";

/**
 * أنواع أذونات المخزن
 * 1 = وارد | 2 = صرف | 3 = مرتجع
 */
export const VOUCHER_TYPE = {
  INBOUND: 1,
  OUTBOUND: 2,
  RETURN: 3,
};

/**
 * اتجاه حركة المرتجع
 * 1 = وارد إلى المخزن (استلام بضاعة مرتجعة - زيادة رصيد)
 * 2 = منصرف من المخزن (إرجاع بضاعة لمورد - خصم رصيد)
 */
export const RETURN_DIRECTION = {
  INBOUND: 1,
  OUTBOUND: 2,
};

/**
 * مصدر الإذن
 * 1 = جهة خارجية | 2 = صالة الإنتاج
 */
export const VOUCHER_SOURCE = {
  EXTERNAL: 1,
  PRODUCTION: 2,
};

/**
 * حالة الإذن
 * 1 = فعّال | 2 = ملغي
 */
export const VOUCHER_STATUS = {
  ACTIVE: 1,
  CANCELLED: 2,
};

/**
 * وحدة التسجيل للإذن
 * 1 = SubUnit (بالقطعة / كشكول / كراسة / رزمة)
 * 2 = BaseUnit (بالكرتونة)
 */
export const STOCK_ENTRY_UNIT = {
  SUB_UNIT: 1,
  BASE_UNIT: 2,
};

/**
 * بند إذن المخزن
 */
export const voucherItemSchema = z.object({
  productId: z.string().min(1, "يجب تحديد الصنف"),
  quantity: z
    .coerce
    .number({ invalid_type_error: "يجب إدخال كمية صحيحة" })
    .positive("الكمية يجب أن تكون أكبر من صفر"),
  entryUnit: z.union([z.literal(1), z.literal(2)]).optional().nullable(),
});

/**
 * مخطط التحقق لإنشاء إذن مخزن جديد (StockVoucher)
 */
export const createVoucherSchema = z
  .object({
    type: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "صيغة التاريخ غير صالحة")
      .nullable()
      .optional(),
    source: z.union([z.literal(1), z.literal(2)]),
    partyName: z.string().nullable().optional(),
    receiverName: z.string().trim().min(1, "اسم المستلم مطلوب"),
    delivererName: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    returnDirection: z.union([z.literal(1), z.literal(2)]).nullable().optional(),
    returnReason: z.string().nullable().optional(),
    items: z.array(voucherItemSchema).min(1, "يجب إضافة صنف واحد على الأقل في الإذن"),
  })
  .superRefine((data, ctx) => {
    // 1) وارد + جهة خارجية (type = 1, source = 1)
    if (data.type === 1 && data.source === 1) {
      if (!data.partyName || !data.partyName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "اسم المورّد / الجهة الخارجية مطلوب",
          path: ["partyName"],
        });
      }
      if (!data.delivererName || !data.delivererName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "اسم الشخص المُسلِّم (الجايب) مطلوب",
          path: ["delivererName"],
        });
      }
    }

    // 2) وارد + صالة الإنتاج (type = 1, source = 2)
    if (data.type === 1 && data.source === 2) {
      if (!data.delivererName || !data.delivererName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "اسم الشخص المُسلِّم (مسؤول صالة الإنتاج) مطلوب",
          path: ["delivererName"],
        });
      }
    }

    // 3) صرف (type = 2)
    if (data.type === 2) {
      if (!data.partyName || !data.partyName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "اسم الجهة المنصرف إليها مطلوب",
          path: ["partyName"],
        });
      }
    }

    // 4) مرتجع (type = 3)
    if (data.type === 3) {
      if (!data.partyName || !data.partyName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: data.returnDirection === 2 ? "اسم المورد / الجهة المرتجع إليها مطلوب" : "اسم العميل / الجهة المرتجع منها مطلوب",
          path: ["partyName"],
        });
      }
      if (!data.returnReason || !data.returnReason.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "سبب الإرجاع مطلوب لإذن المرتجع",
          path: ["returnReason"],
        });
      }
    }

    // فحص عدم تكرار الصنف في نفس الإذن
    const ids = data.items.map((it) => it.productId).filter(Boolean);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "لا يمكن تكرار نفس الصنف أكثر من مرة في الإذن الواحد",
        path: ["items"],
      });
    }
  });

/**
 * التحقق من صحة بيانات الإذن وإرجاع رسائل الأخطاء إن وجدت
 */
export function validateVoucher(data) {
  const result = createVoucherSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }

  const errors = {};
  result.error.issues.forEach((issue) => {
    const key = issue.path[0] ?? "general";
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  });

  return { success: false, errors };
}

/**
 * مخطط التحقق لإلغاء إذن مخزن (Cancel Voucher Schema)
 */
export const cancelVoucherSchema = z.object({
  reason: z
    .string({ required_error: "يجب إدخال سبب إلغاء الإذن." })
    .trim()
    .min(3, "يجب إدخال سبب إلغاء مفصل ومفهوم (3 أحرف على الأقل).")
    .max(300, "سبب الإلغاء لا يجب أن يتجاوز 300 حرف."),
});

/**
 * التحقق من صحة سبب إلغاء الإذن
 */
export function validateCancelVoucher(data) {
  const result = cancelVoucherSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }

  const errors = {};
  result.error.issues.forEach((issue) => {
    const key = issue.path[0] ?? "general";
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  });

  return { success: false, errors };
}

