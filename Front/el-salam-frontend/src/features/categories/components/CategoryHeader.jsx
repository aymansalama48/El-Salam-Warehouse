import { Plus } from "lucide-react";

export function CategoryHeader({ 
  onAddCategory, 
  onOpenAddModal, 
  count, 
  totalCount 
}) {
  const handleAdd = onAddCategory || onOpenAddModal;
  const displayCount = totalCount ?? count ?? 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">إدارة تصنيفات وفئات المخزن</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          تنظيم وتصنيف الكشاكيل والكراريس وورق التصوير إلى فئات واضحة ({displayCount} فئات مسجلة)
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          إضافة فئة جديدة
        </button>
      </div>
    </div>
  );
}

