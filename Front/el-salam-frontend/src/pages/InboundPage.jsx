import { useState, useEffect } from "react";
import { 
  ArrowDownToLine, 
  Plus, 
  RefreshCw, 
  AlertCircle 
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
import { notifyVoucherChanged } from "../features/vouchers/hooks/useVoucherSummary";
import { showSuccess, showError } from "../utils/alertUtils";

export default function InboundPage() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // الفلاتر
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [source, setSource] = useState("all");
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
      type: VOUCHER_TYPE.INBOUND,
      search: searchTerm,
      fromDate,
      toDate,
      source: source === "all" ? undefined : source,
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
          console.error("فشل في تحميل أذونات الوارد:", err);
          setApiError(err.message || "تعذر الاتصال بخادم الـ Backend");
          setVouchers([]);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [searchTerm, fromDate, toDate, source, status, page, pageSize, refreshTrigger]);

  // حفظ إذن وارد جديد
  const handleSaveVoucher = async (formData) => {
    await createStockVoucher(formData);
    showSuccess("تم تسجيل إذن الوارد بنجاح", "تم توثيق استلام المنتجات بالمخزن وتحديث الأرصدة");
    notifyVoucherChanged();
    refetchVouchers();
  };

  // تأكيد إلغاء الإذن
  const handleConfirmCancel = async (reason) => {
    if (!cancellingVoucher) return;
    try {
      await cancelStockVoucher(cancellingVoucher.id, reason);
      showSuccess("تم إلغاء الإذن بنجاح", `تم إلغاء إذن الوارد رقم "${cancellingVoucher.voucherNumber || cancellingVoucher.id}" وعكس رصيد المخزن`);
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
    setSource("all");
    setStatus("all");
    setPage(1);
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <ArrowDownToLine className="w-5 h-5" />
            </span>
            أذونات الوارد واستلام المنتجات
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            توثيق حركات إيداع واستلام الكشاكيل والكراريس وورق التصوير بالمستودع
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          تسجيل إذن وارد جديد
        </button>
      </div>

      {/* تنبيه الخطأ */}
      {apiError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-800">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="text-sm font-bold">تعذر الاتصال بخادم أذونات المخزن</p>
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
        source={source}
        setSource={(s) => {
          setSource(s);
          setPage(1);
        }}
        status={status}
        setStatus={(st) => {
          setStatus(st);
          setPage(1);
        }}
        type={VOUCHER_TYPE.INBOUND}
        onReset={handleResetFilters}
      />

      {/* جدول أذونات الوارد */}
      <VouchersTable
        vouchers={vouchers}
        loading={loading}
        type={VOUCHER_TYPE.INBOUND}
        page={page}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        onView={(item) => setViewingVoucherId(item.id)}
        onCancel={(item) => setCancellingVoucher(item)}
      />

      {/* نافذة تسجيل إذن وارد جديد */}
      {isAddModalOpen && (
        <VoucherFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveVoucher}
          type={VOUCHER_TYPE.INBOUND}
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
