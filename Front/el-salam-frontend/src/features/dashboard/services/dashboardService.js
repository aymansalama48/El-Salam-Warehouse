/**
 * خدمة بيانات لوحة التحكم الحقيقية لمستودع السلام للكراسات والحلول الورقية
 * متصلة بالـ Backend Endpoint: GET /api/dashboard/stats
 */
import axiosInstance from "../../../api/axiosInstance";
import { ENDPOINTS } from "../../../api/endpoints";
import { getProducts, getProductsSummary } from "../../products/services/productService";
import { getStockVouchersSummary } from "../../vouchers/services/voucherService";
import { getDaybook } from "../../daybook/services/daybookService";
import { formatCairoDateTime } from "../../../utils/dateUtils";

/**
 * جلب الإحصائيات الشاملة والحقيقية للداشبورد
 */
export const getDashboardStats = async () => {
  try {
    // 1. محاولة استدعاء الـ Endpoint الجديد المخصص للداشبورد من الباك إند
    const data = await axiosInstance.get(ENDPOINTS.DASHBOARD.STATS);
    if (data && typeof data === "object") {
      return {
        totalProducts: data.totalProducts ?? 0,
        totalCategories: data.totalCategories ?? 0,
        totalPacks: data.totalPacks ?? 0,
        totalCartons: data.totalCartons ?? 0,
        totalSubUnits: data.totalSubUnits ?? 0,
        lowStockCount: data.lowStockCount ?? 0,
        outOfStockCount: data.outOfStockCount ?? 0,
        notebooks: data.notebooks || { productCount: 0, fullBaseUnits: 0, totalSubUnits: 0, baseUnitName: "باكو", subUnitName: "كشكول" },
        booklets: data.booklets || { productCount: 0, fullBaseUnits: 0, totalSubUnits: 0, baseUnitName: "باكو", subUnitName: "كراس" },
        copyPaper: data.copyPaper || { productCount: 0, fullBaseUnits: 0, totalSubUnits: 0, baseUnitName: "كرتونة", subUnitName: "رزمة" },
        inboundToday: data.inboundToday ?? 0,
        outboundToday: data.outboundToday ?? 0,
        todayTransactionsCount: data.todayTransactionsCount ?? 0,
        inboundThisMonth: data.inboundThisMonth ?? 0,
        outboundThisMonth: data.outboundThisMonth ?? 0,
        totalInboundQuantityToday: data.totalInboundQuantityToday ?? 0,
        totalOutboundQuantityToday: data.totalOutboundQuantityToday ?? 0,
        lowStockItems: data.lowStockItems || [],
        recentActivities: data.recentActivities || [],
        lastVoucherNumber: data.lastVoucherNumber || null,
        lastVoucherAtUtc: data.lastVoucherAtUtc || null,
      };
    }
  } catch {
    // 2. حل بديل تلقائي وذكي في حال لم تتم إعادة تشغيل سيرفر الباك إند بعد
  }

  // الحساب البديل التلقائي من مسارات الـ API الحالية (بدون أي أرقام وهمية)
  try {
    const [productsList, prodSummary, voucherSummary, daybookData] = await Promise.all([
      getProducts().catch(() => []),
      getProductsSummary().catch(() => ({})),
      getStockVouchersSummary().catch(() => ({})),
      getDaybook({ pageSize: 6 }).catch(() => ({ entries: { items: [] } })),
    ]);

    const prods = Array.isArray(productsList) ? productsList : [];

    // تقسيم المنتجات حسب نوعها
    const notebooks = prods.filter((p) => p.unitType === 1);
    const booklets = prods.filter((p) => p.unitType === 2);
    const copyPapers = prods.filter((p) => p.unitType === 3);

    const notebookPacks = notebooks.reduce((acc, p) => acc + (p.unitsPerBaseUnit > 0 ? Math.floor(p.totalSubUnitStock / p.unitsPerBaseUnit) : 0), 0);
    const bookletPacks = booklets.reduce((acc, p) => acc + (p.unitsPerBaseUnit > 0 ? Math.floor(p.totalSubUnitStock / p.unitsPerBaseUnit) : 0), 0);
    const copyPaperCartons = copyPapers.reduce((acc, p) => acc + (p.unitsPerBaseUnit > 0 ? Math.floor(p.totalSubUnitStock / p.unitsPerBaseUnit) : 0), 0);

    const lowStockItems = prods
      .filter((p) => p.totalSubUnitStock <= 0 || (p.unitsPerBaseUnit > 0 && p.totalSubUnitStock <= p.unitsPerBaseUnit * 2))
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        categoryName: p.categoryName || "عام",
        unitType: p.unitType,
        totalSubUnitStock: p.totalSubUnitStock,
        unitsPerBaseUnit: p.unitsPerBaseUnit,
        fullBaseUnits: p.unitsPerBaseUnit > 0 ? Math.floor(p.totalSubUnitStock / p.unitsPerBaseUnit) : 0,
        remainingSubUnits: p.unitsPerBaseUnit > 0 ? p.totalSubUnitStock % p.unitsPerBaseUnit : 0,
        entryUnitLabel: p.entryUnitLabel || p.subUnit,
        status: p.totalSubUnitStock <= 0 ? "منعدم" : "منخفض",
      }));

    const daybookItems = daybookData?.entries?.items || [];
    const recentActivities = daybookItems.map((it, idx) => ({
      voucherId: it.voucherId || `v-${idx}`,
      voucherNumber: it.voucherNumber || `V-${idx + 1}`,
      type: it.type === 1 ? 1 : 2,
      voucherDate: it.voucherDate,
      occurredAtUtc: it.occurredAtUtc || it.voucherDate,
      partyName: it.partyName || (it.source === 2 ? "صالة الإنتاج والتجليد" : "جهة خارجية"),
      receiverName: it.receiverName || "أمين المستودع",
      description: `${it.type === 1 ? "إذن استلام وارد" : "إذن صرف"}: ${it.productName}`,
      quantityLabel: `${Number(it.quantity).toLocaleString()} ${it.unitLabel}`,
      itemsCount: 1,
    }));

    return {
      totalProducts: prods.length || prodSummary.totalProducts || 0,
      totalCategories: new Set(prods.map((p) => p.categoryId)).size,
      totalPacks: notebookPacks + bookletPacks,
      totalCartons: copyPaperCartons,
      totalSubUnits: prods.reduce((acc, p) => acc + (p.totalSubUnitStock || 0), 0),
      lowStockCount: lowStockItems.length,
      outOfStockCount: lowStockItems.filter((x) => x.status === "منعدم").length,
      notebooks: {
        productCount: notebooks.length,
        fullBaseUnits: notebookPacks,
        totalSubUnits: notebooks.reduce((acc, p) => acc + (p.totalSubUnitStock || 0), 0),
        baseUnitName: "باكو",
        subUnitName: "كشكول",
      },
      booklets: {
        productCount: booklets.length,
        fullBaseUnits: bookletPacks,
        totalSubUnits: booklets.reduce((acc, p) => acc + (p.totalSubUnitStock || 0), 0),
        baseUnitName: "باكو",
        subUnitName: "كراس",
      },
      copyPaper: {
        productCount: copyPapers.length,
        fullBaseUnits: copyPaperCartons,
        totalSubUnits: copyPapers.reduce((acc, p) => acc + (p.totalSubUnitStock || 0), 0),
        baseUnitName: "كرتونة",
        subUnitName: "رزمة",
      },
      inboundToday: voucherSummary.inboundToday ?? 0,
      outboundToday: voucherSummary.outboundToday ?? 0,
      todayTransactionsCount: (voucherSummary.inboundToday ?? 0) + (voucherSummary.outboundToday ?? 0),
      inboundThisMonth: voucherSummary.inboundThisMonth ?? 0,
      outboundThisMonth: voucherSummary.outboundThisMonth ?? 0,
      totalInboundQuantityToday: 0,
      totalOutboundQuantityToday: 0,
      lowStockItems,
      recentActivities,
      lastVoucherNumber: voucherSummary.lastVoucherNumber || null,
      lastVoucherAtUtc: voucherSummary.lastVoucherAtUtc || null,
    };
  } catch (err) {
    console.error("فشل تجميع إحصائيات الداشبورد:", err);
    throw err;
  }
};

/**
 * جلب آخر الحركات المسجلة
 */
export const getRecentActivities = async () => {
  try {
    const daybook = await getDaybook({ pageSize: 6 });
    const items = daybook?.entries?.items || [];
    return items.map((it, idx) => ({
      id: it.voucherId || idx,
      type: it.type === 1 ? "in" : "out",
      title: `${it.type === 1 ? "إذن استلام وارد" : "إذن صرف"}: ${it.productName}`,
      supplier: it.partyName || (it.source === 2 ? "صالة الإنتاج والتجليد" : "جهة خارجية"),
      quantity: `${Number(it.quantity).toLocaleString()} ${it.unitLabel}`,
      time: formatCairoDateTime(it.occurredAtUtc || it.voucherDate),
      user: it.receiverName || "أمين المستودع",
    }));
  } catch (err) {
    console.error("فشل في جلب الحركات الأخيرة:", err);
    return [];
  }
};
