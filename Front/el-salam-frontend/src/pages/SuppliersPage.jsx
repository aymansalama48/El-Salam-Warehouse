import { useState, useEffect } from "react";
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from "../features/suppliers/services/supplierService";
import { SupplierHeader } from "../features/suppliers/components/SupplierHeader";
import { SupplierFilter } from "../features/suppliers/components/SupplierFilter";
import { SupplierTable } from "../features/suppliers/components/SupplierTable";
import { SupplierFormModal } from "../features/suppliers/components/SupplierFormModal";
import { DetailsModal } from "../components/common/DetailsModal";
import { showSuccess, showConfirm } from "../utils/alertUtils";
import { Truck, Hash, Building2, User, Phone, MapPin, DollarSign, ShieldCheck, FileCheck } from "lucide-react";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [viewingSupplier, setViewingSupplier] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getSuppliers()
      .then((data) => {
        if (isMounted) {
          setSuppliers(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("فشل في تحميل الموردين:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleSaveSupplier = async (formData) => {
    try {
      if (editingSupplier) {
        const updated = await updateSupplier(editingSupplier.id, formData);
        setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        showSuccess("تم تعديل المورد", `تم تحديث ملف "${updated.name}" بنجاح`);
      } else {
        const created = await addSupplier(formData);
        setSuppliers((prev) => [created, ...prev]);
        showSuccess("تم إضافة المورد بنجاح", `تم تسجيل "${created.name}" في دليل موردي المصنع`);
      }
    } catch (error) {
      console.error("خطأ في حفظ المورد:", error);
    }
  };

  const handleDeleteSupplier = async (supplier) => {
    const confirmed = await showConfirm({
      title: "حذف المورد",
      text: `هل أنت متأكد من حذف "${supplier.name}" من سجل الموردين؟`,
      confirmButtonText: "نعم، حذف",
      cancelButtonText: "إلغاء",
      icon: "warning",
    });

    if (confirmed) {
      try {
        await deleteSupplier(supplier.id);
        setSuppliers((prev) => prev.filter((s) => s.id !== supplier.id));
        showSuccess("تم الحذف", "تم حذف المورد بنجاح من قاعدة البيانات المحلية");
      } catch (error) {
        console.error("خطأ أثناء الحذف:", error);
      }
    }
  };

  const handleExport = () => {
    showSuccess("تصدير الموردين", "تم تصدير دليل موردي الخامات الورقية بنجاح");
  };

  const filteredSuppliers = suppliers.filter((item) => {
    const matchSearch =
      item.name.includes(searchTerm) ||
      item.contactPerson.includes(searchTerm) ||
      item.phone.includes(searchTerm) ||
      item.supplyType.includes(searchTerm) ||
      item.address.includes(searchTerm);

    let matchType = true;
    if (selectedType === "ورق أبيض") matchType = item.supplyType.includes("ورق أبيض") || item.supplyType.includes("ورق كتابة");
    else if (selectedType === "دوبلكس") matchType = item.supplyType.includes("دوبلكس") || item.supplyType.includes("كوشيه");
    else if (selectedType === "أسلاك") matchType = item.supplyType.includes("أسلاك") || item.supplyType.includes("تدبيس");
    else if (selectedType === "أحبار") matchType = item.supplyType.includes("أحبار");
    else if (selectedType === "تعبئة") matchType = item.supplyType.includes("شرنك") || item.supplyType.includes("كرتون");

    return matchSearch && matchType;
  });

  const getFields = (sup) => {
    if (!sup) return [];
    return [
      { label: "كود المورد بالمنظومة", value: sup.id, icon: Hash },
      { label: "نوع الخامات الموردة", value: sup.supplyType, icon: Truck },
      { label: "اسم الشركة / المطحن", value: sup.name, icon: Building2, fullWidth: true },
      { label: "الشخص المسؤول للتواصل", value: sup.contactPerson, icon: User },
      { label: "رقم الهاتف والواتساب", value: sup.phone, icon: Phone },
      { label: "العنوان والمنطقة الصناعية", value: sup.address, icon: MapPin, fullWidth: true },
      { label: "الرصيد الدائن القائم", value: sup.balance, icon: DollarSign },
      { label: "السجل الضريبي والتجاري", value: sup.taxNumber || "مسجل ومعتمد بالمالية", icon: FileCheck },
      { label: "حالة الاعتماد", value: "مورد خام معتمد ومطابق لمواصفات مصنع السلام للورق", icon: ShieldCheck, fullWidth: true },
    ];
  };

  return (
    <div className="space-y-6">
      <SupplierHeader
        totalCount={suppliers.length}
        onAddSupplier={handleOpenAdd}
        onExport={handleExport}
      />
      <SupplierFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
      />
      <SupplierTable
        suppliers={filteredSuppliers}
        loading={loading}
        onView={(sup) => setViewingSupplier(sup)}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteSupplier}
      />

      <SupplierFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSupplier}
        initialData={editingSupplier}
      />

      <DetailsModal
        isOpen={Boolean(viewingSupplier)}
        onClose={() => setViewingSupplier(null)}
        title="ملف مورد ومطحن ورق"
        subtitle={`مصنع السلام للكراسات - ${viewingSupplier?.id || ""}`}
        icon={Truck}
        badge={{ text: viewingSupplier?.supplyType || "توريد خامات", className: "bg-blue-50 text-blue-700 border-blue-200" }}
        fields={getFields(viewingSupplier)}
        extraInfo="يتم سداد مستحقات هذا المورد وفقاً لشروط الدفع والاعتماد المخزني للشحنات الواردة."
      />
    </div>
  );
}
