/**
 * خدمة بيانات وإدارة أصناف ومنتجات مصنع السلام للكراسات والحلول الورقية
 * متصلة مباشرة وبشكل حصري بـ ProductsController في الـ Backend عبر Axios
 * تدعم نوع المنتج (unitType) وإرجاع الوحدات المعتمدة من الخادم مباشرة
 */
import { apiClient, ENDPOINTS } from "../../../api";

/**
 * الأنواع الافتراضية لوحدات المنتجات (في حال تعذر الاتصال بالخادم مؤقتاً)
 */
export const DEFAULT_PRODUCT_UNIT_TYPES = [
  { unitType: 1, displayName: "كشكول", baseUnit: "باكو", subUnit: "كشكول", entryUnit: 1 },
  { unitType: 2, displayName: "كراس", baseUnit: "باكو", subUnit: "كراس", entryUnit: 1 },
  { unitType: 3, displayName: "ورق تصوير", baseUnit: "كرتونة", subUnit: "رزمة", entryUnit: 2 },
];

/**
 * جلب قائمة أنواع وحدات المنتجات المدعومة من الباك اند
 * GET /api/products/unit-types
 * @returns {Promise<Array<{unitType: number, displayName: string, baseUnit: string, subUnit: string, entryUnit: number}>>}
 */
export const getProductUnitTypes = async () => {
  try {
    const data = await apiClient.get(ENDPOINTS.PRODUCTS.UNIT_TYPES);
    if (Array.isArray(data) && data.length > 0) {
      return data.map((item) => ({
        unitType: Number(item.unitType ?? item.UnitType),
        displayName: item.displayName || item.DisplayName || "",
        baseUnit: item.baseUnit || item.BaseUnit || "",
        subUnit: item.subUnit || item.SubUnit || "",
        entryUnit: Number(item.entryUnit ?? item.EntryUnit ?? 1),
      }));
    }
  } catch (error) {
    console.warn("تعذر جلب أنواع الوحدات من السيرفر، تم استخدام القائمة الافتراضية:", error);
  }
  return DEFAULT_PRODUCT_UNIT_TYPES;
};

/**
 * دالة مساعدة لتنسيق وعرض الرصيد بالوحدة الكبيرة:
 * - `${fullBaseUnits} ${baseUnit}`
 * - لو remainingSubUnits > 0 اعرضها جنب الوحدة الكبيرة: `${fullBaseUnits} ${baseUnit} و ${remainingSubUnits} ${subUnit}`
 */
export function formatBaseUnitStock(product) {
  if (!product) return "";
  const baseUnit = product.baseUnit || "باكو";
  const subUnit = product.subUnit || "كشكول";
  const full = Number(product.fullBaseUnits ?? 0);
  const remaining = Number(product.remainingSubUnits ?? 0);
  const total = Number(product.totalSubUnitStock ?? 0);

  const baseText = remaining > 0 ? `${full.toLocaleString()} ${baseUnit} و ${remaining.toLocaleString()} ${subUnit}` : `${full.toLocaleString()} ${baseUnit}`;
  return total > 0 ? `${baseText} (${total.toLocaleString()} ${subUnit})` : baseText;
}

export function formatProductStock(product) {
  return formatBaseUnitStock(product);
}

/**
 * توحيد هيكل كائن المنتج القادم من DTO الخاص بـ ASP.NET Core
 */
