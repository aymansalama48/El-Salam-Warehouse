/**
 * خدمة حركة المستودع ودفتر اليومية - مصنع السلام للكراسات والحلول الورقية
 * خاصة بحركات المنتجات والكشاكيل التامة الصنع
 */

let initialTransactions = [
  {
    id: "TX-2024-801",
    date: "2026-10-31 11:30",
    type: "inflow",
    itemName: "كشكول مدرسي مسطر عربي دبوس (60 ورقة)",
    quantity: "+650 باكو",
    packsCount: 650,
    totalUnits: "6,500 كشكول",
    party: "صالة الإنتاج والتجليد #1",
    referenceDoc: "إشعار إيداع إنتاج #332",
    officer: "محمود الرفاعي",
    status: "completed",
  },
  {
    id: "TX-2024-802",
    date: "2026-10-31 10:45",
    type: "outflow",
    itemName: "كشكول سلك جامعي A4 عدد 5 فواصل (140 ورقة)",
    quantity: "-95 باكو",
    packsCount: 95,
    totalUnits: "475 كشكول",
    party: "طلبية مكتبات الفجالة #1094",
    referenceDoc: "فاتورة مبيعات #1094",
    officer: "عصام البنا",
    status: "completed",
  },
  {
    id: "TX-2024-803",
    date: "2026-10-31 09:20",
    type: "inflow",
    itemName: "كراسة مدرسية مسطر عربي غلاف كوشيه (28 ورقة)",
    quantity: "+1,200 باكو",
    packsCount: 1200,
    totalUnits: "14,400 كراسة",
    party: "صالة التدبيس والإنتاج #2",
    referenceDoc: "إشعار استلام وردية (أ)",
    officer: "سامح عبد الحميد",
    status: "completed",
  },
  {
    id: "TX-2024-804",
    date: "2026-10-30 16:15",
    type: "outflow",
    itemName: "كشكول مدرسي مسطر عربي دبوس (60 ورقة)",
    quantity: "-400 باكو",
    packsCount: 400,
    totalUnits: "4,000 كشكول",
    party: "شحنة موزعي الدلتا - طنطا",
    referenceDoc: "إذن خروج بضاعة #1095",
    officer: "عصام البنا",
    status: "completed",
  },
  {
    id: "TX-2024-805",
    date: "2026-10-30 14:00",
    type: "inflow",
    itemName: "كشكول سلك مدرسي B5 غلاف بلاستيك (80 ورقة)",
    quantity: "+300 باكو",
    packsCount: 300,
    totalUnits: "3,000 كشكول",
    party: "خط السلك والتغليف Wire-O",
    referenceDoc: "إذن إنتاج تام #518",
    officer: "محمود الرفاعي",
    status: "completed",
  },
  {
    id: "TX-2024-806",
    date: "2026-10-30 11:30",
    type: "outflow",
    itemName: "كشكول مدرسي إنجليزي دبوس فاخر (80 ورقة)",
    quantity: "-150 باكو",
    packsCount: 150,
    totalUnits: "1,500 كشكول",
    party: "طلبية معرض القاهرة للكتاب",
    referenceDoc: "إذن صرف طلبيات #1096",
    officer: "أحمد منصور",
    status: "completed",
  },
  {
    id: "TX-2024-807",
    date: "2026-10-30 09:15",
    type: "inflow",
    itemName: "ورق تصوير فاخر A4 وزن 80 جم (باكو 500 ورقة)",
    quantity: "+500 باكو",
    packsCount: 500,
    totalUnits: "250,000 ورقة",
    party: "صالة التقطيع والتغليف الأوتوماتيكي",
    referenceDoc: "إذن استلام رزم #441",
    officer: "م. إبراهيم السلامي",
    status: "completed",
  },
  {
    id: "TX-2024-808",
    date: "2026-10-29 15:00",
    type: "outflow",
    itemName: "ورق تصوير وطباعة مكاتب A4 وزن 70 جم",
    quantity: "-200 باكو",
    packsCount: 200,
    totalUnits: "100,000 ورقة",
    party: "توريدات مطابع ومعاهد العاشر",
    referenceDoc: "فاتورة توريد #1098",
    officer: "عصام البنا",
    status: "completed",
  },
];

export const getTransactions = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...initialTransactions]);
    }, 100);
  });
};

export const addTransaction = async (txData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const now = new Date();
      const dateStr = `${now.toISOString().split("T")[0]} ${now.toTimeString().slice(0, 5)}`;
      const packs = Number(txData.packsCount) || parseInt(txData.quantity) || 100;
      const prefix = txData.type === "inflow" ? "+" : "-";

      const created = {
        ...txData,
        id: `TX-2024-${Date.now().toString().slice(-3)}`,
        date: txData.date || dateStr,
        quantity: `${prefix}${packs.toLocaleString()} باكو`,
        packsCount: packs,
        status: "completed",
      };
      initialTransactions = [created, ...initialTransactions];
      resolve(created);
    }, 120);
  });
};

export const updateTransaction = async (id, updatedData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      initialTransactions = initialTransactions.map((t) =>
        t.id === id ? { ...t, ...updatedData } : t
      );
      const found = initialTransactions.find((t) => t.id === id);
      resolve(found);
    }, 100);
  });
};

export const deleteTransaction = async (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      initialTransactions = initialTransactions.filter((t) => t.id !== id);
      resolve({ success: true, id });
    }, 100);
  });
};
