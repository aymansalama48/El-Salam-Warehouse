/**
 * خدمة بيانات المواد الخام ومستلزمات الإنتاج الورقي لمصنع السلام
 */

let initialMaterials = [
  {
    id: "RAW-101",
    name: "رول ورق أبيض 60 جم/م2 (عرض 70 سم)",
    type: "رولات ورق",
    code: "ROL-WHT-60",
    quantity: 48.5,
    unit: "طن",
    supplier: "شركة قنا لصناعة الورق",
    minimumAlert: 10,
    status: "sufficient",
  },
  {
    id: "RAW-102",
    name: "رول ورق أبيض فاخر 70 جم/م2 (عرض 80 سم)",
    type: "رولات ورق",
    code: "ROL-WHT-70",
    quantity: 26.2,
    unit: "طن",
    supplier: "شركة إدفو لصناعة لب الورق",
    minimumAlert: 8,
    status: "sufficient",
  },
  {
    id: "RAW-103",
    name: "ورق دوبلكس ظهر رمادي 250 جم للأغلفة",
    type: "ورق أغلفة",
    code: "DUP-GRY-250",
    quantity: 320,
    unit: "ريم (ألف فرخ)",
    supplier: "مطاحن الشرق للورق والكرتون",
    minimumAlert: 50,
    status: "sufficient",
  },
  {
    id: "RAW-104",
    name: "بكرات سلك تدبيس كشاكيل حديد مجلفن رقم 24",
    type: "أسلاك ودبابيس",
    code: "WIR-STP-24",
    quantity: 14,
    unit: "بكرة ضخمة",
    supplier: "مؤسسة الحديد والأسلاك الصناعية",
    minimumAlert: 20,
    status: "critical",
  },
  {
    id: "RAW-105",
    name: "حبر تسطير أوفست أزرق مائي عالي النقاء",
    type: "أحبار طباعة",
    code: "INK-BLU-LIN",
    quantity: 8,
    unit: "برميل 50 لتر",
    supplier: "الشركة الدولية لأحبار الطباعة",
    minimumAlert: 12,
    status: "low",
  },
  {
    id: "RAW-106",
    name: "بكرات رول شرنك حراري بولي إيثيلين للتغليف",
    type: "مواد تعبئة",
    code: "SHR-ROL-40",
    quantity: 160,
    unit: "رول",
    supplier: "مصنع الأهرام للبلاستيك والشرنك",
    minimumAlert: 40,
    status: "sufficient",
  },
];

export const getRawMaterials = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...initialMaterials]);
    }, 100);
  });
};

export const addRawMaterial = async (materialData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const qtyNum = Number(materialData.quantity) || 0;
      const minAlert = Number(materialData.minimumAlert) || 0;
      let status = "sufficient";
      if (qtyNum <= minAlert * 0.5) status = "critical";
      else if (qtyNum <= minAlert) status = "low";

      const created = {
        ...materialData,
        id: `RAW-${Date.now().toString().slice(-4)}`,
        quantity: qtyNum,
        minimumAlert: minAlert,
        status,
      };
      initialMaterials = [created, ...initialMaterials];
      resolve(created);
    }, 120);
  });
};

export const updateRawMaterial = async (id, updatedData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const qtyNum = Number(updatedData.quantity) || 0;
      const minAlert = Number(updatedData.minimumAlert) || 0;
      let status = "sufficient";
      if (qtyNum <= minAlert * 0.5) status = "critical";
      else if (qtyNum <= minAlert) status = "low";

      initialMaterials = initialMaterials.map((m) =>
        m.id === id ? { ...m, ...updatedData, quantity: qtyNum, minimumAlert: minAlert, status } : m
      );
      const found = initialMaterials.find((m) => m.id === id);
      resolve(found);
    }, 120);
  });
};

export const deleteRawMaterial = async (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      initialMaterials = initialMaterials.filter((m) => m.id !== id);
      resolve(true);
    }, 100);
  });
};
