import { useState, useEffect } from "react";
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from "../features/customers/services/customerService";
import { CustomerHeader } from "../features/customers/components/CustomerHeader";
import { CustomerFilter } from "../features/customers/components/CustomerFilter";
import { CustomerTable } from "../features/customers/components/CustomerTable";
import { CustomerFormModal } from "../features/customers/components/CustomerFormModal";
import { DetailsModal } from "../components/common/DetailsModal";
import { showSuccess, showConfirm } from "../utils/alertUtils";
import { Users, Hash, Store, User, Phone, MapPin, PackageCheck, ShieldCheck } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getCustomers()
      .then((data) => {
        if (isMounted) {
          setCustomers(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("فشل في تحميل العملاء:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (formData) => {
    try {
      if (editingCustomer) {
        const updated = await updateCustomer(editingCustomer.id, formData);
        setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        showSuccess("تم تعديل جهة الصرف", `تم تحديث بيانات "${updated.name}" بنجاح`);
      } else {
        const created = await addCustomer(formData);
        setCustomers((prev) => [created, ...prev]);
        showSuccess("تم إضافة جهة الصرف بنجاح", `تم تسجيل "${created.name}" في دليل العملاء`);
      }
    } catch (error) {
      console.error("خطأ في حفظ العميل:", error);
    }
  };

  const handleDeleteCustomer = async (cust) => {
    const confirmed = await showConfirm({
      title: "حذف جهة الصرف",
      text: `هل أنت متأكد من حذف "${cust.name}"؟`,
      confirmButtonText: "نعم، حذف",
      cancelButtonText: "إلغاء",
      icon: "warning",
    });

    if (confirmed) {
      try {
        await deleteCustomer(cust.id);
        setCustomers((prev) => prev.filter((c) => c.id !== cust.id));
        showSuccess("تم الحذف", "تمت إزالة جهة الصرف من القائمة بنجاح");
      } catch (error) {
        console.error("خطأ أثناء الحذف:", error);
      }
    }
  };

  const handleExport = () => {
    showSuccess("تصدير جهات الصرف", "تم تصدير دليل العملاء بنجاح");
  };

  const filtered = customers.filter((item) => {
    const matchSearch =
      item.name.includes(searchTerm) ||
      item.contactPerson.includes(searchTerm) ||
      item.phone.includes(searchTerm) ||
      item.city.includes(searchTerm);
    const matchCat = selectedCategory === "all" || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const getFields = (cust) => {
    if (!cust) return [];
    return [
      { label: "كود العميل / المؤسسة", value: cust.id, icon: Hash },
      { label: "التصنيف التجاري", value: cust.category, icon: Store },
      { label: "اسم العميل / المكتبة", value: cust.name, icon: Users, fullWidth: true },
      { label: "المسؤول عن الاستلام والمشتريات", value: cust.contactPerson, icon: User },
      { label: "رقم الهاتف والاتصال", value: cust.phone, icon: Phone },
      { label: "المدينة والمحافظة", value: cust.city, icon: MapPin },
      { label: "إجمالي أذونات الصرف المنفذة", value: `${cust.totalOrders || 0} طلبية`, icon: PackageCheck },
      { label: "حالة الاعتماد الائتماني", value: "عميل تجاري معتمد - مسموح بصرف طلبيات الجملة", icon: ShieldCheck, fullWidth: true },
    ];
  };

  return (
    <div className="space-y-6">
      <CustomerHeader
        count={customers.length}
        onOpenAddModal={handleOpenAdd}
        onExport={handleExport}
      />
      <CustomerFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />
      <CustomerTable
        customers={filtered}
        loading={loading}
        onView={(cust) => setViewingCustomer(cust)}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteCustomer}
      />

      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCustomer}
        initialData={editingCustomer}
      />

      <DetailsModal
        isOpen={Boolean(viewingCustomer)}
        onClose={() => setViewingCustomer(null)}
        title="ملف عميل وجهة صرف تجارية"
        subtitle={`مصنع السلام للكراسات - ${viewingCustomer?.id || ""}`}
        icon={Users}
        badge={{ text: viewingCustomer?.category || "جهة صرف", className: "bg-blue-50 text-blue-700 border-blue-200" }}
        fields={getFields(viewingCustomer)}
        extraInfo="يتم تسليم طلبيات هذا العميل بناءً على أذونات صرف معتمدة من إدارة المستودعات والمبيعات."
      />
    </div>
  );
}
