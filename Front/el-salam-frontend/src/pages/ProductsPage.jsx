import { useState, useEffect, useCallback } from "react";
import {
  getProducts,
  getProductById,
  getProductPdf,
  getProductsSummary,
  addProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
  formatBaseUnitStock,
} from "../features/products/services/productService";
import { getCategoriesLookup } from "../features/categories/services/categoryService";
import { ProductHeader } from "../features/products/components/ProductHeader";
import { ProductsFilter } from "../features/products/components/ProductsFilter";
import { ProductsTable } from "../features/products/components/ProductsTable";
import { ProductFormModal } from "../features/products/components/ProductFormModal";
import { ProductsReportModal } from "../features/products/components/ProductsReportModal";
import { StockAlertSettingsModal } from "../features/products/components/StockAlertSettingsModal";
import { DetailsModal } from "../components/common/DetailsModal";
import { showSuccess, showError, showConfirm } from "../utils/alertUtils";
import { formatCairoDateTime } from "../utils/dateUtils";
import { handlePdfDownloadAndPreview } from "../utils/reportUtils";
import { Package, Layers, MapPin, FileText, Box, BookOpen, ShieldCheck, AlertCircle, RefreshCw, UserCheck, Calendar } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAlertSettingsOpen, setIsAlertSettingsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [printingProduct, setPrintingProduct] = useState(false);

  const handleViewProduct = async (product) => {
    setViewingProduct({ name: product.name, categoryName: product.categoryName });
    setDetailsLoading(true);
    try {
      const detailed = await getProductById(product.id);
      if (detailed) {
        setViewingProduct(detailed);
      }
    } catch (err) {
      console.error("فشل في جلب تفاصيل المنتج عبر getProductById:", err);
      showError("تعذر جلب تفاصيل المنتج", err.message || "حدث خطأ أثناء جلب تفاصيل المنتج من الخادم");
    } finally {
      setDetailsLoading(false);
    }
  };

  // تحميل الفئات من مسار الـ Lookup لربط المنتجات والفلترة
  useEffect(() => {
    let ignore = false;
    getCategoriesLookup()
      .then((data) => {
        if (!ignore && Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch((err) => {
        console.error("فشل في تحميل الفئات لصفحة المنتجات:", err);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // جلب المنتجات والملخص من الخادم بناءً على الفلاتر
  const refetchProducts = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [data, sum] = await Promise.all([
        getProducts({
          search: searchTerm,
          categoryId: selectedCategory !== "all" ? selectedCategory : undefined,
        }),
        getProductsSummary().catch((err) => {
          console.error("فشل في تحديث ملخص المنتجات:", err);
          return null;
        }),
      ]);
      setProducts(data);
      if (sum) setSummary(sum);
    } catch (err) {
      console.error("فشل في تحميل المنتجات من الخادم:", err);
      setApiError(err.message || "تعذر الاتصال بخادم الـ Backend");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getProducts({
        search: searchTerm,
        categoryId: selectedCategory !== "all" ? selectedCategory : undefined,
      }),
      getProductsSummary().catch((err) => {
        console.error("فشل في تحميل ملخص المنتجات:", err);
        return null;
      }),
    ])
      .then(([data, sum]) => {
        if (!ignore) {
          setProducts(data);
          if (sum) setSummary(sum);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("فشل في تحميل المنتجات من الخادم:", err);
          setApiError(err.message || "تعذر الاتصال بخادم الـ Backend");
          setProducts([]);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [searchTerm, selectedCategory]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (formData) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        showSuccess("تم تعديل مواصفات المنتج", `تم تحديث بيانات "${formData.name}" بنجاح`);
      } else {
        await addProduct(formData);
        showSuccess("تم إضافة المنتج بنجاح", `تم تسجيل مواصفات "${formData.name}" في دليل الأصناف`);
      }
      setIsModalOpen(false);
      await refetchProducts();
    } catch (error) {
      console.error("خطأ في حفظ المنتج:", error);
      showError("تعذر حفظ المنتج", error.message || "حدث خطأ غير متوقع أثناء الحفظ في الخادم.");
    }
  };

  const handleDeleteProduct = async (product) => {
    const confirmed = await showConfirm({
      title: "حذف الصنف",
      text: `هل أنت متأكد من حذف "${product.name}" نهائياً من قاعدة البيانات؟`,
      confirmButtonText: "نعم، حذف",
      cancelButtonText: "إلغاء",
      icon: "warning",
    });

    if (confirmed) {
      try {
        await deleteProduct(product.id);
        showSuccess("تم الحذف بنجاح", "تم إزالة الصنف من قاعدة البيانات");
        await refetchProducts();
      } catch (error) {
        console.error("خطأ أثناء الحذف:", error);
        showError("تعذر حذف الصنف", error.message || "حدث خطأ أثناء محاولة حذف المنتج من الخادم.");
      }
    }
  };

  const handleReorderProducts = async (newProducts) => {
    const previous = [...products];
    setProducts(newProducts);
    try {
      await reorderProducts(newProducts.map((p) => p.id));
      showSuccess("تم حفظ الترتيب", "تم تحديث وحفظ ترتيب عرض الأصناف بنجاح");
    } catch (err) {
      console.error("فشل في إعادة ترتيب المنتجات:", err);
      setProducts(previous);
      showError("تعذر حفظ الترتيب", err.message || "حدث خطأ أثناء حفظ الترتيب الجديد في السيرفر");
    }
  };

  // فلترة إضافية في الواجهة لضمان سرعة الاستجابة اللحظية
  const filteredProducts = products.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      item.name.toLowerCase().includes(term) ||
      (item.baseUnit && item.baseUnit.toLowerCase().includes(term)) ||
      (item.categoryName && item.categoryName.toLowerCase().includes(term)) ||
      (item.storageLocation && item.storageLocation.toLowerCase().includes(term));

    const matchCategory =
      selectedCategory === "all" ||
      item.categoryId === selectedCategory ||
      item.categoryName === selectedCategory;

    return matchSearch && matchCategory;
  });

  const getProductFields = (prod) => {
    if (!prod) return [];
    const baseUnit = prod.baseUnit || "باكو";
    const subUnit = prod.subUnit || "كشكول";
    const content = prod.unitsPerBaseUnit || 10;
    const full = Number(prod.fullBaseUnits ?? 0);
    const rem = Number(prod.remainingSubUnits ?? 0);

    const formattedStock = rem > 0
      ? `${full.toLocaleString()} ${baseUnit} و ${rem.toLocaleString()} ${subUnit}`
      : `${full.toLocaleString()} ${baseUnit}`;

    let thresholdDisplay = "غير محدد (0)";
    if (prod.lowStockThreshold > 0) {
      if (prod.unitType === 3) {
        thresholdDisplay = prod.lowStockThresholdUnit === 2
          ? `${prod.lowStockThreshold.toLocaleString()} كرتونة`
          : `${prod.lowStockThreshold.toLocaleString()} رزمة`;
      } else {
        thresholdDisplay = `${prod.lowStockThreshold.toLocaleString()} ${subUnit}`;
      }
    }

    return [
      { label: "اسم المنتج أو الصنف", value: prod.name, icon: Package, fullWidth: true },
      { label: "فئة وتصنيف المنتج", value: prod.categoryName || "عام", icon: FileText },
      {
        label: `محتوى التعبئة (${baseUnit})`,
        value: `${content.toLocaleString()} ${subUnit} لكل ${baseUnit}`,
        icon: Box,
      },
      {
        label: `الرصيد الفعلي بال${baseUnit}`,
        value: formattedStock,
        icon: Layers,
      },
      {
        label: `إجمالي الرصيد بال${subUnit}`,
        value: `${Number(prod.totalSubUnitStock ?? 0).toLocaleString()} ${subUnit}`,
        icon: BookOpen,
      },
      {
        label: "حد النفاذ (الرصيد الحرج)",
        value: thresholdDisplay,
        icon: AlertCircle,
      },
      { label: "مكان التخزين", value: prod.storageLocation || "المستودع الرئيسي", icon: MapPin },
      {
        label: "حالة المخزون",
        icon: ShieldCheck,
        render: () => {
          if (prod.status === 3) {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                نافذ / نفد من المستودع
              </span>
            );
          }
          if (prod.status === 2) {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                منخفض المخزون
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              متوفر بالمستودع
            </span>
          );
        },
      },
      { label: "أضيف بواسطة", value: prod.createdByName || "Ayman Salama", icon: UserCheck },
      { label: "تاريخ الإضافة والاعتماد", value: prod.createdAt ? formatCairoDateTime(prod.createdAt) : "—", icon: Calendar },
      ...(prod.updatedByName
        ? [
            { label: "آخر تعديل بواسطة", value: prod.updatedByName, icon: UserCheck },
            { label: "تاريخ آخر تعديل", value: prod.updatedAt ? formatCairoDateTime(prod.updatedAt) : "—", icon: Calendar },
          ]
        : []),
    ];
  };

  return (
    <div className="space-y-6">
      <ProductHeader
        summary={summary || {}}
        onAddProduct={handleOpenAdd}
        onOpenReport={() => setIsReportModalOpen(true)}
        onOpenAlertSettings={() => setIsAlertSettingsOpen(true)}
      />

      {apiError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-800">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="text-sm font-bold">تعذر تحميل بيانات المنتجات</p>
              <p className="text-xs text-rose-600 mt-0.5">{apiError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={refetchProducts}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            إعادة المحاولة
          </button>
        </div>
      )}

      <ProductsFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
      />

      <ProductsTable
        products={filteredProducts}
        loading={loading}
        onView={handleViewProduct}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteProduct}
        onReorder={handleReorderProducts}
        canReorder={!searchTerm.trim() && selectedCategory === "all"}
      />

      {isModalOpen && (
        <ProductFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProduct}
          initialData={editingProduct}
          categories={categories}
          key={editingProduct?.id || "new-product"}
        />
      )}

      <DetailsModal
        isOpen={Boolean(viewingProduct)}
        onClose={() => {
          setViewingProduct(null);
          setDetailsLoading(false);
        }}
        title={
          viewingProduct?.unitType === 3
            ? `بطاقة صنف: ${viewingProduct.name}`
            : viewingProduct?.unitType === 2
            ? `بطاقة كشكول: ${viewingProduct.name}`
            : `بطاقة تعريف: ${viewingProduct?.name || "صنف"}`
        }
        subtitle="مصنع السلام للكراسات والحلول الورقية"
        icon={Package}
        badge={
          viewingProduct?.categoryName
            ? { text: viewingProduct.categoryName, className: "bg-blue-50 text-blue-700 border-blue-200" }
            : undefined
        }
        fields={getProductFields(viewingProduct)}
        loading={detailsLoading}
        onPrint={async () => {
          if (!viewingProduct?.id || printingProduct) return;
          setPrintingProduct(true);
          try {
            const blob = await getProductPdf(viewingProduct.id);
            const safeName = viewingProduct.name ? `بطاقة_صنف_${viewingProduct.name}.pdf` : `بطاقة_صنف_${viewingProduct.id}.pdf`;
            handlePdfDownloadAndPreview(blob, safeName);
          } catch (err) {
            console.error("فشل في طباعة بطاقة الصنف:", err);
            showError("تعذر طباعة بطاقة الصنف", err.message || "حدث خطأ أثناء تحميل ملف الـ PDF من الخادم");
          } finally {
            setPrintingProduct(false);
          }
        }}
        printing={printingProduct}
        extraInfo="مواصفات التعبئة والتغليف معتمدة من صالة الإنتاج والتجليد (الباكو يحتوي على العدد المحدد من الفئة المسجلة)."
      />

      <ProductsReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        categories={categories}
        products={products}
      />

      <StockAlertSettingsModal
        isOpen={isAlertSettingsOpen}
        onClose={() => setIsAlertSettingsOpen(false)}
        onSaved={refetchProducts}
      />
    </div>
  );
}
