import { useState } from "react";
import { X, FileText, Edit, ArrowDownToLine, ArrowUpFromLine, Package, Layers, Building2, User } from "lucide-react";
import { validateTransaction } from "../schemas/transactionSchema";

export function TransactionFormModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  defaultType = "inflow" 
}) {
  const [type, setType] = useState(initialData?.type || defaultType);
  const [itemName, setItemName] = useState(initialData?.itemName || "كشكول مدرسي مسطر عربي دبوس (60 ورقة)");
  const [packsCount, setPacksCount] = useState(initialData?.packsCount?.toString() || "");
  const [party, setParty] = useState(initialData?.party || "");
  const [referenceDoc, setReferenceDoc] = useState(initialData?.referenceDoc || "");
  const [officer, setOfficer] = useState(initialData?.officer || "م. إبراهيم السلامي");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const isEdit = Boolean(initialData);

  if (!isOpen) return null;

  const productOptions = [
    { name: "كشكول مدرسي مسطر 60 ورقة دبوس", unit: "باكو", content: 10 },
    { name: "كشكول مدرسي إنجليزي 80 ورقة دبوس فاخر", unit: "باكو", content: 10 },
    { name: "كشكول سلك جامعي A4 عدد 5 فواصل 140 ورقة", unit: "باكو", content: 5 },
    { name: "كراسة مدرسية مسطر عربي 28 ورقة غلاف كوشيه", unit: "باكو", content: 12 },
    { name: "كراسة رسم وتلوين كانسون 20 ورقة مقاس كبير", unit: "باكو", content: 10 },
    { name: "كشكول سلك مدرسي B5 غلاف بلاستيك ملون 80 ورقة", unit: "باكو", content: 10 },
    { name: "كرتونة ورق تصوير فاخر A4 وزن 80 جم (5 رزم)", unit: "كرتونة", content: 5 },
    { name: "كرتونة ورق تصوير مكاتب A4 وزن 70 جم (5 رزم)", unit: "كرتونة", content: 5 },
    { name: "كرتونة ورق تصوير ومخططات A3 وزن 80 جم (5 رزم)", unit: "كرتونة", content: 5 },
  ];

  const activeProduct = productOptions.find((p) => p.name === itemName) || productOptions[0];

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      type,
      itemName: itemName.trim(),
      packsCount: packsCount === "" ? 0 : packsCount,
      party: party.trim(),
      referenceDoc: referenceDoc.trim() || undefined,
      officer: officer.trim() || undefined,
    };

    const validation = validateTransaction(payload);
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    const packsNum = Number(packsCount) || 100;
    const prefix = type === "inflow" ? "+" : "-";
    const unitName = activeProduct.unit;
    const content = activeProduct.content;
    const totalPieces = packsNum * content;

    await onSave({
      type,
      itemName: itemName.trim(),
      packsCount: packsNum,
      quantity: `${prefix}${packsNum.toLocaleString()} ${unitName}`,
      totalUnits: `${totalPieces.toLocaleString()} قطعة / ورقة`,
      party: party.trim() || (type === "inflow" ? "صالة الإنتاج والتجليد" : "صرف طلبيات جملة"),
      referenceDoc: referenceDoc.trim() || (type === "inflow" ? "إشعار استلام إنتاج" : "إذن خروج بضاعة"),
      officer: officer.trim() || "أمين المستودع",
    });
    setSubmitting(false);
    onClose();
  };

  const getTypeTitle = () => {
    if (isEdit) return "تعديل إذن الحركة المخزنية";
    if (type === "inflow") return "تسجيل إذن وارد (استلام إنتاج تام / ورق تصوير)";
    return "تسجيل إذن منصرف (صرف طلبيات كشاكيل / ورق تصوير)";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150 select-none" dir="rtl">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-xl max-h-[calc(100dvh-2rem)] sm:max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
              type === "inflow" ? "bg-emerald-100/80 text-emerald-700" : "bg-blue-100/80 text-blue-700"
            }`}>
              {isEdit ? <Edit className="w-5 h-5" /> : 
               type === "inflow" ? <ArrowDownToLine className="w-5 h-5" /> :
               <ArrowUpFromLine className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">{getTypeTitle()}</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {isEdit ? `إذن رقم: ${initialData.id}` : "توثيق حركة الأصناف بدفتر اليومية والمخزن"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-right flex-1 overflow-y-auto" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع الحركة</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer font-bold"
              >
                <option value="inflow">إذن وارد (استلام من صالة الإنتاج والتجليد)</option>
                <option value="outflow">إذن منصرف (صرف طلبيات وشحن مبيعات)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                مستند الإسناد / رقم الفاتورة أو الإذن
              </label>
              <input
                type="text"
                value={referenceDoc}
                onChange={(e) => setReferenceDoc(e.target.value)}
                placeholder={type === "inflow" ? "مثال: إشعار استلام إنتاج #332" : "مثال: فاتورة مبيعات #1094"}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              اسم الكشكول أو المنتج التام <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              <select
                value={itemName}
                onChange={(e) => {
                  setItemName(e.target.value);
                  if (errors.itemName) setErrors((prev) => ({ ...prev, itemName: null }));
                }}
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer font-semibold ${
                  errors.itemName ? "border-rose-400" : "border-slate-200"
                }`}
              >
                {productOptions.map((opt) => (
                  <option key={opt.name} value={opt.name}>
                    {opt.name} — (الوحدة: {opt.unit})
                  </option>
                ))}
              </select>
              {errors.itemName && <p className="text-3xs text-rose-600 font-bold mt-1">{errors.itemName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                الكمية (بال{activeProduct.unit}) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={packsCount}
                  onChange={(e) => {
                    setPacksCount(e.target.value);
                    if (errors.packsCount) setErrors((prev) => ({ ...prev, packsCount: null }));
                  }}
                  placeholder="مثال: 500"
                  className={`w-full px-3.5 py-2.5 pl-14 text-xs sm:text-sm font-bold bg-slate-50 border rounded-xl focus:outline-none focus:bg-white transition-colors ${
                    errors.packsCount ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-slate-800"
                  }`}
                />
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                  {activeProduct.unit}
                </span>
              </div>
              {errors.packsCount && <p className="text-3xs text-rose-600 font-bold mt-1">{errors.packsCount}</p>}
              {Number(packsCount) > 0 && (
                <div className="mt-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-2xs font-bold border border-emerald-100 flex items-center justify-between">
                  <span>إجمالي المحتوى الفعلي:</span>
                  <span>
                    {(Number(packsCount) * activeProduct.content).toLocaleString()} {activeProduct.unit === "كرتونة" ? "باكو / رزمة" : "كشكول / كراسة"}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {type === "inflow" ? "صالة الإنتاج والتجليد (المصدر)" : "الجهة المستلمة / الطلبية"} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={party}
                onChange={(e) => {
                  setParty(e.target.value);
                  if (errors.party) setErrors((prev) => ({ ...prev, party: null }));
                }}
                placeholder={type === "inflow" ? "مثال: صالة الإنتاج والتجليد #1" : "مثال: طلبية مكتبات الفجالة #1094"}
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white transition-colors ${
                  errors.party ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-slate-800"
                }`}
              />
              {errors.party && <p className="text-3xs text-rose-600 font-bold mt-1">{errors.party}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              المسؤول عن الحركة / أمين المستودع
            </label>
            <input
              type="text"
              value={officer}
              onChange={(e) => setOfficer(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:bg-white transition-colors"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 pb-2 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0 sticky bottom-0 bg-white/95 backdrop-blur-xs z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 shadow-xs">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer ${
                type === "inflow" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {submitting ? "جاري التوثيق..." : isEdit ? "تحديث المعاملة" : "توثيق الإذن المخزني"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransactionFormModal;
