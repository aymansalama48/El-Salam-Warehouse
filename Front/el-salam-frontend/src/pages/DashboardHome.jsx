import { useState, useEffect, useCallback } from "react";
import { getDashboardStats } from "../features/dashboard/services/dashboardService";
import { WarehouseOverview } from "../features/dashboard/components/WarehouseOverview";
import { QuickActions } from "../features/dashboard/components/QuickActions";
import { RecentTransactionsWidget } from "../features/dashboard/components/RecentTransactionsWidget";
import { LowStockWidget } from "../features/dashboard/components/LowStockWidget";
import { VoucherFormModal } from "../features/vouchers/components/VoucherFormModal";
import { VoucherDetailsModal } from "../features/vouchers/components/VoucherDetailsModal";
import { ProductsReportModal } from "../features/products/components/ProductsReportModal";
import { DetailsModal } from "../components/common/DetailsModal";
import { VOUCHER_TYPE } from "../features/vouchers/schemas/voucherSchema";
import { createStockVoucher } from "../features/vouchers/services/voucherService";
import { getProductById, getProductPdf, formatBaseUnitStock } from "../features/products/services/productService";
import { notifyVoucherChanged } from "../features/vouchers/hooks/useVoucherSummary";
import { showToast, showSuccess, showError } from "../utils/alertUtils";
import { formatCairoDateTime } from "../utils/dateUtils";
import { handlePdfDownloadAndPreview } from "../utils/reportUtils";
import {
  ShieldCheck,
  Warehouse,
  Clock,
  Package,
  FileText,
  Box,
  Layers,
  BookOpen,
  MapPin,
  UserCheck,
  Calendar,
  AlertCircle,
} from "lucide-react";

/**
 * الصفحة الرئيسية ولوحة التحكم المركزية لمستودع السلام
 * متصلة بالبيانات الحقيقية بالكامل من الباك إند
 */
