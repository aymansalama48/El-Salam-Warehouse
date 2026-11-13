import { apiClient, ENDPOINTS } from "../../../api";

/**
 * خدمة إدارة أذونات المخزن (وارد / صرف)
 * متصلة بـ StockVouchersController عبر Axios
 */

/**
 * جلب قائمة أذونات المخزن مع دعم الفلاتر والصفحات
 * GET /api/stock-vouchers
 * @param {Object} params
 * @param {1|2} [params.type] - 1 وارد | 2 صرف
 * @param {string} [params.fromDate] - yyyy-MM-dd
 * @param {string} [params.toDate] - yyyy-MM-dd
 * @param {1|2} [params.source] - 1 خارجي | 2 صالة الإنتاج
 * @param {1|2} [params.status] - 1 فعال | 2 ملغي
 * @param {string} [params.search] - بحث في رقم الإذن، المستلم، الجايب، الجهة، اسم الصنف
 * @param {number} [params.page=1]
 * @param {number} [params.pageSize=20]
 */
export const getStockVouchers = async (params = {}) => {
  const query = {};
  if (params.type != null && params.type !== "") query.type = params.type;
  if (params.fromDate) query.fromDate = params.fromDate;
  if (params.toDate) query.toDate = params.toDate;
  if (params.source != null && params.source !== "" && params.source !== "all") query.source = params.source;
  if (params.status != null && params.status !== "" && params.status !== "all") query.status = params.status;
  if (params.search && params.search.trim()) query.search = params.search.trim();
  if (params.page) query.page = params.page;
  if (params.pageSize) query.pageSize = params.pageSize;

  const data = await apiClient.get(ENDPOINTS.STOCK_VOUCHERS.GET_ALL, { params: query });
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    page: Number(data?.page ?? 1),
    pageSize: Number(data?.pageSize ?? 20),
    totalCount: Number(data?.totalCount ?? 0),
    totalPages: Number(data?.totalPages ?? 1),
  };
};

/**
 * جلب تفاصيل إذن مخزن بالمعرف (للعرض والطباعة)
 * GET /api/stock-vouchers/{id}
 * @param {string} id
 */
export const getStockVoucherById = async (id) => {
  const data = await apiClient.get(ENDPOINTS.STOCK_VOUCHERS.GET_BY_ID(id));
  return data;
};

/**
 * تحميل وطباعة ملف PDF الرسمي للإذن من الخادم
 * GET /api/stock-vouchers/{id}/pdf
 * @param {string} id
 * @returns {Promise<Blob>}
 */
export const getStockVoucherPdf = async (id) => {
  return await apiClient.get(ENDPOINTS.STOCK_VOUCHERS.PDF(id), {
    responseType: "blob",
  });
};

/**
 * إنشاء إذن مخزن جديد (وارد أو صرف)
 * POST /api/stock-vouchers
 * @param {Object} payload
 */
export const createStockVoucher = async (payload) => {
  const body = {
    type: Number(payload.type),
    date: payload.date || null,
    source: Number(payload.source),
    partyName: payload.partyName?.trim() || null,
    receiverName: payload.receiverName.trim(),
    delivererName: payload.delivererName?.trim() || null,
    notes: payload.notes?.trim() || null,
    returnDirection: payload.returnDirection ? Number(payload.returnDirection) : null,
    returnReason: payload.returnReason?.trim() || null,
    shortageReason: payload.shortageReason?.trim() || null,
    items: payload.items.map((it) => ({
      productId: it.productId,
      quantity: Number(it.quantity),
      entryUnit: it.entryUnit ? Number(it.entryUnit) : null,
    })),
  };

  const response = await apiClient.post(ENDPOINTS.STOCK_VOUCHERS.CREATE, body);
  return response;
};

/**
 * إلغاء إذن مخزن
 * POST /api/stock-vouchers/{id}/cancel
 * @param {string} id
 * @param {string} reason
 */
export const cancelStockVoucher = async (id, reason) => {
  const response = await apiClient.post(ENDPOINTS.STOCK_VOUCHERS.CANCEL(id), {
    reason: reason.trim(),
  });
  return response;
};

/**
 * جلب ملخص وإحصائيات أذونات المخزن (للكروت والشريط الجانبي)
 * GET /api/stock-vouchers/summary
 * @returns {Promise<{inboundToday: number, outboundToday: number, inboundThisMonth: number, outboundThisMonth: number, cancelledToday: number, lastVoucherNumber: string|null, lastVoucherAtUtc: string|null}>}
 */
export const getStockVouchersSummary = async () => {
  const data = await apiClient.get(ENDPOINTS.STOCK_VOUCHERS.SUMMARY);
  return {
    inboundToday: Number(data?.inboundToday ?? data?.InboundToday ?? 0),
    outboundToday: Number(data?.outboundToday ?? data?.OutboundToday ?? 0),
    inboundThisMonth: Number(data?.inboundThisMonth ?? data?.InboundThisMonth ?? 0),
    outboundThisMonth: Number(data?.outboundThisMonth ?? data?.OutboundThisMonth ?? 0),
    cancelledToday: Number(data?.cancelledToday ?? data?.CancelledToday ?? 0),
    returnsToday: Number(data?.returnsToday ?? data?.ReturnsToday ?? 0),
    returnsThisMonth: Number(data?.returnsThisMonth ?? data?.ReturnsThisMonth ?? 0),
    shortagesToday: Number(data?.shortagesToday ?? data?.ShortagesToday ?? 0),
    shortagesThisMonth: Number(data?.shortagesThisMonth ?? data?.ShortagesThisMonth ?? 0),
    lastVoucherNumber: data?.lastVoucherNumber ?? data?.LastVoucherNumber ?? null,
    lastVoucherAtUtc: data?.lastVoucherAtUtc ?? data?.LastVoucherAtUtc ?? null,
  };
};

