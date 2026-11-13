import { BookOpen, Layers, ArrowUpRight, AlertTriangle, Package2, BookCopy, FileStack } from "lucide-react";
import { StatCard } from "./StatCard";

export function WarehouseOverview({ stats, loading }) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-slate-100 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-slate-100 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // حساب نصوص الإحصائيات الحقيقية
  const totalProductsText = `${stats?.totalProducts ?? 0} صنف`;
  const productsDetail = `${stats?.totalCategories ?? 0} فئات نشطة بالمخزن`;

  const cartonsCount = stats?.totalCartons ?? 0;
  const remReams = stats?.copyPaper?.remainingSubUnits ?? ((stats?.copyPaper?.totalSubUnits ?? 0) % 5);
  let cartonsText = `${cartonsCount.toLocaleString()} كرتونة`;
  if (remReams > 0) {
    cartonsText += ` و ${remReams.toLocaleString()} رزمة`;
  }
  const packsText = `${(stats?.totalPacks ?? 0).toLocaleString()} باكو`;
  const packsAndCartonsText = cartonsCount > 0 || remReams > 0
    ? `${packsText} / ${cartonsText}`
    : packsText;
  const stockDetail = `إجمالي ${(stats?.totalSubUnits ?? 0).toLocaleString()} قطعة ورزمة`;

  const transactionsText = `${stats?.todayTransactionsCount ?? 0} إذن`;
  const transactionsDetail = `وارد: ${stats?.inboundToday ?? 0} • منصرف: ${stats?.outboundToday ?? 0}`;

  const totalProducts = stats?.totalProducts ?? 0;
  const lowStockCount = stats?.lowStockCount ?? 0;
  const outOfStockCount = stats?.outOfStockCount ?? 0;
  const lowStockOnlyCount = Math.max(0, lowStockCount - outOfStockCount);

  let lowStockText = `${lowStockCount} صنف`;
  let lowStockDetail = "المخزون متوفر ومستقر";
  let lowStockChangeType = "positive";
  let lowStockColor = "emerald";

  if (totalProducts === 0) {
    lowStockText = "0 صنف";
    lowStockDetail = "لا توجد أصناف مسجلة بالمخزن";
    lowStockChangeType = "neutral";
    lowStockColor = "blue";
  } else if (outOfStockCount > 0 && lowStockOnlyCount > 0) {
    lowStockDetail = `${outOfStockCount} نافذ • ${lowStockOnlyCount} قارب على النفاد`;
    lowStockChangeType = "negative";
    lowStockColor = "rose";
  } else if (outOfStockCount > 0) {
    lowStockDetail = `${outOfStockCount} صنف منعدم الرصيد تماماً`;
    lowStockChangeType = "negative";
    lowStockColor = "rose";
  } else if (lowStockCount > 0) {
    lowStockDetail = `${lowStockCount} صنف قارب على النفاد (حد حرج)`;
    lowStockChangeType = "negative";
    lowStockColor = "amber";
  }

  return (
    <div className="space-y-4">
      {/* 1. الكروت الأربعة الرئيسية بإحصائيات حقيقية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الأصناف المسجلة"
          value={totalProductsText}
          change={productsDetail}
          changeType="neutral"
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="رصيد المستودع (باكو / كرتونة)"
          value={packsAndCartonsText}
          change={stockDetail}
          changeType="positive"
          icon={Layers}
          color="emerald"
        />
        <StatCard
          title="حركات اليوم (وارد / منصرف)"
          value={transactionsText}
          change={transactionsDetail}
          changeType="neutral"
          icon={ArrowUpRight}
          color="violet"
        />
        <StatCard
          title="أصناف قاربت على النفاد"
          value={lowStockText}
          change={lowStockDetail}
          changeType={lowStockChangeType}
          icon={AlertTriangle}
          color={lowStockColor}
        />
      </div>

      {/* 2. بطاقات تفصيل الرصيد الحقيقي حسب نوع المنتج (كشكول / كراس / ورق تصوير) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* قسم الكشاكيل */}
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <BookCopy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">الكشاكيل</span>
                <span className="text-3xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                  {stats?.notebooks?.productCount ?? 0} صنف
                </span>
              </div>
              <p className="text-base font-black text-slate-900 mt-0.5">
                {(stats?.notebooks?.fullBaseUnits ?? 0).toLocaleString()}{" "}
                <span className="text-xs font-semibold text-slate-500">باكو</span>
                {(stats?.notebooks?.remainingSubUnits > 0) && (
                  <span className="text-xs font-bold text-blue-700 mr-1">
                    و {stats.notebooks.remainingSubUnits} كشكول
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="text-left">
            <span className="text-3xs text-slate-400 block font-medium">الرصيد بالكشكول</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              ({(stats?.notebooks?.totalSubUnits ?? 0).toLocaleString()} كشكول)
            </span>
          </div>
        </div>

        {/* قسم الكراريس */}
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Package2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">الكراريس</span>
                <span className="text-3xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                  {stats?.booklets?.productCount ?? 0} صنف
                </span>
              </div>
              <p className="text-base font-black text-slate-900 mt-0.5">
                {(stats?.booklets?.fullBaseUnits ?? 0).toLocaleString()}{" "}
                <span className="text-xs font-semibold text-slate-500">باكو</span>
                {(stats?.booklets?.remainingSubUnits > 0) && (
                  <span className="text-xs font-bold text-emerald-700 mr-1">
                    و {stats.booklets.remainingSubUnits} كراس
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="text-left">
            <span className="text-3xs text-slate-400 block font-medium">الرصيد بالكراس</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              ({(stats?.booklets?.totalSubUnits ?? 0).toLocaleString()} كراس)
            </span>
          </div>
        </div>

        {/* قسم ورق التصوير */}
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <FileStack className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">ورق التصوير</span>
                <span className="text-3xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold">
                  {stats?.copyPaper?.productCount ?? 0} صنف
                </span>
              </div>
              <p className="text-base font-black text-slate-900 mt-0.5">
                {(stats?.copyPaper?.fullBaseUnits ?? 0).toLocaleString()}{" "}
                <span className="text-xs font-semibold text-slate-500">كرتونة</span>
                {(() => {
                  const rem = stats?.copyPaper?.remainingSubUnits ?? ((stats?.copyPaper?.totalSubUnits ?? 0) % 5);
                  return rem > 0 ? (
                    <span className="text-xs font-bold text-purple-700 mr-1">
                      و {rem.toLocaleString()} رزمة
                    </span>
                  ) : null;
                })()}
              </p>
            </div>
          </div>
          <div className="text-left">
            <span className="text-3xs text-slate-400 block font-medium">الرصيد بالرزمة</span>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
              ({(stats?.copyPaper?.totalSubUnits ?? 0).toLocaleString()} رزمة)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WarehouseOverview;
