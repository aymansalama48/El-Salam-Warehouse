import { Search } from "lucide-react";

export function RawMaterialsFilter({ searchTerm, setSearchTerm, selectedType, setSelectedType }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث برولات الورق، الدوبلكس، السلك، المورد..."
          className="w-full pl-4 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
        />
      </div>

      <div className="flex items-center gap-2">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
        >
          <option value="all">جميع خامات الإنتاج</option>
          <option value="رولات ورق">رولات وبكرات ورق أبيض</option>
          <option value="ورق أغلفة">ورق أغلفة ودوبلكس</option>
          <option value="أسلاك ودبابيس">أسلاك تدبيس وتجليد</option>
          <option value="أحبار طباعة">أحبار تسطير وطباعة</option>
          <option value="مواد تعبئة">مواد تعبئة وشرنك</option>
        </select>
      </div>
    </div>
  );
}