export function normalizeProduct(dto) {
  if (!dto) return null;
  const raw = dto.data || dto.Data || dto;

  const unitsPerBaseUnit = Number(raw.unitsPerBaseUnit ?? raw.UnitsPerBaseUnit ?? 10);
  const totalSubUnitStock = Number(raw.totalSubUnitStock ?? raw.TotalSubUnitStock ?? 0);
  const fullBaseUnits = Number(raw.fullBaseUnits ?? raw.FullBaseUnits ?? 0);
  const remainingSubUnits = Number(raw.remainingSubUnits ?? raw.RemainingSubUnits ?? 0);
  const baseUnit = raw.baseUnit || raw.BaseUnit || "باكو";
  const subUnit = raw.subUnit || raw.SubUnit || (baseUnit === "كرتونة" ? "رزمة" : "كشكول");
  const unitType = Number(raw.unitType ?? raw.UnitType ?? (baseUnit === "كرتونة" ? 3 : subUnit === "كراس" ? 2 : 1));

  // الحالة تأتي مباشرة ومحسوبة بالكامل من الـ Backend:
  // 1 = InStock (متوفر) | 2 = LowStock (منخفض) | 3 = OutOfStock (نفد)
  const status = Number(raw.status ?? raw.Status ?? 1);
  const entryUnit = Number(raw.entryUnit ?? raw.EntryUnit ?? (unitType === 3 ? 2 : 1));
  const storageLocation = raw.storageLocation || raw.StorageLocation || "";

  const lowStockThreshold = Number(raw.lowStockThreshold ?? raw.LowStockThreshold ?? 0);
  const lowStockThresholdUnit = Number(raw.lowStockThresholdUnit ?? raw.LowStockThresholdUnit ?? (unitType === 3 ? 2 : 1));
  const lowStockThresholdSubUnits = Number(
    raw.lowStockThresholdSubUnits ??
      raw.LowStockThresholdSubUnits ??
      (lowStockThresholdUnit === 2 && unitsPerBaseUnit > 0 ? lowStockThreshold * unitsPerBaseUnit : lowStockThreshold)
  );

  return {
    id: raw.id || raw.Id || "",
    name: raw.name || raw.Name || "",
    categoryId: raw.categoryId || raw.CategoryId || "",
    categoryName: raw.categoryName || raw.CategoryName || raw.category?.name || "عام",
    categoryColorHex: raw.categoryColorHex || raw.CategoryColorHex || raw.category?.colorHex || "#2563EB",
    baseUnit,
    subUnit,
    unitsPerBaseUnit,
    totalSubUnitStock,
    fullBaseUnits,
    remainingSubUnits,
    entryUnit,
    unitType,
    storageLocation,
    status,
    lowStockThreshold,
    lowStockThresholdUnit,
    lowStockThresholdSubUnits,
    displayOrder: Number(raw.displayOrder ?? raw.DisplayOrder ?? 0),
    createdAt: raw.createdAt || raw.CreatedAt || null,
    updatedAt: raw.updatedAt || raw.UpdatedAt || null,
    createdByName: raw.createdByName || raw.CreatedByName || null,
    updatedByName: raw.updatedByName || raw.UpdatedByName || null,
  };
}

/**
 * توحيد كائن الصنف القادم من GET /api/products/lookup
 */
export function normalizeProductLookup(dto) {
  if (!dto) return null;
  const baseUnit = dto.baseUnit || dto.BaseUnit || "باكو";
  const subUnit = dto.subUnit || dto.SubUnit || "كشكول";
  const entryUnit = Number(dto.entryUnit ?? dto.EntryUnit ?? (baseUnit === "كرتونة" ? 2 : 1));
  const entryUnitLabel = dto.entryUnitLabel || dto.EntryUnitLabel || (entryUnit === 2 ? baseUnit : subUnit);
  const unitsPerBaseUnit = Number(dto.unitsPerBaseUnit ?? dto.UnitsPerBaseUnit ?? 10);
  const totalSubUnitStock = Number(dto.totalSubUnitStock ?? dto.TotalSubUnitStock ?? 0);
  const unitType = Number(dto.unitType ?? dto.UnitType ?? (baseUnit === "كرتونة" ? 3 : 1));

  return {
    id: dto.id || dto.Id || "",
    name: dto.name || dto.Name || "",
    categoryName: dto.categoryName || dto.CategoryName || "عام",
    baseUnit,
    subUnit,
    unitsPerBaseUnit,
    entryUnit,
    entryUnitLabel,
    availableInEntryUnit: Number(dto.availableInEntryUnit ?? dto.AvailableInEntryUnit ?? 0),
    unitType,
    totalSubUnitStock,
    displayOrder: Number(dto.displayOrder ?? dto.DisplayOrder ?? 0),
  };
}

/**
 * 1. جلب كل المنتجات (مع دعم البحث والفلترة بالفئة)
 * GET /api/products?search={search}&categoryId={categoryId}
 */
export const getProducts = async ({ search = "", categoryId = null } = {}) => {
  const params = {};
  if (search && search.trim()) {
    params.search = search.trim();
  }
  if (categoryId && categoryId !== "all") {
    params.categoryId = categoryId;
  }

  const data = await apiClient.get(ENDPOINTS.PRODUCTS.GET_ALL, { params });
  if (Array.isArray(data)) {
    return data.map(normalizeProduct);
  }
  return [];
};

