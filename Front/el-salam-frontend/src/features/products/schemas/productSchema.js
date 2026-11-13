import { z } from "zod";

/**
 * أنواع وحدات المنتجات المدعومة بالنظام
 */
export const PRODUCT_UNIT_TYPES = {
  NOTEBOOK: 1, // كشكول (باكو / كشكول)
  BOOKLET: 2,  // كراس (باكو / كراس)
  COPY_PAPER: 3, // ورق تصوير (كرتونة / رزمة)
};

/**
 * @typedef {1 | 2 | 3} ProductUnitType
 * 1 = Notebook (كشكول)
 * 2 = Booklet (كراس)
 * 3 = CopyPaper (ورق تصوير)
 */

/**
 * @typedef {Object} ProductUnitTypeDto
 * @property {ProductUnitType} unitType
 * @property {string} displayName
 * @property {string} baseUnit
 * @property {string} subUnit
 * @property {1 | 2} entryUnit - 1 = SubUnit | 2 = BaseUnit
 */

/**
 * @typedef {Object} CreateProductRequest
 * @property {string} name
 * @property {string} categoryId
 * @property {ProductUnitType} unitType - نوع المنتج المحدد (الباك اند يحدد الوحدات منه)
 * @property {number} unitsPerBaseUnit
 * @property {number} initialStock
 * @property {string | null} [storageLocation]
 */

/**
 * @typedef {Object} UpdateProductRequest
 * @property {string} name
 * @property {string} categoryId
 * @property {ProductUnitType} unitType - نوع المنتج المحدد
 * @property {number} unitsPerBaseUnit
 * @property {string | null} [storageLocation]
 */

/**
 * @typedef {1 | 2 | 3} ProductStatus
 * 1 = InStock (متوفر)
 * 2 = LowStock (منخفض)
 * 3 = OutOfStock (نفد)
 */

/**
 * @typedef {Object} ProductDto
 * @property {string} id
 * @property {string} name
 * @property {string} categoryId
 * @property {string} categoryName
 * @property {string} categoryColorHex
 * @property {string} baseUnit
 * @property {string} subUnit
 * @property {number} unitsPerBaseUnit
 * @property {number} totalSubUnitStock
 * @property {number} fullBaseUnits
 * @property {number} remainingSubUnits
 * @property {1 | 2} entryUnit - 1 = SubUnit | 2 = BaseUnit
 * @property {ProductUnitType} unitType - نوع المنتج
 * @property {ProductStatus} status - 1: InStock, 2: LowStock, 3: OutOfStock
 * @property {string | null} storageLocation
 * @property {string} createdAt
 */

/**
 * @typedef {Object} ProductSummaryDto
 * @property {number} totalProducts - عدد الأصناف المسجلة
 * @property {number} notebookPackets - رصيد الكشاكيل والكراريس (باكو)
 * @property {number} notebookPieces - رصيد الكشاكيل والكراريس (كشكول)
 * @property {number} copyPaperCartons - رصيد كراتين ورق التصوير (كرتونة)
 * @property {number} copyPaperReams - إجمالي رزم ورق التصوير (رزمة)
 */

/**
 * مخطط التحقق لإضافة منتج جديد (CreateProductRequest)
 * يعتمد على unitType والباك اند هو المسؤول عن الوحدات وطريقة الرصيد
 */
