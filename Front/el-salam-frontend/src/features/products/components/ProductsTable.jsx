import { Edit2, Trash2, Eye, Box, MapPin, Layers, AlertTriangle, GripVertical } from "lucide-react";
import { useTableReorder } from "../../../hooks/useTableReorder";

export function ProductsTable({
  products = [],
  loading,
  onDelete,
  onEdit,
  onView,
  onReorder,
  canReorder = true,
}) {
  const { draggedIndex, dropTargetIndex, isLongPressing, getRowProps } = useTableReorder({
    items: products,
    onReorder,
    enabled: Boolean(canReorder && onReorder && products.length > 1),
  });
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/70 p-8 text-center animate-pulse">
        <div className="h-6 w-1/3 bg-slate-200 rounded mx-auto mb-4"></div>
        <div className="h-4 w-1/2 bg-slate-100 rounded mx-auto"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Box className="w-7 h-7" />
        </div>
        <p className="text-slate-800 font-bold text-base mb-1">لا توجد أي منتجات مسجلة في قاعدة البيانات</p>
        <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
          لم يتم العثور على أي منتجات مطابقة. يمكنك إضافة منتج جديد لتسجيل الكشاكيل أو الكراريس أو ورق التصوير.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    // 1 = InStock (متوفر) | 2 = LowStock (منخفض) | 3 = OutOfStock (نفد)
    if (status === 3) {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-100">
          نفد
        </span>
      );
    }
    if (status === 2) {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-100">
          منخفض
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
        متوفر
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/70 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50/70 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="w-10 py-3 px-2 text-center whitespace-nowrap" title="ترتيب العرض (اسحب أو اضغط مطولاً)">
                <GripVertical className="w-4 h-4 text-slate-400 mx-auto" />
              </th>
              <th className="py-3 px-4 whitespace-nowrap">اسم المنتج أو الصنف</th>
              <th className="py-3 px-4 whitespace-nowrap">فئة المنتج</th>
              <th className="py-3 px-4 whitespace-nowrap">محتوى الباكو / الكرتونة</th>
              <th className="py-3 px-4 whitespace-nowrap">الرصيد بالباكو / الكرتونة</th>
              <th className="py-3 px-4 whitespace-nowrap">حد النفاذ (الرصيد الحرج)</th>
              <th className="py-3 px-4 whitespace-nowrap">مكان التخزين</th>
              <th className="py-3 px-4 whitespace-nowrap">الحالة</th>
              <th className="py-3 px-4 text-center whitespace-nowrap">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((item, index) => {
              const baseUnit = item.baseUnit || "باكو";
              const subUnit = item.subUnit || "كشكول";
              const content = item.unitsPerBaseUnit || 10;
              const hex = item.categoryColorHex || "#2563EB";
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
                  <td className="py-3.5 px-2 text-center whitespace-nowrap">
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
                  {/* اسم المنتج */}
                  <td className="py-3.5 px-4 font-bold text-slate-800 min-w-[200px]">
                    <div>{item.name}</div>
                  </td>

                  {/* فئة المنتج */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className="px-2.5 py-1 rounded-md text-xs font-semibold border inline-flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${hex}12`,
                        color: hex,
                        borderColor: `${hex}30`,
                      }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hex }}></span>
                      {item.categoryName || "عام"}
                    </span>
                  </td>

                  {/* محتوى الباكو / الكرتونة */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                      <Box className="w-3.5 h-3.5 text-slate-500" />
                      {content.toLocaleString()} {subUnit} بال{baseUnit}
                    </span>
                  </td>

                  {/* الرصيد بالوحدة الكبيرة */}
                  <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-sm font-bold">
                        {item.fullBaseUnits} {baseUnit}
                        {item.remainingSubUnits > 0 && ` و ${item.remainingSubUnits} ${subUnit}`}
                      </span>
                    </span>
                  </td>

                  {/* حد النفاذ والتنبيه */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {item.lowStockThreshold > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/70 text-xs font-bold shadow-2xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        {item.unitType === 3 ? (
                          item.lowStockThresholdUnit === 2 ? (
                            <span>
                              {item.lowStockThreshold.toLocaleString()} كرتونة
                              <span className="text-2xs text-amber-600 font-semibold mr-1">
                                ({item.lowStockThresholdSubUnits.toLocaleString()} رزمة)
                              </span>
                            </span>
                          ) : (
                            <span>{item.lowStockThreshold.toLocaleString()} رزمة</span>
                          )
                        ) : (
                          <span>{item.lowStockThreshold.toLocaleString()} {subUnit}</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-2xs text-slate-400 font-medium">غير محدد (0)</span>
                    )}
                  </td>

                  {/* مكان التخزين بالمستودع */}
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {item.storageLocation || "المستودع الرئيسي"}
                    </span>
                  </td>

                  {/* الحالة */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>

                  {/* الإجراءات */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {onView && (
                        <button
                          type="button"
                          onClick={() => onView(item)}
                          title="عرض تفاصيل الصنف"
                          className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={() => onEdit && onEdit(item)}
                        title="تعديل المنتج" 
                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete && onDelete(item)}
                        title="حذف المنتج"
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

export default ProductsTable;
