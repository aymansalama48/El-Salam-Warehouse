import { Search } from "lucide-react";

export function CustomerFilter({ searchTerm, setSearchTerm, selectedCategory, setSelectedCategory }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث باسم العميل/المكتبة، المدينة، رقم الهاتف..."
          className="w-full pl-4 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 focus:bg-white transition-colors"
        />
      </div>

      <div className="flex items-center gap-2">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-52 px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-slate-800 cursor-pointer"
        >
          <option value="all">جميع فئات العملاء</option>
          <option value="تاجر جملة معتمد">تجار جملة معتمدون</option>
          <option value="موزع إقليمي">موزعون إقليميون</option>
          <option value="مكتبات تجزئة كبرى">مكتبات تجزئة كبرى</option>
          <option value="فرع توزيع داخلي">منافذ المصنع وفروع التوزيع</option>
        </select>
      </div>
    </div>
  );
}

