/**
 * Mock Data & State - مصنع السلام لإدارة المخازن
 * بيانات وهمية مبدئية لوحدات القياس (باكو / كرتونة)
 */

// 1. الفئات المبدئية
export const initialMockCategories = [
  {
    id: "cat-1",
    name: "ورق طباعة وتصوير",
    color: "blue",
    description: "أوراق تصوير وطباعة ديجيتال ومكتبي بالكرتونة",
  },
  {
    id: "cat-2",
    name: "كشاكيل مدرسية",
    color: "emerald",
    description: "كشاكيل مسطرة ومربعات دبوس وسلك لجميع المراحل الدراسية بالباكو",
  },
];

// 2. المنتجات المبدئية
export const initialMockProducts = [
  {
    id: "prod-1",
    name: "ورق تصوير A4 وزن 80 جم (كرتونة 5 رزم)",
    categoryId: "cat-1",
    categoryName: "ورق طباعة وتصوير",
    baseUnit: "كرتونة",
    unitContent: 5,
    location: "عنبر ورق التصوير - رصة D1",
  },
  {
    id: "prod-2",
    name: "كشكول 60 ورقة مسطر",
    categoryId: "cat-2",
    categoryName: "كشاكيل مدرسية",
    baseUnit: "باكو",
    unitContent: 10,
    location: "عنبر بضاعة تامة - رصة A2",
  },
];

// خيارات وحدات القياس الرئيسية (محصورة في باكو أو كرتونة)
export const BASE_UNITS = [
  { value: "باكو", label: "باكو (كشاكيل وكراريس)", prefix: "بالباكو", defaultContent: 10 },
  { value: "كرتونة", label: "كرتونة (لورق التصوير)", prefix: "بالكرتونة", defaultContent: 5 },
];

// خيارات ألوان الفئات
export const CATEGORY_COLORS = [
  { id: "blue", label: "أزرق", bg: "bg-blue-500", text: "text-blue-700", ring: "ring-blue-500", border: "border-blue-200" },
  { id: "emerald", label: "أخضر", bg: "bg-emerald-500", text: "text-emerald-700", ring: "ring-emerald-500", border: "border-emerald-200" },
  { id: "amber", label: "برتقالي", bg: "bg-amber-500", text: "text-amber-700", ring: "ring-amber-500", border: "border-amber-200" },
  { id: "violet", label: "بنفسجي", bg: "bg-violet-500", text: "text-violet-700", ring: "ring-violet-500", border: "border-violet-200" },
  { id: "rose", label: "وردي", bg: "bg-rose-500", text: "text-rose-700", ring: "ring-rose-500", border: "border-rose-200" },
  { id: "slate", label: "رمادي", bg: "bg-slate-500", text: "text-slate-700", ring: "ring-slate-500", border: "border-slate-200" },
];

// خيارات أنواع الحركات المخزنية
export const TRANSACTION_TYPES = [
  { value: "inflow", label: "وارد (استلام إنتاج تام / توريد)", partyPlaceholder: "صالة الإنتاج والتجليد أو المورد" },
  { value: "outflow", label: "منصرف (صرف طلبيات / شحن عملاء)", partyPlaceholder: "العميل أو منفذ التوزيع أو أمر التوريد" },
];