/**
 * 2. جلب قائمة خفيفة ومخصصة للأصناف (Lookup) لاستخدامها في نماذج الإذونات (وارد وصرف)
 * GET /api/products/lookup?search={search}&notebooksOnly={notebooksOnly}&limit={limit}
 */
export const getProductsLookup = async ({ search = "", notebooksOnly = false } = {}) => {
  const params = {};
  if (notebooksOnly) {
    params.notebooksOnly = true;
  }
  if (search && search.trim()) {
    params.search = search.trim();
  }

  const data = await apiClient.get(ENDPOINTS.PRODUCTS.LOOKUP, { params });
  return Array.isArray(data) ? data.map(normalizeProductLookup) : [];
};

/**
 * 3. جلب منتج واحد بالتفصيل
 * GET /api/products/{id}
 */
export const getProductById = async (id) => {
  const data = await apiClient.get(ENDPOINTS.PRODUCTS.GET_BY_ID(id));
  return normalizeProduct(data);
};

/**
 * تحميل وطباعة ملف PDF الرسمي لبطاقة الصنف / المنتج التام
 * GET /api/products/{id}/pdf
 * @param {string} id
 * @returns {Promise<Blob>}
 */
export const getProductPdf = async (id) => {
  return await apiClient.get(ENDPOINTS.PRODUCTS.PDF(id), {
    responseType: "blob",
  });
};

/**
 * 4. جلب ملخص وإحصائيات الأصناف بالمستودع
 * GET /api/products/summary
 * @returns {Promise<{totalProducts: number, notebookPackets: number, notebookPieces: number, copyPaperCartons: number, copyPaperReams: number}>}
 */
export const getProductsSummary = async () => {
  const data = await apiClient.get(ENDPOINTS.PRODUCTS.SUMMARY);
  return {
    totalProducts: Number(data?.totalProducts ?? data?.TotalProducts ?? 0),
    notebookPackets: Number(data?.notebookPackets ?? data?.NotebookPackets ?? 0),
    notebookPieces: Number(data?.notebookPieces ?? data?.NotebookPieces ?? 0),
    copyPaperCartons: Number(data?.copyPaperCartons ?? data?.CopyPaperCartons ?? 0),
    copyPaperReams: Number(data?.copyPaperReams ?? data?.CopyPaperReams ?? 0),
  };
};

/**
 * 5. إضافة منتج جديد
 * POST /api/products
 * Body: { name, categoryId, unitType, unitsPerBaseUnit, initialStock, storageLocation }
 */
export const addProduct = async (productData) => {
  const payload = {
    name: productData.name.trim(),
    categoryId: productData.categoryId,
    unitType: Number(productData.unitType),
    unitsPerBaseUnit: Number(productData.unitsPerBaseUnit),
    initialStock: Number(productData.initialStock ?? 0),
    storageLocation: productData.storageLocation?.trim() || null,
    initialStockUnit: productData.initialStockUnit ? Number(productData.initialStockUnit) : null,
    lowStockThreshold: Number(productData.lowStockThreshold ?? 0),
    lowStockThresholdUnit: productData.lowStockThresholdUnit ? Number(productData.lowStockThresholdUnit) : null,
  };

  const response = await apiClient.post(ENDPOINTS.PRODUCTS.CREATE, payload);
  const id = typeof response === "string" ? response : response?.id || response?.Id;

  return normalizeProduct(
    typeof response === "object" && response?.id
      ? response
      : {
          id,
          ...payload,
        }
  );
};

/**
 * 6. تعديل منتج
 * PUT /api/products/{id}
 * Body: { name, categoryId, unitType, unitsPerBaseUnit, storageLocation, lowStockThreshold, lowStockThresholdUnit }
 */
