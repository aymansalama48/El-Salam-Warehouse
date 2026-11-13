import { useState, useEffect } from "react";
import { 
  ArrowLeftRight, 
  FileText, 
  Building2, 
  UserCheck, 
  Package, 
  Layers, 
  Calculator,
  ArrowDownToLine,
  ArrowUpFromLine 
} from "lucide-react";
import { initialMockProducts, TRANSACTION_TYPES } from "../../../data/mockWarehouseState";
import { showSuccess } from "../../../utils/alertUtils";

/**
 * نموذج الحركة المخزنية (TransactionForm)
 * يدعم حركات الوارد والمنصرف مع وحدة القياس (باكو / بالجرام)
 */
export function TransactionForm({ 
  products = initialMockProducts, 
  onSubmit, 
  onCancel, 
  initialData, 
  defaultType = "inflow" 
}) {
  const [type, setType] = useState(initialData?.type || defaultType);
  const [referenceDoc, setReferenceDoc] = useState(initialData?.referenceDoc || "");
  const [party, setParty] = useState(initialData?.party || "");
  const [officer, setOfficer] = useState(initialData?.officer || "م. إبراهيم السلامي");
  const [selectedProductId, setSelectedProductId] = useState(
    initialData?.productId || products[0]?.id || ""
  );
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || "");
  
  const [quantityLabel, setQuantityLabel] = useState("الكمية المطلوبة");
  const [currentBaseUnit, setCurrentBaseUnit] = useState("باكو");
  const [currentUnitContent, setCurrentUnitContent] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const foundProduct = products.find((p) => p.id === selectedProductId);
    if (foundProduct && foundProduct.baseUnit) {
      const unit = foundProduct.baseUnit.trim();
      const formattedUnit = unit.startsWith("ب") ? unit : `بال${unit}`;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuantityLabel(`الكمية (${formattedUnit})`);
      setCurrentBaseUnit(unit);
      setCurrentUnitContent(foundProduct.unitContent || 10);
    } else {
      setQuantityLabel("الكمية (بالباكو)");
      setCurrentBaseUnit("باكو");
      setCurrentUnitContent(10);
    }
  }, [selectedProductId, products]);

  const parsedQuantity = Number(quantity) || 0;
  const totalInternalUnits = parsedQuantity * currentUnitContent;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !quantity) return;

    setSubmitting(true);

    const product = products.find((p) => p.id === selectedProductId);
    const prefix = type === "inflow" ? "+" : "-";

    const transactionPayload = {
      id: initialData?.id || `TX-${Date.now().toString().slice(-4)}`,
      type,
      productId: selectedProductId,
      productName: product?.name || "صنف غير معروف",
      baseUnit: currentBaseUnit,
      quantityNum: parsedQuantity,
      quantityFormatted: `${prefix}${parsedQuantity.toLocaleString()} ${currentBaseUnit}`,
      totalInternalUnits,
      referenceDoc: referenceDoc.trim() || (type === "inflow" ? "إشعار استلام إنتاج" : "إذن خروج بضاعة"),
      party: party.trim() || (type === "inflow" ? "صالة الإنتاج والتجليد" : "صرف طلبيات جملة"),
      officer: officer.trim() || "أمين المستودع",
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
    };

    if (onSubmit) {
      await onSubmit(transactionPayload);
    }

    const typeWord = type === "inflow" ? "استلام وارد" : "صرف منصرف";
    await showSuccess(
      "تم تسجيل الحركة بنجاح",
      `تم توثيق إذن ${typeWord} بكمية (${parsedQuantity.toLocaleString()} ${currentBaseUnit}) لصنف "${transactionPayload.productName}"`
    );

    if (!initialData) {
      setQuantity("");
      setReferenceDoc("");
      setParty("");
    }

    setSubmitting(false);
  };

  const activeProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all text-right">
      {/* Header - واسع ومريح بدون أي تآكل */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
            type === "inflow"
              ? "bg-emerald-100/80 text-emerald-700"
              : "bg-blue-100/80 text-blue-700"
          }`}>
            {type === "inflow" ? <ArrowDownToLine className="w-5 h-5" /> : <ArrowUpFromLine className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 leading-tight">
              {type === "inflow" ? "تسجيل إذن وارد (استلام بالمخزن)" : "تسجيل إذن منصرف (صرف طلبيات)"}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              توثيق الحركات المخزنية للكشاكيل والورق بدفتر اليومية
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* نوع الحركة ومستند الإسناد */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
              نوع الحركة المخزنية <span className="text-rose-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer font-bold transition-colors"
            >
              {TRANSACTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              مستند الإسناد / رقم الفاتورة أو الإذن <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={referenceDoc}
              onChange={(e) => setReferenceDoc(e.target.value)}
              placeholder={type === "inflow" ? "مثال: إشعار استلام إنتاج #332" : "مثال: فاتورة مبيعات #1094"}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-800/10 transition-colors font-medium"
            />
          </div>
        </div>

        {/* المنتج المختار */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-600" />
              المنتج المختار <span className="text-rose-500">*</span>
            </span>
            {activeProduct && (
              <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                الوحدة: {activeProduct.baseUnit} ({activeProduct.unitContent} قطعة/ورقة)
              </span>
            )}
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer font-bold transition-colors"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — (الوحدة: {p.baseUnit})
              </option>
            ))}
          </select>
        </div>

        {/* الكمية المطلوبة */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-900">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-extrabold text-blue-700 bg-blue-50/90 px-2 py-0.5 rounded-md border border-blue-100">
                {quantityLabel}
              </span>
              <span className="text-rose-500">*</span>
            </span>
            <span className="text-2xs text-slate-400 font-medium">
              يتغير تلقائياً حسب وحدة قياس الصنف المختار
            </span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="مثال: 500"
              className="w-full px-3.5 py-2.5 pl-20 text-xs sm:text-sm font-bold bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-800/10 transition-colors"
            />
            <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
              {currentBaseUnit}
            </span>
          </div>

          {parsedQuantity > 0 && (
            <div className="mt-2 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs flex items-center justify-between text-emerald-800 font-medium">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                إجمالي المحتوى الفعلي ({parsedQuantity} × {currentUnitContent}):
              </span>
              <span className="font-extrabold">
                {totalInternalUnits.toLocaleString()} {currentBaseUnit === "كرتونة" ? "باكو / رزمة" : "كشكول / قطعة"}
              </span>
            </div>
          )}
        </div>

        {/* الجهة والمسؤول */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              الجهة (مورد / عميل / صالة إنتاج) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={party}
              onChange={(e) => setParty(e.target.value)}
              placeholder={type === "inflow" ? "مثال: صالة الإنتاج والتجليد #1" : "مثال: طلبية مكتبات الفجالة"}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-800/10 transition-colors font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              حقل المسؤول (أمين المستودع / المراجع) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={officer}
              onChange={(e) => setOfficer(e.target.value)}
              placeholder="اسم أمين المستودع أو المراجع"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-800/10 transition-colors font-medium"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 ${
              type === "inflow"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {submitting ? "جاري الحفظ..." : type === "inflow" ? "تسجيل إذن الوارد" : "تسجيل إذن المنصرف"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TransactionForm;

