/**
 * خدمة بيانات موردي رولات الورق وخامات الإنتاج - مصنع السلام
 */

let initialSuppliers = [
  {
    id: "SUP-01",
    name: "شركة قنا لصناعة الورق",
    contactPerson: "م. أشرف عبدالرازق",
    phone: "01012345678",
    email: "sales@qenapaper.com",
    address: "مدينة قفط الصناعية - قنا",
    supplyType: "رولات ورق أبيض",
    balance: "450,000 ج.م",
    ordersCount: 34,
    status: "active",
    taxNumber: "100-245-891",
  },
  {
    id: "SUP-02",
    name: "شركة إدفو للب الورق والورق",
    contactPerson: "أ. طارق عبدالفتاح",
    phone: "01123456789",
    email: "info@edfumills.com",
    address: "مركز إدفو - أسوان",
    supplyType: "ورق كتابة فاخر 70جم",
    balance: "280,000 ج.م",
    ordersCount: 22,
    status: "active",
    taxNumber: "100-332-902",
  },
  {
    id: "SUP-03",
    name: "مطاحن الشرق للورق والكرتون",
    contactPerson: "الحاج رفعت الشرقاوي",
    phone: "01234567890",
    email: "contact@elsharkpaper.com",
    address: "المنطقة الصناعية الأولى - العاشر من رمضان",
    supplyType: "ورق دوبلكس وكوشيه أغلفة",
    balance: "125,000 ج.م",
    ordersCount: 18,
    status: "active",
    taxNumber: "104-512-441",
  },
  {
    id: "SUP-04",
    name: "مؤسسة الحديد والأسلاك الصناعية",
    contactPerson: "م. عصام السعدني",
    phone: "01098765432",
    email: "orders@wiresteel-eg.com",
    address: "منطقة مسطرد الصناعية - القليوبية",
    supplyType: "أسلاك تدبيس وتجليد Wire-O",
    balance: "42,000 ج.م",
    ordersCount: 29,
    status: "active",
    taxNumber: "108-721-399",
  },
  {
    id: "SUP-05",
    name: "الشركة الدولية لأحبار الطباعة",
    contactPerson: "د. إيهاب مسعود",
    phone: "01511223344",
    email: "sales@intl-inks.net",
    address: "مدينة العبور الصناعية - بلوك 24",
    supplyType: "أحبار تسطير مائية وطباعة أوفست",
    balance: "18,500 ج.م",
    ordersCount: 15,
    status: "active",
    taxNumber: "112-881-209",
  },
  {
    id: "SUP-06",
    name: "مصنع الأهرام للبلاستيك والشرنك",
    contactPerson: "أ. مدحت الفقي",
    phone: "01223344556",
    email: "info@ahram-shrink.com",
    address: "المنطقة الصناعية - السادات",
    supplyType: "رولات شرنك حراري وبولي إيثيلين",
    balance: "35,000 ج.م",
    ordersCount: 26,
    status: "active",
    taxNumber: "120-664-817",
  },
  {
    id: "SUP-07",
    name: "المتحدة للكرتون المضلع ومواد التعبئة",
    contactPerson: "م. كمال الشناوي",
    phone: "01055667788",
    email: "info@unitedcarton-eg.com",
    address: "المنطقة الصناعية الرابعة - 6 أكتوبر",
    supplyType: "كراتين شحن وتعبئة 5 طبقات",
    balance: "68,000 ج.م",
    ordersCount: 19,
    status: "active",
    taxNumber: "135-492-110",
  },
];

export const getSuppliers = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...initialSuppliers]);
    }, 100);
  });
};

export const addSupplier = async (supplierData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const created = {
        ...supplierData,
        id: `SUP-0${initialSuppliers.length + 1}`,
        ordersCount: 0,
        balance: "0 ج.م",
        status: "active",
      };
      initialSuppliers = [created, ...initialSuppliers];
      resolve(created);
    }, 120);
  });
};

export const updateSupplier = async (id, updatedData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      initialSuppliers = initialSuppliers.map((s) =>
        s.id === id ? { ...s, ...updatedData } : s
      );
      const found = initialSuppliers.find((s) => s.id === id);
      resolve(found);
    }, 120);
  });
};

export const deleteSupplier = async (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      initialSuppliers = initialSuppliers.filter((s) => s.id !== id);
      resolve(true);
    }, 100);
  });
};
