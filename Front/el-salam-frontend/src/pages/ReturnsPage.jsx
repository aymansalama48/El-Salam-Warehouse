import { useState, useEffect } from "react";
import { 
  RotateCcw, 
  Plus, 
  RefreshCw, 
  AlertCircle,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight
} from "lucide-react";
import { 
  getStockVouchers, 
  createStockVoucher, 
  cancelStockVoucher 
} from "../features/vouchers/services/voucherService";
import { VOUCHER_TYPE } from "../features/vouchers/schemas/voucherSchema";
import { VouchersTable } from "../features/vouchers/components/VouchersTable";
import { VouchersFilter } from "../features/vouchers/components/VouchersFilter";
import { VoucherFormModal } from "../features/vouchers/components/VoucherFormModal";
import { VoucherDetailsModal } from "../features/vouchers/components/VoucherDetailsModal";
import { CancelVoucherModal } from "../features/vouchers/components/CancelVoucherModal";
import { useVoucherSummary, notifyVoucherChanged } from "../features/vouchers/hooks/useVoucherSummary";
import { showSuccess, showError } from "../utils/alertUtils";

export default function ReturnsPage() {
  const { summary } = useVoucherSummary();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // الفلاتر
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("all");

  // الصفحات
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // النوافذ المنبثقة
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingVoucherId, setViewingVoucherId] = useState(null);
  const [cancellingVoucher, setCancellingVoucher] = useState(null);

  const refetchVouchers = () => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    let ignore = false;
    getStockVouchers({
      type: VOUCHER_TYPE.RETURN,
      search: searchTerm,
      fromDate,
      toDate,
      status: status === "all" ? undefined : status,
      page,
      pageSize,
    })
      .then((result) => {
        if (!ignore) {
          setVouchers(result.items);
          setTotalCount(result.totalCount);
          setTotalPages(result.totalPages);
          setApiError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("فشل في تحميل أذونات المرتجع:", err);
          setApiError(err.message || "تعذر الاتصال بخادم الـ Backend");
          setVouchers([]);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [searchTerm, fromDate, toDate, status, page, pageSize, refreshTrigger]);

  // حفظ إذن مرتجع جديد
  const handleSaveVoucher = async (formData) => {
    await createStockVoucher(formData);
    showSuccess("تم تسجيل إذن المرتجع بنجاح", "تم توثيق حركة المرتجع وضبط رصيد المستودع");
    notifyVoucherChanged();
    refetchVouchers();
  };

  // تأكيد إلغاء الإذن
  const handleConfirmCancel = async (reason) => {
    if (!cancellingVoucher) return;
    try {
      await cancelStockVoucher(cancellingVoucher.id, reason);
      showSuccess("تم إلغاء إذن المرتجع بنجاح", `تم إلغاء إذن المرتجع رقم "${cancellingVoucher.voucherNumber || cancellingVoucher.id}" وعكس رصيد المخزن`);
      setCancellingVoucher(null);
      notifyVoucherChanged();
      refetchVouchers();
    } catch (err) {
      showError("تعذر إلغاء الإذن", err.message || "حدث خطأ أثناء محاولة إلغاء الإذن بالخادم");
      throw err;
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFromDate("");
    setToDate("");
    setStatus("all");
    setPage(1);
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <RotateCcw className="w-5 h-5" />
            </span>
            أذونات المرتجع وإرجاع البضاعة
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            توثيق استلام المرتجعات من العملاء وصالة الإنتاج أو رد البضاعة للموردين وضبط الأرصدة
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          تسجيل إذن مرتجع جديد
        </button>
      </div>

      {/* كروت الإحصائيات السريعة للمرتجعات */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-2xs font-bold text-slate-400">مرتجعات اليوم</p>
            <p className="text-xl font-black text-slate-900 mt-1">{summary.returnsToday ?? 0}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-2xs font-bold text-slate-400">مرتجعات هذا الشهر</p>
            <p className="text-xl font-black text-slate-900 mt-1">{summary.returnsThisMonth ?? 0}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-2xs font-bold text-slate-400">إجمالي الأذونات المسجلة</p>
            <p className="text-xl font-black text-slate-900 mt-1">{totalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* تنبيه الخطأ */}
      {apiError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-800">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="text-sm font-bold">تعذر الاتصال بخادم أذونات المرتجع</p>
              <p className="text-xs text-rose-600 mt-0.5">{apiError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={refetchVouchers}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* الفلاتر */}
      <VouchersFilter
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
        status={status}
        setStatus={(st) => {
          setStatus(st);
          setPage(1);
        }}
        type={VOUCHER_TYPE.RETURN}
        onReset={handleResetFilters}
      />

      {/* جدول أذونات المرتجع */}
      <VouchersTable
        vouchers={vouchers}
        loading={loading}
        type={VOUCHER_TYPE.RETURN}
        page={page}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        onView={(item) => setViewingVoucherId(item.id)}
        onCancel={(item) => setCancellingVoucher(item)}
      />

      {/* نافذة تسجيل إذن مرتجع جديد */}
      {isAddModalOpen && (
        <VoucherFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveVoucher}
          type={VOUCHER_TYPE.RETURN}
        />
      )}

      {/* نافذة عرض وتفاصيل وطباعة الإذن */}
      {Boolean(viewingVoucherId) && (
        <VoucherDetailsModal
          isOpen={Boolean(viewingVoucherId)}
          voucherId={viewingVoucherId}
          onClose={() => setViewingVoucherId(null)}
          onOpenCancel={(v) => {
            setViewingVoucherId(null);
            setCancellingVoucher(v);
          }}
        />
      )}

      {/* نافذة تأكيد إلغاء الإذن مع السبب */}
      {Boolean(cancellingVoucher) && (
        <CancelVoucherModal
          isOpen={Boolean(cancellingVoucher)}
          voucherNumber={cancellingVoucher.voucherNumber}
          onClose={() => setCancellingVoucher(null)}
          onConfirm={handleConfirmCancel}
        />
      )}
    </div>
  );
}
