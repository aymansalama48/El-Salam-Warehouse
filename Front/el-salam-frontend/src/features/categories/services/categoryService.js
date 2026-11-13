/**
 * خدمة إدارة فئات وتصنيفات منتجات مصنع السلام
 * مبنية بالكامل باستخدام Axios وطبقة الـ API المقسمة المركزية
 */
import { apiClient, ENDPOINTS } from "../../../api";

/**
 * توحيد هيكل كائن الفئة القادم من DTO الخاص بـ ASP.NET Core مع الواجهة
 */
export function normalizeCategory(dto) {
  if (!dto) return null;
  const raw = dto.data || dto.Data || dto;
  return {
    id: raw.id || raw.Id || "",
    name: raw.name || raw.Name || "",
    description: raw.description || raw.Description || "",
    colorHex: raw.colorHex || raw.ColorHex || "#2563EB",
    productsCount: Number(raw.productsCount ?? raw.ProductsCount ?? 0),
    displayOrder: Number(raw.displayOrder ?? raw.DisplayOrder ?? 0),
    createdAt: raw.createdAt || raw.CreatedAt || null,
    updatedAt: raw.updatedAt || raw.UpdatedAt || null,
    createdByName: raw.createdByName || raw.CreatedByName || null,
    updatedByName: raw.updatedByName || raw.UpdatedByName || null,
  };
}

/**
 * 1. جلب كل الفئات (مع دعم البحث)
 * GET /api/categories?search={search}
 */
export const getCategories = async (searchTerm = "") => {
  const config = {};
  if (searchTerm && searchTerm.trim()) {
    config.params = { search: searchTerm.trim() };
  }

  const data = await apiClient.get(ENDPOINTS.CATEGORIES.GET_ALL, config);
  if (Array.isArray(data)) {
    return data.map(normalizeCategory);
  }
  return [];
};

/**
 * 2. جلب فئة واحدة بالتفصيل
 * GET /api/categories/{id}
 */
export const getCategoryById = async (id) => {
  const data = await apiClient.get(ENDPOINTS.CATEGORIES.GET_BY_ID(id));
  return normalizeCategory(data);
};

/**
 * 3. إضافة فئة جديدة
 * POST /api/categories
 * Body: { name, description, colorHex }
 */
export const addCategory = async (categoryData) => {
  const payload = {
    name: categoryData.name.trim(),
    description: categoryData.description?.trim() || null,
    colorHex: categoryData.colorHex.toUpperCase(),
  };

  const response = await apiClient.post(ENDPOINTS.CATEGORIES.CREATE, payload);
  const id = typeof response === "string" ? response : response?.id || response?.Id;

  return normalizeCategory({
    id,
    ...payload,
    productsCount: 0,
    createdAt: new Date().toISOString().split("T")[0],
  });
};

/**
 * 4. تعديل فئة
 * PUT /api/categories/{id}
 * Body: { name, description, colorHex }
 */
export const updateCategory = async (id, updatedData) => {
  const payload = {
    name: updatedData.name.trim(),
    description: updatedData.description?.trim() || null,
    colorHex: updatedData.colorHex.toUpperCase(),
  };

  await apiClient.put(ENDPOINTS.CATEGORIES.UPDATE(id), payload);

  return normalizeCategory({
    id,
    ...payload,
  });
};

/**
 * 5. حذف فئة
 * DELETE /api/categories/{id}
 */
export const deleteCategory = async (id) => {
  await apiClient.delete(ENDPOINTS.CATEGORIES.DELETE(id));
  return { success: true, id };
};

/**
 * 6. إعادة ترتيب عرض الفئات
 * PUT /api/categories/reorder
 * Body: { orderedIds: string[] }
 */
export const reorderCategories = async (orderedIds) => {
  return await apiClient.put(ENDPOINTS.CATEGORIES.REORDER, { orderedIds });
};

/**
 * 6. جلب قائمة الفئات الخفيفة للقوائم المنسدلة والنماذج (Lookup)
 * GET /api/categories/lookup
 * إرجاع مصفوفة { id, name }
 */
export const getCategoriesLookup = async () => {
  try {
    const data = await apiClient.get(ENDPOINTS.CATEGORIES.LOOKUP);
    if (Array.isArray(data) && data.length > 0) {
      return data.map((item) => ({
        id: item.id || item.Id || "",
        name: item.name || item.Name || "",
      }));
    }
    if (Array.isArray(data)) {
      return [];
    }
  } catch (err) {
    console.warn("تعذر جلب lookup الفئات مباشرة، جاري المحاولة عبر getCategories العامة:", err.message);
  }

  // كخيار احتياطي
  try {
    const all = await getCategories();
    return all.map((c) => ({ id: c.id, name: c.name }));
  } catch {
    return [];
  }
};

/**
 * 7. جلب قائمة الأصناف والمنتجات التابعة لفئة معينة
 * GET /api/categories/{id}/products
 */
export const getCategoryProducts = async (categoryId) => {
  if (!categoryId) return [];
  try {
    const data = await apiClient.get(ENDPOINTS.CATEGORIES.GET_PRODUCTS(categoryId));
    if (Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn("تعذر جلب أصناف الفئة من endpoint الفئة، جاري المحاولة عبر getProducts:", err.message);
  }

  try {
    const data = await apiClient.get(ENDPOINTS.PRODUCTS.GET_ALL, {
      params: { categoryId },
    });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};
