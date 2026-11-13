import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Package,
  Layers,
  MapPin,
  Calendar,
  UserCheck,
  ExternalLink,
  Loader2,
  AlertCircle,
  Inbox,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { getCategoryProducts } from "../services/categoryService";
import { formatCairoDateTime } from "../../../utils/dateUtils";
import { formatBaseUnitStock } from "../../products/services/productService";

export function CategoryProductsModal({ isOpen, onClose, category }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !category?.id) return;

    let ignore = false;
    setLoading(true);
    setError(null);

    getCategoryProducts(category.id)
      .then((data) => {
        if (!ignore) {
          setProducts(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("فشل في تحميل الأصناف التابعة:", err);
          setError(err.message || "تعذر تحميل الأصناف التابعة لهذه الفئة");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, category?.id]);

  if (!isOpen || !category) return null;

  const hex = category.colorHex || category.color || "#2563EB";

  const handleGoToProducts = () => {
    onClose();
    navigate(`/finished-goods?categoryId=${category.id}`);
  };

  const getStatusBadge = (status) => {
    if (status === 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-3 h-3" />
          نفد
        </span>
      );
    }
    if (status === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3" />
          منخفض
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <ShieldCheck className="w-3 h-3" />
        متوفر
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[90dvh] text-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-2xs font-bold shrink-0"
              style={{ backgroundColor: hex }}
            >
              <Package className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">الأصناف التابعة للفئة</h3>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold border"
                  style={{
                    backgroundColor: `${hex}15`,
                    color: hex,
                    borderColor: `${hex}30`,
                  }}
                >
                  {category.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                إجمالي الأصناف المعتمدة تحت هذا التصنيف: {products.length} صنف
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-semibold">جاري جلب الأصناف والمنتجات التابعة...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              {error}
            </div>
          ) : products.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Inbox className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">لا توجد أصناف تابعة لهذه الفئة</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                لم يتم إدراج أي منتج أو كشكول تحت فئة "{category.name}" حتى الآن.
              </p>
              <button
                type="button"
                onClick={handleGoToProducts}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
              >
                <Package className="w-4 h-4" />
                الذهاب لإضافة صنف جديد
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">اسم الصنف</th>
                        <th className="py-2.5 px-3 text-center">الرصيد المخزني</th>
                        <th className="py-2.5 px-3 text-center">حالة التوفر</th>
                        <th className="py-2.5 px-3">مكان التخزين</th>
                        <th className="py-2.5 px-3">أضيف بواسطة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{p.name}</div>
                            <div className="text-2xs text-slate-400 mt-0.5">
                              {p.unitsPerBaseUnit} {p.subUnit || "قطعة"} بال{p.baseUnit || "باكو"}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-extrabold text-slate-900 block">
                              {formatBaseUnitStock(p)}
                            </span>
                            <span className="text-2xs text-slate-400 font-medium">
                              ({Number(p.totalSubUnitStock ?? 0).toLocaleString()} {p.subUnit || "قطعة"})
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">{getStatusBadge(p.status)}</td>
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            <span className="inline-flex items-center gap-1 text-2xs">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {p.storageLocation || "المستودع الرئيسي"}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1 font-bold text-slate-700 text-2xs">
                              <UserCheck className="w-3 h-3 text-slate-400" />
                              {p.createdByName || "Ayman Salama"}
                            </div>
                            <div className="text-3xs text-slate-400 font-mono mt-0.5">
                              {p.createdAt ? formatCairoDateTime(p.createdAt) : "—"}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={handleGoToProducts}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-xl transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            فتح في سجل المنتجات التامة
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-200/70 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

export default CategoryProductsModal;

