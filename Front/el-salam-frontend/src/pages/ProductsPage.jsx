import { useState, useEffect, useCallback, useMemo } from "react";
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
import { handlePdfDownloadAndPreview, createPendingPdfWindow } from "../utils/reportUtils";
import { Package, Layers, MapPin, FileText, Box, BookOpen, ShieldCheck, AlertCircle, RefreshCw, UserCheck, Calendar, Plus } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showFloatingAdd, setShowFloatingAdd] = useState(false);
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

  // الاستماع للتمرير لإظهار الزر العائم لإضافة منتج عند اختفاء زر الهيدر
  useEffect(() => {
    const mainEl = document.querySelector("main");
    const handleScroll = () => {
      const scrollY = mainEl ? mainEl.scrollTop : window.scrollY;
      setShowFloatingAdd(scrollY > 160);
    };

    if (mainEl) {
      mainEl.addEventListener("scroll", handleScroll, { passive: true });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (mainEl) mainEl.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // جلب المنتجات والملخص من الخادم بناءً على الفلاتر والصفحات
  const refetchProducts = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setApiError(null);
    try {
      const [res, sum] = await Promise.all([
        getProducts({
          search: searchTerm,
          categoryId: selectedCategory !== "all" ? selectedCategory : undefined,
          page,
          pageSize,
        }),
        getProductsSummary().catch((err) => {
          console.error("فشل في تحديث ملخص المنتجات:", err);
          return null;
        }),
      ]);
      setProducts(res.items);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
      if (sum) setSummary(sum);
    } catch (err) {
      console.error("فشل في تحميل المنتجات من الخادم:", err);
      setApiError(err.message || "تعذر الاتصال بخادم الـ Backend");
      if (!isSilent) {
        setProducts([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [searchTerm, selectedCategory, page, pageSize]);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getProducts({
        search: searchTerm,
        categoryId: selectedCategory !== "all" ? selectedCategory : undefined,
        page,
        pageSize,
      }),
      getProductsSummary().catch((err) => {
        console.error("فشل في تحميل ملخص المنتجات:", err);
        return null;
      }),
    ])
      .then(([res, sum]) => {
        if (!ignore) {
          setProducts(res.items);
          setTotalCount(res.totalCount);
          setTotalPages(res.totalPages);
          if (sum) setSummary(sum);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("فشل في تحميل المنتجات من الخادم:", err);
          setApiError(err.message || "تعذر الاتصال بخادم الـ Backend");
          setProducts([]);
          setTotalCount(0);
          setTotalPages(1);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [searchTerm, selectedCategory, page, pageSize]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (formData) => {
    const mainEl = document.querySelector("main");
    const savedScrollTop = mainEl ? mainEl.scrollTop : window.scrollY;
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        showSuccess("تم تعديل مواصفات المنتج", `تم تحديث بيانات "${formData.name}" بنجاح`);
      } else {
        await addProduct(formData);
        showSuccess("تم إضافة المنتج بنجاح", `تم تسجيل مواصفات "${formData.name}" في دليل الأصناف`);
      }
      setIsModalOpen(false);
      await refetchProducts(true);
      setTimeout(() => {
        if (mainEl) mainEl.scrollTop = savedScrollTop;
        window.scrollTo({ top: savedScrollTop, behavior: "instant" });
      }, 50);
    } catch (error) {
      console.error("خطأ في حفظ المنتج:", error);
      showError("تعذر حفظ المنتج", error.message || "حدث خطأ غير متوقع أثناء الحفظ في الخادم.");
    }
  };

  const handleDeleteProduct = async (product) => {
    const mainEl = document.querySelector("main");
    const savedScrollTop = mainEl ? mainEl.scrollTop : window.scrollY;
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
        await refetchProducts(true);
        setTimeout(() => {
          if (mainEl) mainEl.scrollTop = savedScrollTop;
          window.scrollTo({ top: savedScrollTop, behavior: "instant" });
        }, 50);
      } catch (error) {
        console.error("خطأ أثناء الحذف:", error);
        showError("تعذر حذف الصنف", error.message || "حدث خطأ أثناء محاولة حذف المنتج من الخادم.");
      }
    }
  };

  const handleReorderProducts = async (reorderedItems) => {
    if (pageSize === "all") {
      const previous = [...products];
      setProducts(reorderedItems);
      try {
        await reorderProducts(reorderedItems.map((p) => p.id));
        showSuccess("تم حفظ الترتيب", "تم تحديث وحفظ ترتيب عرض الأصناف بنجاح");
      } catch (err) {
        console.error("فشل في إعادة ترتيب المنتجات:", err);
        setProducts(previous);
        showError("تعذر حفظ الترتيب", err.message || "حدث خطأ أثناء حفظ الترتيب الجديد في السيرفر");
      }
    } else {
      const start = (page - 1) * pageSize;
      const updatedMaster = [...products];
      updatedMaster.splice(start, reorderedItems.length, ...reorderedItems);
      const previous = [...products];
      setProducts(updatedMaster);
      try {
        await reorderProducts(updatedMaster.map((p) => p.id));
        showSuccess("تم حفظ الترتيب", "تم تحديث وحفظ ترتيب عرض الأصناف بنجاح");
      } catch (err) {
        console.error("فشل في إعادة ترتيب المنتجات:", err);
        setProducts(previous);
        showError("تعذر حفظ الترتيب", err.message || "حدث خطأ أثناء حفظ الترتيب الجديد في السيرفر");
      }
    }
  };

  // إعادة الصفحة إلى الأولى عند تغيير معايير البحث أو الفئة
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategory]);

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

    const isPaper = prod.unitType === 3 || baseUnit === "كرتونة";

    return [
      { label: "اسم المنتج أو الصنف", value: prod.name, icon: Package, fullWidth: true },
      { label: "فئة وتصنيف المنتج", value: prod.categoryName || "عام", icon: FileText },
      ...(isPaper
        ? [
            {
              label: "محتوى الكرتونة",
              value: `${content.toLocaleString()} رزمة لكل كرتونة`,
              icon: Box,
            },
            {
              label: "الرصيد الفعلي بالكرتونة",
              value: formattedStock,
              icon: Layers,
            },
          ]
        : []),
      {
        label: isPaper ? "إجمالي الرصيد بالرزمة" : "الرصيد الإجمالي",
        value: `${Number(prod.totalSubUnitStock ?? 0).toLocaleString()} ${subUnit}`,
        icon: isPaper ? BookOpen : Layers,
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
        products={products}
        loading={loading}
        onView={handleViewProduct}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteProduct}
        onReorder={handleReorderProducts}
        canReorder={!searchTerm.trim() && selectedCategory === "all" && (pageSize === "all" || totalCount <= products.length)}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
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
          const printWindow = createPendingPdfWindow(`جاري تجهيز بطاقة صنف ${viewingProduct.name || ""}...`);
          try {
            const blob = await getProductPdf(viewingProduct.id);
            const safeName = viewingProduct.name ? `بطاقة_صنف_${viewingProduct.name}.pdf` : `بطاقة_صنف_${viewingProduct.id}.pdf`;
            handlePdfDownloadAndPreview(blob, safeName, printWindow);
          } catch (err) {
            if (printWindow && !printWindow.closed) {
              printWindow.close();
            }
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

      {/* Floating Add Product Button when scrolled down */}
      {showFloatingAdd && (
        <button
          type="button"
          onClick={handleOpenAdd}
          className="fixed bottom-6 left-6 z-40 inline-flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-2xl hover:shadow-blue-500/30 border border-white/20 backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-blue-500/20 animate-in fade-in slide-in-from-bottom-5 duration-200"
          title="إضافة منتج جديد"
        >
          <div className="w-6 h-6 rounded-lg bg-white/20 text-white flex items-center justify-center">
            <Plus className="w-4 h-4 stroke-[3]" />
          </div>
          <span>إضافة منتج جديد</span>
        </button>
      )}
    </div>
  );
}
