import { useState, useEffect } from "react";
import { getRawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial } from "../features/raw-materials/services/rawMaterialsService";
import { RawMaterialHeader } from "../features/raw-materials/components/RawMaterialHeader";
import { RawMaterialsFilter } from "../features/raw-materials/components/RawMaterialsFilter";
import { RawMaterialsTable } from "../features/raw-materials/components/RawMaterialsTable";
import { RawMaterialFormModal } from "../features/raw-materials/components/RawMaterialFormModal";
import { DetailsModal } from "../components/common/DetailsModal";
import { showSuccess, showConfirm } from "../utils/alertUtils";
import { Layers, Hash, Tag, Building, Scale, AlertTriangle, ShieldCheck } from "lucide-react";

export default function RawMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [viewingMaterial, setViewingMaterial] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getRawMaterials()
      .then((data) => {
        if (isMounted) {
          setMaterials(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("فشل في تحميل المواد الخام:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingMaterial(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (material) => {
    setEditingMaterial(material);
    setIsModalOpen(true);
  };

  const handleSaveMaterial = async (formData) => {
    try {
      if (editingMaterial) {
        const updated = await updateRawMaterial(editingMaterial.id, formData);
        setMaterials((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        showSuccess("تم تعديل الخامة", `تم تحديث بيانات "${updated.name}" بنجاح`);
      } else {
        const created = await addRawMaterial(formData);
        setMaterials((prev) => [created, ...prev]);
        showSuccess("تم إضافة الخامة بنجاح", `تم تسجيل "${created.name}" في مخزن الخامات`);
      }
    } catch (error) {
      console.error("خطأ في حفظ الخامة:", error);
    }
  };

  const handleExport = () => {
    showSuccess("تصدير جرد المواد", "تم استخراج ملف جرد المواد الخام بنجاح");
  };

  const handleDeleteMaterial = async (item) => {
    const confirmed = await showConfirm({
      title: "حذف المادة الخام",
      text: `هل أنت متأكد من حذف "${item.name}" من المخزون؟`,
      confirmButtonText: "نعم، حذف",
      cancelButtonText: "إلغاء",
    });

    if (confirmed) {
      await deleteRawMaterial(item.id);
      setMaterials((prev) => prev.filter((m) => m.id !== item.id));
      showSuccess("تم الحذف", "تم حذف المادة الخام من القائمة");
    }
  };

  const filteredMaterials = materials.filter((item) => {
    const matchSearch =
      item.name.includes(searchTerm) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.includes(searchTerm);
    const matchType = selectedType === "all" || item.type === selectedType;
    return matchSearch && matchType;
  });

  const getFields = (mat) => {
    if (!mat) return [];
    return [
      { label: "كود المادة الخام", value: mat.code, icon: Hash },
      { label: "نوع الخامة والتصنيف", value: mat.type, icon: Tag },
      { label: "اسم الخامة والمواصفة الفنية", value: mat.name, icon: Layers, fullWidth: true },
      { label: "الرصيد الفعلي الحالي", value: `${mat.quantity?.toLocaleString() || 0} ${mat.unit}`, icon: Scale },
      { label: "المطحن / المورد المعتمد", value: mat.supplier, icon: Building },
      { label: "حد إعادة الطلب الحرج", value: `${mat.minThreshold || 10} ${mat.unit}`, icon: AlertTriangle },
      { label: "الموقع التخزيني بالمستودع", value: "عنبر تغذية ماكينات التسطير (A1)", icon: ShieldCheck },
    ];
  };

  return (
    <div className="space-y-6">
      <RawMaterialHeader
        count={materials.length}
        onAddMaterial={handleOpenAdd}
        onExport={handleExport}
      />
      <RawMaterialsFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
      />
      <RawMaterialsTable
        materials={filteredMaterials}
        loading={loading}
        onView={(mat) => setViewingMaterial(mat)}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteMaterial}
      />

      <RawMaterialFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMaterial}
        initialData={editingMaterial}
      />

      <DetailsModal
        isOpen={Boolean(viewingMaterial)}
        onClose={() => setViewingMaterial(null)}
        title="بطاقة مادة خام ومستلزم إنتاج"
        subtitle={`مصنع السلام للكراسات - ${viewingMaterial?.code || ""}`}
        icon={Layers}
        badge={
          viewingMaterial?.status === "sufficient"
            ? { text: "الرصيد كافٍ", className: "bg-emerald-50 text-emerald-700 border-emerald-200" }
            : viewingMaterial?.status === "low"
            ? { text: "طلب توريد", className: "bg-amber-50 text-amber-700 border-amber-200" }
            : { text: "رصيد حرج", className: "bg-rose-50 text-rose-700 border-rose-200" }
        }
        fields={getFields(viewingMaterial)}
        extraInfo="تُصرف هذه الخامة مباشرة إلى صالات الإنتاج وتسطير الورق بموجب أذونات تحويل داخلية معتمدة."
      />
    </div>
  );
}
