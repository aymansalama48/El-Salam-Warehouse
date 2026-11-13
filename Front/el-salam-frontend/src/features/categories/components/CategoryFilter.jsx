import { Search } from "lucide-react";

export function CategoryFilter({ searchTerm, setSearchTerm }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-2xs">
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث باسم الفئة أو بالوصف..."
          className="w-full pl-4 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:bg-white transition-colors"
        />
      </div>
    </div>
  );
}