export const updateProduct = async (id, productData) => {
  const payload = {
    name: productData.name.trim(),
    categoryId: productData.categoryId,
    unitType: Number(productData.unitType),
    unitsPerBaseUnit: Number(productData.unitsPerBaseUnit),
    storageLocation: productData.storageLocation?.trim() || null,
  };

  // إرسال حد النواقص فقط إذا تم تمريره صراحة لتجنب تصفير الحد في حالة التعديل البسيط (كاسم الصنف)
  if (productData.lowStockThreshold !== undefined && productData.lowStockThreshold !== null) {
    payload.lowStockThreshold = Number(productData.lowStockThreshold);
    payload.lowStockThresholdUnit = productData.lowStockThresholdUnit ? Number(productData.lowStockThresholdUnit) : null;
  }

  const response = await apiClient.put(ENDPOINTS.PRODUCTS.UPDATE(id), payload);

  return normalizeProduct(
    typeof response === "object" && response?.id
      ? response
      : {
          id,
          ...payload,
        }
  );
};

/**
 * تعديل حد النواقص لصنف واحد مباشرة
 * PUT /api/products/{id}/threshold
 */
export const updateProductThreshold = async (id, { lowStockThreshold, lowStockThresholdUnit }) => {
  const payload = {
    lowStockThreshold: Number(lowStockThreshold),
    lowStockThresholdUnit: lowStockThresholdUnit ? Number(lowStockThresholdUnit) : null,
  };
  return await apiClient.put(`/api/products/${id}/threshold`, payload);
};

/**
 * 7. حذف منتج
 * DELETE /api/products/{id}
 */
export const deleteProduct = async (id) => {
  await apiClient.delete(ENDPOINTS.PRODUCTS.DELETE(id));
  return { success: true, id };
};

/**
 * 6. إعادة ترتيب عرض المنتجات التامة
 * PUT /api/products/reorder
 * Body: { orderedIds: string[] }
 */
export const reorderProducts = async (orderedIds) => {
  return await apiClient.put(ENDPOINTS.PRODUCTS.REORDER, { orderedIds });
};

/**
 * 8. تحميل تقرير جرد المنتجات التامة بصيغة PDF
 * GET /api/products/report
 * GET /api/products/report?categoryId={guid}&productIds={guid1}&productIds={guid2}
 * @param {string|null} [categoryId] - فئة محددة أو null لكل الفئات
 * @param {string[]|null} [productIds] - مصفوفة معرفات الأصناف المحددة
 * @returns {Promise<Blob>}
 */
export const getProductsReportPdf = async (categoryId = null, productIds = null) => {
  const params = new URLSearchParams();
  if (categoryId && categoryId !== "all") {
    params.append("categoryId", categoryId);
  }
  if (Array.isArray(productIds) && productIds.length > 0) {
    productIds.forEach((id) => {
      if (id) params.append("productIds", id);
    });
  }

  return await apiClient.get(ENDPOINTS.PRODUCTS.REPORT, {
    params,
    responseType: "blob",
  });
};

/**
 * 9. جلب حدود تنبيه النواقص لجميع الأصناف
 * GET /api/products/stock-alerts/thresholds
 */
export const getStockAlertThresholds = async () => {
  const data = await apiClient.get(ENDPOINTS.PRODUCTS.STOCK_ALERT_THRESHOLDS);
  const raw = data?.data || data;
  return {
    packetThreshold: Number(raw?.packetThreshold ?? raw?.PacketThreshold ?? 100),
    cartonThreshold: Number(raw?.cartonThreshold ?? raw?.CartonThreshold ?? 50),
    items: Array.isArray(raw?.items)
      ? raw.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          categoryName: item.categoryName,
          unitType: Number(item.unitType),
          baseUnit: item.baseUnit,
          subUnit: item.subUnit,
          unitsPerBaseUnit: Number(item.unitsPerBaseUnit),
          totalSubUnitStock: Number(item.totalSubUnitStock),
          fullBaseUnits: Number(item.fullBaseUnits),
          remainingSubUnits: Number(item.remainingSubUnits),
          lowStockThreshold: Number(item.lowStockThreshold),
          lowStockThresholdUnit: Number(item.lowStockThresholdUnit ?? (item.unitType === 3 ? 2 : 1)),
          lowStockThresholdSubUnits: Number(item.lowStockThresholdSubUnits),
        }))
      : [],
  };
};

/**
 * 10. تعديل حدود تنبيه النواقص (دعم تحديث قائمة الأصناف أو الحدود العامة)
 * PUT /api/products/stock-alerts/thresholds
 */
export const updateStockAlertThresholds = async (payload) => {
  const data = await apiClient.put(ENDPOINTS.PRODUCTS.STOCK_ALERT_THRESHOLDS, payload);
  return data;
};
