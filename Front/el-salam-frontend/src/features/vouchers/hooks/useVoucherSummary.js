import { useState, useEffect } from "react";
import { getStockVouchersSummary } from "../services/voucherService";

const VOUCHER_CHANGED_EVENT = "stock_vouchers_changed";

/**
 * إرسال إشعار بتحديث أذونات المخزن لإعادة جلب الإحصائيات والشريط الجانبي
 */
export function notifyVoucherChanged() {
  window.dispatchEvent(new Event(VOUCHER_CHANGED_EVENT));
}

/**
 * خطاف لجلب ملخص أذونات المخزن والاستماع للتحديثات اللحظية
 */
export function useVoucherSummary() {
  const [summary, setSummary] = useState({
    inboundToday: 0,
    outboundToday: 0,
    inboundThisMonth: 0,
    outboundThisMonth: 0,
    cancelledToday: 0,
    returnsToday: 0,
    returnsThisMonth: 0,
    shortagesToday: 0,
    shortagesThisMonth: 0,
    lastVoucherNumber: null,
    lastVoucherAtUtc: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    getStockVouchersSummary()
      .then((data) => {
        if (!ignore && data) {
          setSummary(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("فشل في جلب ملخص أذونات المخزن:", err);
          setLoading(false);
        }
      });

    const handleChanged = () => {
      getStockVouchersSummary()
        .then((data) => {
          if (!ignore && data) setSummary(data);
        })
        .catch((err) => {
          console.error("فشل في تحديث ملخص الأذونات:", err);
        });
    };

    window.addEventListener(VOUCHER_CHANGED_EVENT, handleChanged);
    return () => {
      ignore = true;
      window.removeEventListener(VOUCHER_CHANGED_EVENT, handleChanged);
    };
  }, []);

  return { summary, loading };
}
