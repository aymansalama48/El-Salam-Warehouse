import { apiClient, ENDPOINTS } from "../../../api";

/**
 * خدمة دفتر اليومية (Daybook)
 * متصلة بـ DaybookController عبر Axios
 */

/**
 * جلب سجل وحركات دفتر اليومية مع الإجماليات
 * GET /api/daybook
 * @param {Object} params
 * @param {string} [params.fromDate]
 * @param {string} [params.toDate]
 * @param {1|2} [params.type]
 * @param {string} [params.productId]
 * @param {string} [params.categoryId]
 * @param {1|2} [params.status]
 * @param {string} [params.search]
 * @param {number} [params.page=1]
 * @param {number} [params.pageSize=50]
 */
export const getDaybook = async (params = {}) => {
  const query = {};
  if (params.fromDate) query.fromDate = params.fromDate;
  if (params.toDate) query.toDate = params.toDate;
  if (params.type != null && params.type !== "" && params.type !== "all") query.type = params.type;
  if (params.productId && params.productId !== "all") query.productId = params.productId;
  if (params.categoryId && params.categoryId !== "all") query.categoryId = params.categoryId;
  if (params.status != null && params.status !== "" && params.status !== "all") query.status = params.status;
  if (params.search && params.search.trim()) query.search = params.search.trim();
  if (params.page) query.page = params.page;
  if (params.pageSize) query.pageSize = params.pageSize;

  const data = await apiClient.get(ENDPOINTS.DAYBOOK.GET_ALL, { params: query });

  return {
    totals: {
      inboundVouchers: Number(data?.totals?.inboundVouchers ?? 0),
      outboundVouchers: Number(data?.totals?.outboundVouchers ?? 0),
      inboundNotebooks: Number(data?.totals?.inboundNotebooks ?? 0),
      outboundNotebooks: Number(data?.totals?.outboundNotebooks ?? 0),
      inboundCartons: Number(data?.totals?.inboundCartons ?? 0),
      outboundCartons: Number(data?.totals?.outboundCartons ?? 0),
    },
    entries: {
      items: Array.isArray(data?.entries?.items) ? data.entries.items : [],
      page: Number(data?.entries?.page ?? 1),
      pageSize: Number(data?.entries?.pageSize ?? 50),
      totalCount: Number(data?.entries?.totalCount ?? 0),
      totalPages: Number(data?.entries?.totalPages ?? 1),
    },
  };
};

/**
 * تحميل تقرير دفتر اليومية بصيغة PDF (يدعم الفلاتر الكاملة: نوع الحركة، المصدر، نوع الصنف، الفئة)
 * GET /api/daybook/report
 */
export const getDaybookReportPdf = async (fromOrParams, toDateArg, typeArg) => {
  const params = {};

  if (typeof fromOrParams === "object" && fromOrParams !== null) {
    const { fromDate, toDate, type, source, unitType, categoryId } = fromOrParams;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    if (type != null && type !== "" && type !== "all") params.type = type;
    if (source != null && source !== "" && source !== "all") params.source = source;
    if (unitType != null && unitType !== "" && unitType !== "all") params.unitType = unitType;
    if (categoryId && categoryId !== "" && categoryId !== "all") params.categoryId = categoryId;
  } else {
    if (fromOrParams) params.fromDate = fromOrParams;
    if (toDateArg) params.toDate = toDateArg;
    if (typeArg != null && typeArg !== "" && typeArg !== "all") params.type = typeArg;
  }

  return await apiClient.get(ENDPOINTS.DAYBOOK.REPORT, {
    params,
    responseType: "blob",
  });
};
