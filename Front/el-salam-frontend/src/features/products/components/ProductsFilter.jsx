import { Search, Filter } from "lucide-react";

export function ProductsFilter({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories = [],
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث باسم الكشكول/الكراسة أو مكان التخزين..."
          className="w-full pl-4 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 focus:bg-white transition-colors"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 sm:flex-initial">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-56 px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-slate-800 cursor-pointer"
          >
            <option value="all">جميع فئات المنتجات</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setSearchTerm("");
            setSelectedCategory("all");
          }}
          title="إعادة ضبط الفلاتر"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <Filter className="w-3.5 h-3.5" />
          إعادة ضبط
        </button>
      </div>
    </div>
  );
}

export default ProductsFilter;
