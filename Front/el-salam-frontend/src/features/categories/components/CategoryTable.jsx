import { Edit2, Trash2, Eye, Tags, GripVertical, Calendar } from "lucide-react";
import { useTableReorder } from "../../../hooks/useTableReorder";
import { formatCairoDateTime } from "../../../utils/dateUtils";

export function CategoryTable({
  categories = [],
  loading,
  onDelete,
  onEdit,
  onView,
  onShowProducts,
  onReorder,
  canReorder = true,
}) {
  const { draggedIndex, dropTargetIndex, isLongPressing, getRowProps } = useTableReorder({
    items: categories,
    onReorder,
    enabled: Boolean(canReorder && onReorder && categories.length > 1),
  });
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/70 p-8 text-center animate-pulse">
        <div className="h-6 w-1/3 bg-slate-200 rounded mx-auto mb-4"></div>
        <div className="h-4 w-1/2 bg-slate-100 rounded mx-auto"></div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Tags className="w-7 h-7" />
        </div>
        <p className="text-slate-800 font-bold text-base mb-1">لا توجد أي فئات مسجلة في قاعدة البيانات</p>
        <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
          لم يتم العثور على أي فئات مطابقة. يمكنك إضافة فئة جديدة لتصنيف الكشاكيل والكراريس وورق التصوير.
        </p>
      </div>
    );
  }

  const resolveColorHex = (item) => {
    if (item.colorHex && item.colorHex.startsWith("#")) {
      return item.colorHex;
    }
    const map = {
      blue: "#2563EB",
      emerald: "#10B981",
      violet: "#8B5CF6",
      amber: "#F59E0B",
      rose: "#F43F5E",
      slate: "#64748B",
    };
    return map[item.color] || "#2563EB";
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/70 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50/70 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="w-10 py-3 px-2 text-center" title="ترتيب العرض (اسحب أو اضغط مطولاً)">
                <GripVertical className="w-4 h-4 text-slate-400 mx-auto" />
              </th>
              <th className="py-3 px-4">اسم الفئة والتصنيف</th>
              <th className="py-3 px-4">الأصناف التابعة</th>
              <th className="py-3 px-4">الوصف والبيان</th>
              <th className="py-3 px-4 whitespace-nowrap">تاريخ الإنشاء</th>
              <th className="py-3 px-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((item, index) => {
              const hex = resolveColorHex(item);
              const isDragged = draggedIndex === index;
              const isTarget = dropTargetIndex === index && draggedIndex !== index;
              const rowProps = getRowProps(index);

              return (
                <tr
                  key={item.id}
                  {...rowProps}
                  className={`transition-all select-none ${
                    isDragged
                      ? "opacity-40 bg-slate-100/90 scale-[0.99] shadow-inner"
                      : isTarget
                      ? "bg-blue-50/80 border-t-2 border-blue-500 ring-1 ring-blue-400/50"
                      : "hover:bg-slate-50/60"
                  } ${canReorder ? "cursor-grab active:cursor-grabbing" : ""}`}
                >
                  <td className="py-3.5 px-2 text-center">
                    <div
                      className={`p-1 rounded inline-flex items-center justify-center transition-colors ${
                        canReorder
                          ? "text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-grab active:cursor-grabbing"
                          : "text-slate-300 cursor-default opacity-50"
                      }`}
                      title={
                        canReorder
                          ? "اضغط مطولاً واسحب لأعلى أو لأسفل لتغيير ترتيب العرض"
                          : "الترتيب متاح في وضع العرض الكامل بدون فلترة"
                      }
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-white"
                        style={{ backgroundColor: hex }}
                      ></span>
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => onShowProducts && onShowProducts(item)}
                      title="اضغط لعرض الأصناف التابعة لهذه الفئة"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all border border-blue-200/60 hover:border-blue-300 cursor-pointer shadow-2xs group"
                    >
                      <Tags className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
                      <span>{item.productsCount || 0} صنف</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-500 max-w-sm truncate">
                    {item.description || "— لا يوجد وصف مسجل"}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatCairoDateTime(item.createdAt)}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {onView && (
                      <button
                        onClick={() => onView(item)}
                        title="عرض تفاصيل الفئة"
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
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
}
