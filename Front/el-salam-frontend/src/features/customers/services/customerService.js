/**
 * خدمة بيانات جهات الصرف والعملاء التجاريين - مصنع السلام للكراسات والحلول الورقية
 */

let initialCustomers = [
  {
    id: "CUST-01",
    name: "مؤسسة الفاروق لتجارة الورق والأدوات المدرسية",
    contactPerson: "أ. علاء الفاروق",
    phone: "01034567891",
    email: "alfarouk-stationery@gmail.com",
    city: "الفجالة - القاهرة",
    category: "تاجر جملة معتمد",
    balance: "185,000 ج.م",
    totalOrders: 48,
    status: "active",
  },
  {
    id: "CUST-02",
    name: "موزع مكتبات الدلتا الكبرى",
    contactPerson: "الحاج صبحي النحاس",
    phone: "01145678902",
    email: "delta-distrib@gmail.com",
    city: "طنطا - الغربية",
    category: "موزع إقليمي",
    balance: "120,000 ج.م",
    totalOrders: 36,
    status: "active",
  },
  {
    id: "CUST-03",
    name: "سلسلة مكتبات الشروق الحديثة",
    contactPerson: "أ. ماجد فهمي",
    phone: "01256789013",
    email: "orders@shorouk-modern.com",
    city: "سموحة - الإسكندرية",
    category: "مكتبات تجزئة كبرى",
    balance: "64,000 ج.م",
    totalOrders: 28,
    status: "active",
  },
  {
    id: "CUST-04",
    name: "شركة النيل للتوزيع والتوريدات المدرسية",
    contactPerson: "م. حسام غنيم",
    phone: "01567890124",
    email: "sales@nile-supplies.com",
    city: "المنيا الجديدة - المنيا",
    category: "موزع إقليمي (الصعيد)",
    balance: "95,000 ج.م",
    totalOrders: 25,
    status: "active",
  },
  {
    id: "CUST-05",
    name: "فرع مصنع السلام - منفذ بيع المصنع الرئيسي",
    contactPerson: "أ. عصام البنا",
    phone: "01078901235",
    email: "outlet@elsalamfactory.com",
    city: "منفذ المصنع - القاهرة",
    category: "فرع توزيع داخلي",
    balance: "0 ج.م",
    totalOrders: 72,
    status: "active",
  },
];

export const getCustomers = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...initialCustomers]);
    }, 100);
  });
};

export const addCustomer = async (data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const created = {
        ...data,
        id: `CUST-0${initialCustomers.length + 1}`,
        totalOrders: 0,
        balance: "0 ج.م",
        status: "active",
      };
      initialCustomers = [created, ...initialCustomers];
      resolve(created);
    }, 120);
  });
};

export const updateCustomer = async (id, updatedData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      initialCustomers = initialCustomers.map((c) =>
        c.id === id ? { ...c, ...updatedData } : c
      );
      const found = initialCustomers.find((c) => c.id === id);
      resolve(found);
    }, 120);
  });
};

export const deleteCustomer = async (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      initialCustomers = initialCustomers.filter((c) => c.id !== id);
      resolve(true);
    }, 100);
  });
};
