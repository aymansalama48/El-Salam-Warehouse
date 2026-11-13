import { useState, useEffect, useCallback } from "react";
import {
  getCategories,
  getCategoryById,
  addCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from "../features/categories/services/categoryService";
import { CategoryHeader } from "../features/categories/components/CategoryHeader";
import { CategoryFilter } from "../features/categories/components/CategoryFilter";
import { CategoryTable } from "../features/categories/components/CategoryTable";
import { CategoryFormModal } from "../features/categories/components/CategoryFormModal";
import { CategoryProductsModal } from "../features/categories/components/CategoryProductsModal";
import { DetailsModal } from "../components/common/DetailsModal";
import { showSuccess, showError, showConfirm } from "../utils/alertUtils";
import { formatCairoDateTime } from "../utils/dateUtils";
import { Tags, Box, FileText, Calendar, ShieldCheck, Palette, AlertCircle, RefreshCw, UserCheck } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedCategoryForProducts, setSelectedCategoryForProducts] = useState(null);

  const handleViewCategory = async (category) => {
    setViewingCategory({ name: category.name });
    setDetailsLoading(true);
    try {
      const detailed = await getCategoryById(category.id);
      if (detailed) {
        setViewingCategory(detailed);
      }
    } catch (err) {
      console.error("فشل في جلب تفاصيل الفئة عبر getCategoryById:", err);
      showError("تعذر جلب تفاصيل الفئة", err.message || "حدث خطأ أثناء جلب بيانات الفئة من الخادم");
    } finally {
      setDetailsLoading(false);
    }
  };

  const refetch = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await getCategories(searchTerm);
      setCategories(data);
    } catch (err) {
      console.error("فشل في تحميل الفئات من الخادم:", err);
      setApiError(err.message || "تعذر الاتصال بخادم الـ Backend");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    let ignore = false;
    getCategories(searchTerm)
      .then((data) => {
        if (!ignore) {
          setCategories(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("فشل في تحميل الفئات من الخادم:", err);
          setApiError(err.message || "تعذر الاتصال بخادم الـ Backend");
          setCategories([]);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [searchTerm]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (formData) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
        showSuccess("تم تعديل الفئة", `تم تحديث بيانات "${formData.name}" بنجاح`);
      } else {
        await addCategory(formData);
        showSuccess("تم إضافة الفئة بنجاح", `تم إنشاء فئة "${formData.name}" بنجاح`);
      }
      setIsModalOpen(false);
      await refetch();
    } catch (error) {
      console.error("خطأ في حفظ الفئة:", error);
      showError("تعذر حفظ الفئة", error.message || "حدث خطأ أثناء حفظ الفئة في الخادم");
    }
  };

  const handleDeleteCategory = async (category) => {
    if (category.productsCount > 0) {
      const confirmed = await showConfirm({
        title: "تنبيه: توجد أصناف مرتبطة",
        text: `هذه الفئة مرتبطة بـ (${category.productsCount}) صنف مسجل. هل أنت متأكد من رغبتك في حذفها؟`,
        confirmButtonText: "نعم، حذف على أي حال",
        cancelButtonText: "إلغاء",
        icon: "warning",
      });

      if (!confirmed) return;
    } else {
      const confirmed = await showConfirm({
        title: "حذف الفئة",
        text: `هل تريد بالتأكيد حذف فئة "${category.name}" نهائياً من قاعدة البيانات؟`,
        confirmButtonText: "نعم، حذف",
        cancelButtonText: "إلغاء",
      });

      if (!confirmed) return;
    }

    try {
      await deleteCategory(category.id);
      showSuccess("تم حذف الفئة", `تمت إزالة فئة "${category.name}" بنجاح من قاعدة البيانات`);
      await refetch();
    } catch (error) {
      console.error("خطأ أثناء الحذف:", error);
      showError("تعذر حذف الفئة", error.message || "حدث خطأ أثناء محاولة الحذف من الخادم");
    }
  };

  const handleReorderCategories = async (newCategories) => {
    const previous = [...categories];
    setCategories(newCategories);
    try {
      await reorderCategories(newCategories.map((c) => c.id));
      showSuccess("تم حفظ الترتيب", "تم تحديث وحفظ ترتيب عرض الفئات بنجاح");
    } catch (err) {
      console.error("فشل في إعادة ترتيب الفئات:", err);
      setCategories(previous);
      showError("تعذر حفظ الترتيب", err.message || "حدث خطأ أثناء حفظ الترتيب الجديد في السيرفر");
    }
  };

  const filteredCategories = categories.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      (item.description && item.description.toLowerCase().includes(term))
    );
  });

  const getFields = (cat) => {
    if (!cat) return [];
    return [
      { label: "اسم الفئة والتصنيف", value: cat.name, icon: Tags, fullWidth: true },
      { label: "عدد الأصناف التابعة", value: `${cat.productsCount || 0} صنف مسجل`, icon: Box },
      {
        label: "لون التمييز",
        icon: Palette,
        render: () => {
          const color = cat.colorHex || cat.color || "#2563EB";
          return (
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-2xs"
                style={{ backgroundColor: color }}
              />
              <span className="font-mono text-xs font-bold text-slate-800" dir="ltr">
                {color}
              </span>
            </div>
          );
        },
      },
      { label: "الوصف والبيان الفني", value: cat.description || "لا يوجد وصف إضافي مسجل لهذه الفئة", icon: FileText, fullWidth: true },
      { label: "أضيفت بواسطة", value: cat.createdByName || "Ayman Salama", icon: UserCheck },
      { label: "تاريخ الإنشاء والاعتماد", value: cat.createdAt ? formatCairoDateTime(cat.createdAt) : "—", icon: Calendar },
      ...(cat.updatedByName
        ? [
            { label: "آخر تعديل بواسطة", value: cat.updatedByName, icon: UserCheck },
            { label: "تاريخ آخر تعديل", value: cat.updatedAt ? formatCairoDateTime(cat.updatedAt) : "—", icon: Calendar },
          ]
        : []),
    ];
  };

  return (
    <div className="space-y-6">
      <CategoryHeader
        totalCount={categories.length}
        onAddCategory={handleOpenAdd}
      />

      {apiError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-800">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="text-sm font-bold">تعذر تحميل بيانات الفئات</p>
              <p className="text-xs text-rose-600 mt-0.5">{apiError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={refetch}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            إعادة المحاولة
          </button>
        </div>
      )}

      <CategoryFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <CategoryTable
        categories={filteredCategories}
        loading={loading}
        onView={handleViewCategory}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteCategory}
        onShowProducts={(cat) => setSelectedCategoryForProducts(cat)}
        onReorder={handleReorderCategories}
        canReorder={!searchTerm.trim()}
      />

      {isModalOpen && (
        <CategoryFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveCategory}
          initialData={editingCategory}
          key={editingCategory?.id || "new-category"}
        />
      )}

      {selectedCategoryForProducts && (
        <CategoryProductsModal
          isOpen={Boolean(selectedCategoryForProducts)}
          onClose={() => setSelectedCategoryForProducts(null)}
          category={selectedCategoryForProducts}
        />
      )}

      <DetailsModal
        isOpen={Boolean(viewingCategory)}
        onClose={() => {
          setViewingCategory(null);
          setDetailsLoading(false);
        }}
        title={`بطاقة تعريف: ${viewingCategory?.name || "فئة وتصنيف"}`}
        subtitle="مصنع السلام للكراسات والحلول الورقية"
        icon={Tags}
        badge={{ text: `${viewingCategory?.productsCount || 0} صنف مسجل`, className: "bg-emerald-50 text-emerald-700 border-emerald-200" }}
        fields={getFields(viewingCategory)}
        loading={detailsLoading}
        extraInfo="تُستخدم هذه الفئة لتبويب وتقسيم الكشاكيل والكراسات ومستلزمات الإنتاج داخل المستودع."
      />
    </div>
  );
}
