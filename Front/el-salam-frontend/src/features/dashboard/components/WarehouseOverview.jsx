import { BookOpen, ArrowUpRight, AlertTriangle, Package2, BookCopy, FileStack } from "lucide-react";
import { StatCard } from "./StatCard";

export function WarehouseOverview({ stats, loading }) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
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
      {/* 1. الكروت الثلاثة الرئيسية بإحصائيات حقيقية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="إجمالي الأصناف المسجلة"
          value={totalProductsText}
          change={productsDetail}
          changeType="neutral"
          icon={BookOpen}
          color="blue"
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
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                <BookCopy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">الكشاكيل</span>
                <span className="text-2xs text-slate-400 font-medium">رصيد الكشاكيل الجاهزة</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 font-bold shrink-0">
              {stats?.notebooks?.productCount ?? 0} صنف
            </span>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-baseline justify-between">
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {(stats?.notebooks?.totalSubUnits ?? 0).toLocaleString()}{" "}
              <span className="text-xs font-bold text-slate-500">كشكول</span>
            </p>
            <span className="text-2xs font-extrabold text-blue-700 bg-blue-50/80 px-2.5 py-0.5 rounded-md border border-blue-100/80">
              رصيد متوفر
            </span>
          </div>
        </div>

        {/* قسم الكراريس */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Package2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">الكراريس</span>
                <span className="text-2xs text-slate-400 font-medium">رصيد الكراريس الجاهزة</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold shrink-0">
              {stats?.booklets?.productCount ?? 0} صنف
            </span>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-baseline justify-between">
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {(stats?.booklets?.totalSubUnits ?? 0).toLocaleString()}{" "}
              <span className="text-xs font-bold text-slate-500">كراس</span>
            </p>
            <span className="text-2xs font-extrabold text-emerald-700 bg-emerald-50/80 px-2.5 py-0.5 rounded-md border border-emerald-100/80">
              رصيد متوفر
            </span>
          </div>
        </div>

        {/* قسم ورق التصوير */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/60 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                <FileStack className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">ورق التصوير</span>
                <span className="text-2xs text-slate-400 font-medium">رصيد الكراتين والرزم</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60 font-bold shrink-0">
              {stats?.copyPaper?.productCount ?? 0} صنف
            </span>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-baseline justify-between gap-2">
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              {(stats?.copyPaper?.fullBaseUnits ?? 0).toLocaleString()}{" "}
              <span className="text-xs font-bold text-slate-500">كرتونة</span>
              {(() => {
                const rem = stats?.copyPaper?.remainingSubUnits ?? ((stats?.copyPaper?.totalSubUnits ?? 0) % 5);
                return rem > 0 ? (
                  <span className="text-xs font-bold text-purple-700 mr-1.5">
                    و {rem.toLocaleString()} رزمة
                  </span>
                ) : null;
              })()}
            </p>
            <span className="text-2xs font-extrabold text-purple-700 bg-purple-50/80 px-2 py-0.5 rounded-md border border-purple-100/80 shrink-0">
              {(stats?.copyPaper?.totalSubUnits ?? 0).toLocaleString()} رزمة
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WarehouseOverview;