export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "اسم المنتج مطلوب.")
    .max(200, "اسم المنتج لا يجب أن يتجاوز 200 حرف."),
  categoryId: z
    .string()
    .uuid("معرف الفئة غير صالح.")
    .or(z.string().min(1, "يجب تحديد فئة المنتج.")),
  unitType: z.union([z.literal(1), z.literal(2), z.literal(3)], {
    errorMap: () => ({ message: "يجب تحديد نوع منتج صحيح." }),
  }),
  unitsPerBaseUnit: z
    .coerce
    .number({ invalid_type_error: "يجب إدخال رقم صحيح لمحتوى الوحدة." })
    .int("محتوى الوحدة يجب أن يكون رقماً صحيحاً.")
    .positive("يجب أن يكون محتوى الوحدة أكبر من صفر."),
  initialStock: z
    .coerce
    .number({ invalid_type_error: "يجب إدخال رقم صحيح للرصيد." })
    .int("الرصيد يجب أن يكون رقماً صحيحاً.")
    .min(0, "الرصيد الافتتاحي لا يمكن أن يكون سالباً."),
  initialStockUnit: z
    .union([z.literal(1), z.literal(2)])
    .optional()
    .nullable(),
  lowStockThreshold: z
    .coerce
    .number({ invalid_type_error: "يجب إدخال رقم صحيح لحد التنبيه." })
    .int("حد التنبيه يجب أن يكون رقماً صحيحاً.")
    .min(0, "حد التنبيه لا يمكن أن يكون سالباً.")
    .optional(),
  lowStockThresholdUnit: z
    .union([z.literal(1), z.literal(2)])
    .optional()
    .nullable(),
  storageLocation: z
    .string()
    .trim()
    .max(150, "مكان التخزين لا يجب أن يتجاوز 150 حرفاً.")
    .optional()
    .nullable()
    .or(z.literal("")),
});

/**
 * مخطط التحقق لتعديل منتج (UpdateProductRequest)
 * لا يحتوي على أي حقول رصيد (الرصيد يتغير بالوارد والمنصرف فقط)
 */
export const updateProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "اسم المنتج مطلوب.")
    .max(200, "اسم المنتج لا يجب أن يتجاوز 200 حرف."),
  categoryId: z
    .string()
    .uuid("معرف الفئة غير صالح.")
    .or(z.string().min(1, "يجب تحديد فئة المنتج.")),
  unitType: z.union([z.literal(1), z.literal(2), z.literal(3)], {
    errorMap: () => ({ message: "يجب تحديد نوع منتج صحيح." }),
  }),
  unitsPerBaseUnit: z
    .coerce
    .number({ invalid_type_error: "يجب إدخال رقم صحيح لمحتوى الوحدة." })
    .int("محتوى الوحدة يجب أن يكون رقماً صحيحاً.")
    .positive("يجب أن يكون محتوى الوحدة أكبر من صفر."),
  lowStockThreshold: z
    .coerce
    .number({ invalid_type_error: "يجب إدخال رقم صحيح لحد التنبيه." })
    .int("حد التنبيه يجب أن يكون رقماً صحيحاً.")
    .min(0, "حد التنبيه لا يمكن أن يكون سالباً.")
    .optional(),
  lowStockThresholdUnit: z
    .union([z.literal(1), z.literal(2)])
    .optional()
    .nullable(),
  storageLocation: z
    .string()
    .trim()
    .max(150, "مكان التخزين لا يجب أن يتجاوز 150 حرفاً.")
    .optional()
    .nullable()
    .or(z.literal("")),
});

/**
 * دالة مساعدة لتشغيل التحقق وإرجاع الأخطاء مجمعة
 */
export function validateProduct(data, isEdit = false) {
  const schema = isEdit ? updateProductSchema : createProductSchema;
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }

  const errors = {};
  result.error.issues.forEach((issue) => {
    const field = issue.path[0];
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  });

  return { success: false, errors };
}

/**
 * مخطط التحقق لخيارات تقرير جرد المنتجات (Zod)
 */
export const productsReportSchema = z
  .object({
    selectionMode: z.enum(["all", "custom"]),
    selectedProductIds: z.array(z.string()),
  })
  .refine(
    (data) => data.selectionMode !== "custom" || data.selectedProductIds.length > 0,
    {
      message: "يرجى تحديد صنف واحد على الأقل، أو التبديل لخيار (جميع الأصناف).",
      path: ["selectedProductIds"],
    }
  );

/**
 * دالة التحقق من خيارات تقرير جرد الأصناف
 */
export function validateProductsReport(data) {
  const result = productsReportSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }

  const errors = {};
  result.error.issues.forEach((issue) => {
    const key = issue.path[0] || "general";
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  });

  return { success: false, errors };
}
