import { Edit2, Trash2, Eye } from "lucide-react";

export function RawMaterialsTable({ materials = [], loading, onDelete, onEdit, onView }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/70 p-8 text-center animate-pulse">
        <div className="h-6 w-1/3 bg-slate-200 rounded mx-auto mb-4"></div>
        <div className="h-4 w-1/2 bg-slate-100 rounded mx-auto"></div>
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/70 p-12 text-center">
        <p className="text-slate-500 font-medium">لا توجد مواد خام مطابقة للبحث</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "sufficient":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">كافٍ</span>;
      case "low":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-100">طلب توريد</span>;
      case "critical":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-100">حرج جداً</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/70 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50/70 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">كود المادة</th>
              <th className="py-3 px-4">اسم المادة الخام</th>
              <th className="py-3 px-4">النوع</th>
              <th className="py-3 px-4">الكمية الحالية</th>
              <th className="py-3 px-4">الوحدة</th>
              <th className="py-3 px-4">المورد الرئيسي</th>
              <th className="py-3 px-4">حالة المخزون</th>
              <th className="py-3 px-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {materials.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4 font-mono font-medium text-xs text-slate-600">{item.code}</td>
                <td className="py-3 px-4 font-semibold text-slate-800">{item.name}</td>
                <td className="py-3 px-4 text-slate-600 text-xs font-medium">{item.type}</td>
                <td className="py-3 px-4 font-bold text-slate-900">{item.quantity.toLocaleString()}</td>
                <td className="py-3 px-4 text-slate-600 text-xs font-medium">{item.unit}</td>
                <td className="py-3 px-4 text-xs font-medium text-slate-500">{item.supplier}</td>
                <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {onView && (
                      <button
                        onClick={() => onView(item)}
                        title="عرض تفاصيل المادة الخام"
                        className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => onEdit && onEdit(item)}
                      title="تعديل الخامة" 
                      className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete && onDelete(item)}
                      title="حذف"
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
