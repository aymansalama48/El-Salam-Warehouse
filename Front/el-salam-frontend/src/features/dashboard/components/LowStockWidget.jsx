import { AlertTriangle, CheckCircle2, ArrowRight, PackageX, PlusCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export function LowStockWidget({ lowStockItems = [], totalProducts = 0, loading, onSelectProduct }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs animate-pulse">
        <div className="h-5 w-32 bg-slate-200 rounded mb-4"></div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const outOfStockItems = lowStockItems.filter(
    (item) => item.status === "منعدم" || item.totalSubUnitStock <= 0
  );
  const lowOnlyItems = lowStockItems.filter(
    (item) => item.status !== "منعدم" && item.totalSubUnitStock > 0
  );

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`w-4 h-4 ${
                outOfStockItems.length > 0
                  ? "text-rose-500"
                  : lowOnlyItems.length > 0
                  ? "text-amber-500"
                  : totalProducts === 0
                  ? "text-slate-400"
                  : "text-emerald-500"
              }`}
            />
            <h3 className="font-bold text-slate-800 text-sm">متابعة النواقص والحد الحرج</h3>
          </div>

          {/* Badge */}
          {totalProducts === 0 ? (
            <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-slate-100 text-slate-600">
              لا توجد أصناف
            </span>
          ) : lowStockItems.length > 0 ? (
            <div className="flex items-center gap-1">
              {outOfStockItems.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                  {outOfStockItems.length} نافذ
                </span>
              )}
              {lowOnlyItems.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                  {lowOnlyItems.length} قارب على النفاد
                </span>
              )}
            </div>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              المخزون آمن ({totalProducts} صنف)
            </span>
          )}
        </div>

        {/* Content Body */}
        {totalProducts === 0 ? (
          // الحالة الأولى: لا توجد أي منتجات مسجلة بالمستودع أصلاً
          <div className="py-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-2.5 text-slate-400">
              <PackageX className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-700">المستودع فارغ حالياً</p>
            <p className="text-3xs text-slate-400 mt-0.5 max-w-xs mx-auto">
              لم يتم تسجيل أي أصناف أو منتجات بالمخزن حتى الآن. ابدأ بإضافة الأصناف لمتابعة الأرصدة والنواقص.
            </p>
            <Link
              to="/finished-goods"
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-2xs font-bold transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>إضافة أول صنف بالمستودع</span>
            </Link>
          </div>
        ) : lowStockItems.length === 0 ? (
          // الحالة الثانية: منتجات مسجلة ولكن كافة الأرصدة آمنة
          <div className="py-6 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            <p className="text-xs font-bold text-slate-700">كافة الأصناف متوفرة برصيد آمن</p>
            <p className="text-3xs text-slate-400 mt-0.5">
              جميع الأصناف المسجلة ({totalProducts} صنف) أرصدتها متوفرة وأعلى من الحد الحرج
            </p>
          </div>
        ) : (
          // الحالة الثالثة: توجد أصناف نافذة أو قاربت على النفاد
          <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
            {lowStockItems.map((item) => {
              const isOut = item.status === "منعدم" || item.totalSubUnitStock <= 0;
              const baseLabel = item.baseUnit || item.entryUnitLabel || "باكو";
              const subLabel = item.subUnit || item.entryUnitLabel || "قطعة";

              const productId = item.productId || item.id;

              return (
                <div
                  key={productId}
                  onClick={() => {
                    if (productId && onSelectProduct) {
                      onSelectProduct(productId, item);
                    }
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all cursor-pointer hover:shadow-2xs hover:scale-[1.01] active:scale-[0.99] group ${
                    isOut
                      ? "bg-rose-50/40 border-rose-100 hover:bg-rose-50/80 hover:border-rose-200"
                      : "bg-amber-50/40 border-amber-100 hover:bg-amber-50/80 hover:border-amber-200"
                  }`}
                  title="انقر لعرض تفاصيل وبطاقة الصنف"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isOut ? "bg-rose-500" : "bg-amber-500"
                        }`}
                      />
                      <p className="font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                        {item.productName}
                      </p>
                    </div>
                    <p className="text-3xs text-slate-400 truncate pr-3 mt-0.5">
                      قسم: {item.categoryName}
                    </p>
                  </div>

                  <div className="text-left shrink-0">
                    {(() => {
                      const fullBase = item.fullBaseUnits ?? 0;
                      const remSub = item.remainingSubUnits ?? (item.unitsPerBaseUnit > 0 ? item.totalSubUnitStock % item.unitsPerBaseUnit : 0);
                      let baseStockText = `${fullBase.toLocaleString()} ${baseLabel}`;
                      if (remSub > 0) {
                        baseStockText += ` و ${remSub.toLocaleString()} ${subLabel}`;
                      }

                      return (
                        <>
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-3xs font-extrabold ${
                              isOut
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {isOut
                              ? "نافذ تماماً (0 رصيد)"
                              : `قارب على النفاد (${baseStockText})`}
                          </span>
                          {!isOut && item.totalSubUnitStock > 0 && (
                            <p className="text-3xs text-slate-500 mt-0.5 text-left font-bold">
                              ({item.totalSubUnitStock.toLocaleString()} {subLabel})
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <Link
          to="/finished-goods"
          className="text-2xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
        >
          <span>عرض كل المنتجات</span>
          <ArrowRight className="w-3 h-3" />
        </Link>

        {lowStockItems.length > 0 && (
          <Link
            to="/inbound"
            className="text-2xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            تسجيل إذن توريد جديد
          </Link>
        )}
      </div>
    </div>
  );
}

export default LowStockWidget;
