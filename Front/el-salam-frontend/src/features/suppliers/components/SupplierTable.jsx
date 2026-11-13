import { Edit2, Trash2, Phone, MapPin, Building, Eye } from "lucide-react";

export function SupplierTable({ suppliers = [], loading, onDelete, onEdit, onView }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/70 p-8 text-center animate-pulse">
        <div className="h-6 w-1/3 bg-slate-200 rounded mx-auto mb-4"></div>
        <div className="h-4 w-1/2 bg-slate-100 rounded mx-auto"></div>
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/70 p-12 text-center">
        <p className="text-slate-500 font-medium">لا يوجد موردون مطابقون للبحث</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/70 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50/70 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">كود المورد</th>
              <th className="py-3 px-4">اسم الشركة / المطحن</th>
              <th className="py-3 px-4">المسؤول</th>
              <th className="py-3 px-4">نوع الخامات الموردة</th>
              <th className="py-3 px-4">رقم الهاتف</th>
              <th className="py-3 px-4">العنوان</th>
              <th className="py-3 px-4">الرصيد القائم</th>
              <th className="py-3 px-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-4 font-mono font-medium text-xs text-slate-600">
                  <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-mono font-semibold text-slate-700">
                    {item.id}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                      <Building className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      {item.taxNumber && (
                        <p className="text-2xs font-mono text-slate-400">ضريبي: {item.taxNumber}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                  {item.contactPerson}
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {item.supplyType}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {item.phone}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-xs font-medium text-slate-500 max-w-xs truncate">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {item.address}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-bold text-slate-800 text-xs">
                  {item.balance}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {onView && (
                      <button
                        onClick={() => onView(item)}
                        title="عرض بيانات المورد"
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
