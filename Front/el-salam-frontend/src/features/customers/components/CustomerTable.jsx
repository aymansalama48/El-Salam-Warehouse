import { Edit2, Trash2, Phone, MapPin, Store, Eye } from "lucide-react";

export function CustomerTable({ customers = [], loading, onDelete, onEdit, onView }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/70 p-8 text-center animate-pulse">
        <div className="h-6 w-1/3 bg-slate-200 rounded mx-auto mb-4"></div>
        <div className="h-4 w-1/2 bg-slate-100 rounded mx-auto"></div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/70 p-12 text-center">
        <p className="text-slate-500 font-medium">لا توجد جهات صرف مطابقة للبحث</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/70 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50/70 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">كود الجهة</th>
              <th className="py-3 px-4">اسم العميل / المؤسسة</th>
              <th className="py-3 px-4">الفئة التجارية</th>
              <th className="py-3 px-4">المسؤول</th>
              <th className="py-3 px-4">رقم الهاتف</th>
              <th className="py-3 px-4">المدينة / الفرع</th>
              <th className="py-3 px-4">إجمالي الطلبيات</th>
              <th className="py-3 px-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-4 font-mono font-medium text-xs text-slate-600">
                  <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-mono font-semibold text-slate-700">
                    {item.id}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                      <Store className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-slate-900">{item.name}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                    {item.category}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                  {item.contactPerson}
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {item.phone}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-xs font-medium text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {item.city}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-bold text-slate-800 text-xs">
                  {item.totalOrders} <span className="font-normal text-slate-400 text-2xs">طلبية</span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {onView && (
                      <button
                        onClick={() => onView(item)}
                        title="عرض بيانات العميل"
                        className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit && onEdit(item)}
                      title="تعديل"
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
