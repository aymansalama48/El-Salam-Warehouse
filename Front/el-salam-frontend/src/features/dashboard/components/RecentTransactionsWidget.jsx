import { ArrowDownLeft, ArrowUpRight, Clock, FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCairoDateTime } from "../../../utils/dateUtils";

export function RecentTransactionsWidget({ activities = [], loading, onSelectVoucher }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs animate-pulse">
        <div className="h-6 w-40 bg-slate-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base">آخر حركات المستودع</h3>
          <p className="text-xs text-slate-500 mt-0.5">متابعة فورية ومباشرة للأذونات والعمليات</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            مباشر (Live)
          </span>
          <Link
            to="/stock-ledger"
            className="text-2xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline mr-2"
          >
            <span>دفتر اليومية</span>
            <ArrowLeft className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="py-10 text-center text-slate-400">
          <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-xs font-semibold text-slate-500">لا توجد حركات مسجلة مؤخراً بالمستودع</p>
          <p className="text-3xs text-slate-400 mt-1">يمكنك إصدار أذونات وارد أو صرف جديدة للبدء في تسجيل الحركات</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {activities.map((item, idx) => {
            const isInbound = item.type === 1 || item.type === "in";
            const badgeIcon = isInbound ? ArrowDownLeft : ArrowUpRight;
            const badgeBg = isInbound
              ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
              : "bg-blue-50 text-blue-700 border-blue-200/60";
            const typeLabel = isInbound ? "إذن استلام وارد" : "إذن صرف بضاعة";
            const Icon = badgeIcon;

            const timeStr = item.time || formatCairoDateTime(item.occurredAtUtc || item.voucherDate);
            const title = item.title || `${typeLabel}: ${item.description || item.voucherNumber}`;
            const party = item.supplier || item.partyName || (isInbound ? "صالة الإنتاج" : "عميل تجاري");
            const user = item.user || item.receiverName || "أمين المستودع";

            const voucherId = item.voucherId || item.id;

            return (
              <div
                key={voucherId || idx}
                onClick={() => {
                  if (voucherId && onSelectVoucher) {
                    onSelectVoucher(voucherId);
                  }
                }}
                className="py-3.5 px-3 -mx-3 first:pt-2 last:pb-2 flex items-center justify-between gap-3 rounded-xl transition-all cursor-pointer hover:bg-slate-50/90 active:scale-[0.99] group"
                title="انقر لعرض تفاصيل الإذن وطباعة السند"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl border shrink-0 transition-transform group-hover:scale-105 ${badgeBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                      {title}
                    </p>
                    <p className="text-2xs text-slate-400 mt-0.5 truncate flex items-center gap-1">
                      <span>{party}</span>
                      <span>•</span>
                      <span>المستلم: {user}</span>
                      {item.voucherNumber && (
                        <>
                          <span>•</span>
                          <span className="font-mono font-semibold text-slate-500">{item.voucherNumber}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <span className="text-xs sm:text-sm font-black text-slate-800 block">
                    {item.quantity || item.quantityLabel || "—"}
                  </span>
                  <span className="text-3xs text-slate-400 flex items-center gap-1 justify-end mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{timeStr}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RecentTransactionsWidget;
