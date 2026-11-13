import { useState, useEffect } from "react";
import { BookOpen, RefreshCw, AlertCircle, Printer } from "lucide-react";
import { getDaybook } from "../features/daybook/services/daybookService";
import { DaybookSummaryCards } from "../features/daybook/components/DaybookSummaryCards";
import { DaybookFilter } from "../features/daybook/components/DaybookFilter";
import { DaybookTable } from "../features/daybook/components/DaybookTable";
import { DaybookReportModal } from "../features/daybook/components/DaybookReportModal";
import { VoucherDetailsModal } from "../features/vouchers/components/VoucherDetailsModal";
import { CancelVoucherModal } from "../features/vouchers/components/CancelVoucherModal";
import { cancelStockVoucher } from "../features/vouchers/services/voucherService";
import { notifyVoucherChanged } from "../features/vouchers/hooks/useVoucherSummary";
import { getCategoriesLookup } from "../features/categories/services/categoryService";
import { getProducts } from "../features/products/services/productService";
import { showSuccess, showError } from "../utils/alertUtils";

export default function DailyTransactionsPage() {
  const [totals, setTotals] = useState({});
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // خيارات الفلاتر
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  // قيم الفلاتر
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [type, setType] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [productId, setProductId] = useState("all");
  const [status, setStatus] = useState("all");

  // الصفحات
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // النوافذ
  const [selectedVoucherId, setSelectedVoucherId] = useState(null);
  const [cancellingVoucher, setCancellingVoucher] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const refetchDaybook = () => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  // جلب خيارات الفئات والأصناف للفلترة
  useEffect(() => {
    let ignore = false;
    Promise.all([
      getCategoriesLookup().catch(() => []),
      getProducts().catch(() => []),
    ]).then(([cats, prods]) => {
      if (!ignore) {
        setCategories(Array.isArray(cats) ? cats : []);
        setProducts(Array.isArray(prods) ? prods : []);
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  // جلب سجل وحركات اليومية
  useEffect(() => {
    let ignore = false;
    getDaybook({
      search: searchTerm,
      fromDate,
      toDate,
      type: type === "all" ? undefined : type,
      categoryId: categoryId === "all" ? undefined : categoryId,
      productId: productId === "all" ? undefined : productId,
      status: status === "all" ? undefined : status,
      page,
      pageSize,
    })
      .then((data) => {
        if (!ignore) {
          setTotals(data.totals);
          setEntries(data.entries.items);
          setTotalCount(data.entries.totalCount);
          setTotalPages(data.entries.totalPages);
          setApiError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("فشل في جلب بيانات دفتر اليومية:", err);
          setApiError(err.message || "تعذر الاتصال بخادم دفتر اليومية");
          setEntries([]);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [searchTerm, fromDate, toDate, type, categoryId, productId, status, page, pageSize, refreshTrigger]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setFromDate("");
    setToDate("");
    setType("all");
    setCategoryId("all");
    setProductId("all");
    setStatus("all");
    setPage(1);
  };

  // تأكيد إلغاء الإذن من شاشة التفاصيل
  const handleConfirmCancel = async (reason) => {
    if (!cancellingVoucher) return;
    try {
      await cancelStockVoucher(cancellingVoucher.id, reason);
      showSuccess("تم إلغاء الإذن بنجاح", "تم تحديث حركات اليومية وعكس الرصيد بالمخزن");
      setCancellingVoucher(null);
      notifyVoucherChanged();
      refetchDaybook();
    } catch (err) {
      showError("تعذر إلغاء الإذن", err.message || "حدث خطأ أثناء محاولة إلغاء الإذن بالخادم");
      throw err;
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <BookOpen className="w-5 h-5" />
            </span>
            دفتر اليومية وسجل حركات المستودع
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            سجل محاسبي تحليلي شامل ومباشر لجميع حركات الإيداع والصرف وتتبع الأرصدة (قراءة فقط)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            طباعة تقرير
          </button>
        </div>
      </div>

      {/* كروت الإجماليات أعلى الدفتر */}
      <DaybookSummaryCards totals={totals} />

      {/* تنبيه الخطأ */}
      {apiError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-800">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="text-sm font-bold">تعذر الاتصال بخادم دفتر اليومية</p>
              <p className="text-xs text-rose-600 mt-0.5">{apiError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={refetchDaybook}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* الفلاتر */}
      <DaybookFilter
        searchTerm={searchTerm}
        setSearchTerm={(term) => {
          setSearchTerm(term);
          setPage(1);
        }}
        fromDate={fromDate}
        setFromDate={(d) => {
          setFromDate(d);
          setPage(1);
        }}
        toDate={toDate}
        setToDate={(d) => {
          setToDate(d);
          setPage(1);
        }}
        type={type}
        setType={(t) => {
          setType(t);
          setPage(1);
        }}
        categoryId={categoryId}
        setCategoryId={(c) => {
          setCategoryId(c);
          setPage(1);
        }}
        productId={productId}
        setProductId={(p) => {
          setProductId(p);
          setPage(1);
        }}
        status={status}
        setStatus={(s) => {
          setStatus(s);
          setPage(1);
        }}
        categories={categories}
        products={products}
        onReset={handleResetFilters}
      />

      {/* جدول دفتر اليومية */}
      <DaybookTable
        entries={entries}
        loading={loading}
        onSelectVoucher={(voucherId) => setSelectedVoucherId(voucherId)}
        page={page}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
      />

      {/* نافذة تفاصيل وطباعة الإذن عند النقر على السطر */}
      {Boolean(selectedVoucherId) && (
        <VoucherDetailsModal
          isOpen={Boolean(selectedVoucherId)}
          voucherId={selectedVoucherId}
          onClose={() => setSelectedVoucherId(null)}
          onOpenCancel={(v) => {
            setSelectedVoucherId(null);
            setCancellingVoucher(v);
          }}
        />
      )}

      {/* نافذة تأكيد إلغاء الإذن */}
      {Boolean(cancellingVoucher) && (
        <CancelVoucherModal
          isOpen={Boolean(cancellingVoucher)}
          voucherNumber={cancellingVoucher.voucherNumber}
          onClose={() => setCancellingVoucher(null)}
          onConfirm={handleConfirmCancel}
        />
      )}

      {/* نافذة طباعة تقرير دفتر اليومية PDF */}
      <DaybookReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        categories={categories}
      />
    </div>
  );
}
