import { ArrowDownLeft, ArrowUpRight, Edit2, Trash2, Eye, BookOpen, Layers } from "lucide-react";

export function TransactionsTable({ transactions = [], loading, onEdit, onDelete, onView }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/70 p-8 text-center animate-pulse">
        <div className="h-6 w-1/3 bg-slate-200 rounded mx-auto mb-4"></div>
        <div className="h-4 w-1/2 bg-slate-100 rounded mx-auto"></div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/70 p-12 text-center">
        <p className="text-slate-500 font-medium">لا توجد حركات مسجلة مطابقة للبحث</p>
      </div>
    );
  }

  const getTypeInfo = (type) => {
    switch (type) {
      case "inflow":
        return {
          icon: ArrowDownLeft,
          bg: "bg-emerald-50 text-emerald-700 border-emerald-100",
          text: "وارد (استلام إنتاج)",
        };
      case "outflow":
        return {
          icon: ArrowUpRight,
          bg: "bg-blue-50 text-blue-700 border-blue-100",
          text: "صادر (صرف طلبيات)",
        };
      default:
        return {
          icon: ArrowDownLeft,
          bg: "bg-slate-50 text-slate-700 border-slate-100",
          text: "حركة مخزنية",
        };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/70 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50/70 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">رقم الإذن</th>
              <th className="py-3 px-4">نوع الحركة</th>
              <th className="py-3 px-4">اسم الصنف / المنتج</th>
              <th className="py-3 px-4">الكمية (الوحدة الرئيسية)</th>
              <th className="py-3 px-4">إجمالي المحتوى الفعلي</th>
              <th className="py-3 px-4">الجهة (صالة الإنتاج / العميل)</th>
              <th className="py-3 px-4">مستند الإسناد</th>
              <th className="py-3 px-4">التاريخ والوقت</th>
              <th className="py-3 px-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((item) => {
              const info = getTypeInfo(item.type);
              const Icon = info.icon;
              return (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-700">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-xs font-mono font-semibold text-slate-700">
                      {item.id}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${info.bg}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {info.text}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{item.itemName}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <span className="inline-flex items-center gap-1.5 font-bold">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      {item.quantity}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-100">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      {item.totalUnits || "—"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-600">{item.party}</td>
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-500">{item.referenceDoc}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">{item.date}</td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {onView && (
                        <button
                          onClick={() => onView(item)}
                          title="عرض تفاصيل الإذن"
                          className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {onEdit && (
                        <button 
                          onClick={() => onEdit(item)}
                          title="تعديل الإذن" 
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          title="حذف الإذن"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