export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // حالات النوافذ المنبثقة للإجراءات السريعة
  const [isInboundModalOpen, setIsInboundModalOpen] = useState(false);
  const [isOutboundModalOpen, setIsOutboundModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isShortageModalOpen, setIsShortageModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // تفاصيل الإذن عند النقر على أي سطر في آخر الحركات
  const [selectedVoucherId, setSelectedVoucherId] = useState(null);

  // تفاصيل المنتج عند النقر على أي سطر في متابعة النواقص
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetailsLoading, setProductDetailsLoading] = useState(false);
  const [printingProduct, setPrintingProduct] = useState(false);

  const handleSelectProduct = async (productId, initialItem = null) => {
    setSelectedProduct({
      id: productId,
      name: initialItem?.productName || "...",
      categoryName: initialItem?.categoryName || "عام",
    });
    setProductDetailsLoading(true);
    try {
      const detailed = await getProductById(productId);
      if (detailed) {
        setSelectedProduct(detailed);
      }
    } catch (err) {
      console.error("فشل في جلب تفاصيل المنتج:", err);
      showError("تعذر جلب تفاصيل المنتج", err.message || "حدث خطأ أثناء تحميل بيانات المنتج من الخادم");
    } finally {
      setProductDetailsLoading(false);
    }
  };

  const getProductFields = (prod) => {
    if (!prod) return [];
    const baseUnit = prod.baseUnit || "باكو";
    const subUnit = prod.subUnit || "كشكول";
    const content = prod.unitsPerBaseUnit || 10;

    const full = Number(prod.fullBaseUnits ?? 0);
    const rem = Number(prod.remainingSubUnits ?? 0);

    const formattedStock = rem > 0
      ? `${full.toLocaleString()} ${baseUnit} و ${rem.toLocaleString()} ${subUnit}`
      : `${full.toLocaleString()} ${baseUnit}`;

    let thresholdDisplay = "غير محدد (0)";
    if (prod.lowStockThreshold > 0) {
      if (prod.unitType === 3) {
        thresholdDisplay = prod.lowStockThresholdUnit === 2
          ? `${prod.lowStockThreshold.toLocaleString()} كرتونة`
          : `${prod.lowStockThreshold.toLocaleString()} رزمة`;
      } else {
        thresholdDisplay = `${prod.lowStockThreshold.toLocaleString()} ${subUnit}`;
      }
    }

    return [
      { label: "اسم المنتج أو الصنف", value: prod.name, icon: Package, fullWidth: true },
      { label: "فئة وتصنيف المنتج", value: prod.categoryName || "عام", icon: FileText },
      {
        label: `محتوى التعبئة (${baseUnit})`,
        value: `${content.toLocaleString()} ${subUnit} لكل ${baseUnit}`,
        icon: Box,
      },
      {
        label: `الرصيد الفعلي بال${baseUnit}`,
        value: formattedStock,
        icon: Layers,
      },
      {
        label: `إجمالي الرصيد بال${subUnit}`,
        value: `${Number(prod.totalSubUnitStock ?? 0).toLocaleString()} ${subUnit}`,
        icon: BookOpen,
      },
      {
        label: "حد النفاذ (الرصيد الحرج)",
        value: thresholdDisplay,
        icon: AlertCircle,
      },
      { label: "مكان التخزين", value: prod.storageLocation || "المستودع الرئيسي", icon: MapPin },
      {
        label: "حالة المخزون",
        icon: ShieldCheck,
        render: () => {
          if (prod.status === 3) {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                نافذ / نفد من المستودع
              </span>
            );
          }
          if (prod.status === 2) {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                منخفض المخزون
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              متوفر بالمستودع
            </span>
          );
        },
      },
      { label: "أضيف بواسطة", value: prod.createdByName || "Ayman Salama", icon: UserCheck },
      { label: "تاريخ الإضافة والاعتماد", value: prod.createdAt ? formatCairoDateTime(prod.createdAt) : "—", icon: Calendar },
      ...(prod.updatedByName
        ? [
            { label: "آخر تعديل بواسطة", value: prod.updatedByName, icon: UserCheck },
            { label: "تاريخ آخر تعديل", value: prod.updatedAt ? formatCairoDateTime(prod.updatedAt) : "—", icon: Calendar },
          ]
        : []),
    ];
  };

  // جلب إحصائيات لوحة التحكم
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
      if (isRefresh) {
        showToast("تم تحديث بيانات وإحصائيات المستودع بنجاح", "success");
      }
    } catch (error) {
      console.error("فشل في تحميل بيانات لوحة التحكم:", error);
      if (isRefresh) {
        showError("خطأ", "تعذر تحديث بيانات لوحة التحكم");
      }
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  // التحميل الأولي للبيانات
  useEffect(() => {
    let ignore = false;
    getDashboardStats()
      .then((data) => {
        if (!ignore && data) {
          setStats(data);
          setLoading(false);
        }
      })
      .catch((error) => {
        if (!ignore) {
          console.error("فشل في تحميل بيانات لوحة التحكم:", error);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // تحديث البيانات يدوياً
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  // فتح نافذة إذن الوارد مباشرة
  const handleNewSupply = () => {
    setIsInboundModalOpen(true);
  };

  // فتح نافذة إذن الصرف مباشرة
  const handleNewDispatch = () => {
    setIsOutboundModalOpen(true);
  };

  // فتح نافذة إذن المرتجع مباشرة
  const handleNewReturn = () => {
    setIsReturnModalOpen(true);
  };

  // فتح نافذة إذن العجز مباشرة
  const handleNewShortage = () => {
    setIsShortageModalOpen(true);
  };

  // فتح نافذة تصدير تقرير الجرد مباشرة
  const handleExport = () => {
    setIsReportModalOpen(true);
  };

  // حفظ إذن وارد من لوحة التحكم
  const handleSaveInbound = async (formData) => {
    await createStockVoucher(formData);
    showSuccess("تم تسجيل إذن الوارد بنجاح", "تم توثيق استلام المنتجات بالمخزن وتحديث الأرصدة فوراً");
    notifyVoucherChanged();
    fetchDashboardData(true);
  };

  // حفظ إذن صرف من لوحة التحكم
  const handleSaveOutbound = async (formData) => {
    await createStockVoucher(formData);
    showSuccess("تم تسجيل إذن الصرف بنجاح", "تم توثيق صرف المنتجات من المخزن وتحديث الأرصدة فوراً");
    notifyVoucherChanged();
    fetchDashboardData(true);
  };

  // حفظ إذن مرتجع من لوحة التحكم
  const handleSaveReturn = async (formData) => {
    await createStockVoucher(formData);
    showSuccess("تم تسجيل إذن المرتجع بنجاح", "تم توثيق استلام المرتجع وضبط رصيد المستودع فوراً");
    notifyVoucherChanged();
    fetchDashboardData(true);
  };

  // حفظ إذن عجز من لوحة التحكم
  const handleSaveShortage = async (formData) => {
    await createStockVoucher(formData);
    showSuccess("تم تسجيل إذن العجز والتسوية بنجاح", "تم توثيق محضر العجز وخصم الكميات من الرصيد فوراً");
    notifyVoucherChanged();
    fetchDashboardData(true);
  };

  return (
    <div className="space-y-6 select-none" dir="rtl">
      {/* 1. ترويسة لوحة التحكم وشريط الإجراءات السريعة */}
      <QuickActions
        onRefresh={handleRefresh}
        onNewSupply={handleNewSupply}
        onNewDispatch={handleNewDispatch}
        onNewReturn={handleNewReturn}
        onNewShortage={handleNewShortage}
        onExport={handleExport}
        refreshing={refreshing}
      />

      {/* 2. إحصائيات المخزون الحقيقية وتفصيل أنواع المنتجات */}
      <WarehouseOverview stats={stats} loading={loading} />

      {/* 3. الجزء السفلي: آخر الحركات + النواقص وحالة المستودع */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* أ. آخر الحركات المسجلة في المستودع (2 أعمدة) */}
        <div className="lg:col-span-2">
          <RecentTransactionsWidget
            activities={stats?.recentActivities || []}
            loading={loading}
            onSelectVoucher={setSelectedVoucherId}
          />
        </div>

        {/* ب. النواقص ومعلومات المستودع (عمود واحد) */}
        <div className="space-y-4">
          {/* كارت متابعة الأصناف الحرجة والنواقص */}
          <LowStockWidget
            lowStockItems={stats?.lowStockItems || []}
            totalProducts={stats?.totalProducts ?? 0}
            loading={loading}
            onSelectProduct={handleSelectProduct}
          />

          {/* كارت حالة المستودع والنظام */}
          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-800">مستودع المصنع المركزي</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-3xs font-bold bg-emerald-50 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>متصل بالخادم</span>
              </span>
            </div>

            <div className="text-2xs text-slate-500 space-y-1.5">
              <div className="flex items-center justify-between">
                <span>أذونات هذا الشهر:</span>
                <span className="font-bold text-slate-800">
                  {(stats?.inboundThisMonth ?? 0) + (stats?.outboundThisMonth ?? 0) + (stats?.returnsThisMonth ?? 0)} إذن
                </span>
              </div>
              {stats?.lastVoucherNumber && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>آخر إذن مسجل:</span>
                  </span>
                  <span className="font-mono font-bold text-blue-600">
                    {stats.lastVoucherNumber}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-3xs text-slate-400">
              <span>نظام إدارة المخازن (WMS) v2.0</span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>بيانات حية ومؤمنة</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. نوافذ العمليات السريعة من لوحة التحكم */}
      {isInboundModalOpen && (
        <VoucherFormModal
          isOpen={isInboundModalOpen}
          onClose={() => setIsInboundModalOpen(false)}
          onSave={handleSaveInbound}
          type={VOUCHER_TYPE.INBOUND}
        />
      )}

      {isOutboundModalOpen && (
        <VoucherFormModal
          isOpen={isOutboundModalOpen}
          onClose={() => setIsOutboundModalOpen(false)}
          onSave={handleSaveOutbound}
          type={VOUCHER_TYPE.OUTBOUND}
        />
      )}

      {isReturnModalOpen && (
        <VoucherFormModal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          onSave={handleSaveReturn}
          type={VOUCHER_TYPE.RETURN}
        />
      )}

      {isShortageModalOpen && (
        <VoucherFormModal
          isOpen={isShortageModalOpen}
          onClose={() => setIsShortageModalOpen(false)}
          onSave={handleSaveShortage}
          type={VOUCHER_TYPE.SHORTAGE}
        />
      )}

      {isReportModalOpen && (
        <ProductsReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      {/* 5. نافذة تفاصيل وطباعة الإذن عند النقر على أي سطر في آخر الحركات */}
      {Boolean(selectedVoucherId) && (
        <VoucherDetailsModal
          isOpen={Boolean(selectedVoucherId)}
          voucherId={selectedVoucherId}
          onClose={() => setSelectedVoucherId(null)}
        />
      )}

      {/* 6. نافذة تفاصيل وبطاقة الصنف عند النقر على أي منتج في متابعة النواقص */}
      <DetailsModal
        isOpen={Boolean(selectedProduct)}
        onClose={() => {
          setSelectedProduct(null);
          setProductDetailsLoading(false);
        }}
        title={
          selectedProduct?.unitType === 3
            ? `بطاقة صنف: ${selectedProduct.name}`
            : selectedProduct?.unitType === 2
            ? `بطاقة كشكول: ${selectedProduct.name}`
            : `بطاقة تعريف: ${selectedProduct?.name || "صنف"}`
        }
        subtitle="مصنع السلام للكراسات والحلول الورقية"
        icon={Package}
        badge={
          selectedProduct?.categoryName
            ? { text: selectedProduct.categoryName, className: "bg-blue-50 text-blue-700 border-blue-200" }
            : undefined
        }
        fields={getProductFields(selectedProduct)}
        loading={productDetailsLoading}
        onPrint={async () => {
          if (!selectedProduct?.id || printingProduct) return;
          setPrintingProduct(true);
          try {
            const blob = await getProductPdf(selectedProduct.id);
            const safeName = selectedProduct.name ? `بطاقة_صنف_${selectedProduct.name}.pdf` : `بطاقة_صنف_${selectedProduct.id}.pdf`;
            handlePdfDownloadAndPreview(blob, safeName);
          } catch (err) {
            console.error("فشل في طباعة بطاقة الصنف:", err);
            showError("تعذر طباعة بطاقة الصنف", err.message || "حدث خطأ أثناء تحميل ملف الـ PDF من الخادم");
          } finally {
            setPrintingProduct(false);
          }
        }}
        printing={printingProduct}
        extraInfo="مواصفات التعبئة والتغليف معتمدة من صالة الإنتاج والتجليد (الباكو يحتوي على العدد المحدد من الفئة المسجلة)."
      />
    </div>
  );
}
