import { useState } from "react";
import { 
  X, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  RotateCcw,
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  Building2, 
  Truck, 
  FileText, 
  AlertCircle, 
  Loader2,
  Package,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { ProductCombobox } from "./ProductCombobox";
import { AdvancedProductPickerModal } from "./AdvancedProductPickerModal";
import { validateVoucher, VOUCHER_TYPE, VOUCHER_SOURCE, RETURN_DIRECTION } from "../schemas/voucherSchema";
import { getTodayDateString } from "../../../utils/dateUtils";

export function VoucherFormModal({ 
  isOpen, 
  onClose, 
  onSave, 
  type = VOUCHER_TYPE.INBOUND // 1: وارد | 2: صرف | 3: مرتجع
}) {
  const isInbound = type === VOUCHER_TYPE.INBOUND;
  const isReturn = type === VOUCHER_TYPE.RETURN;
  const isOutbound = type === VOUCHER_TYPE.OUTBOUND;

  // حقول رأس الإذن
  const [date, setDate] = useState(getTodayDateString());
  const [source, setSource] = useState(isInbound ? VOUCHER_SOURCE.PRODUCTION : VOUCHER_SOURCE.EXTERNAL);
  const [partyName, setPartyName] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [delivererName, setDelivererName] = useState("");
  const [notes, setNotes] = useState("");
  const [returnDirection, setReturnDirection] = useState(RETURN_DIRECTION.INBOUND);
  const [returnReason, setReturnReason] = useState("");

  // بنود الأصناف في الإذن: كل بند يحتفظ بكائن الصنف المختار كاملاً والوحدة المحددة
  const [items, setItems] = useState([
    { product: null, quantity: "", entryUnit: 2 },
  ]);

  const [isAdvancedPickerOpen, setIsAdvancedPickerOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  // صالة الإنتاج في الوارد: تتطلب notebooksOnly=true
  const isProductionSource = isInbound && source === VOUCHER_SOURCE.PRODUCTION;

  // هل الحركة تخصم من رصيد المخزن؟ (صرف أو مرتجع منصرف لمورد)
  const isStockDeduction = isOutbound || (isReturn && returnDirection === RETURN_DIRECTION.OUTBOUND);

  // عند تغيير المصدر: مسح الأصناف المختارة والبدء من جديد
  const handleSourceChange = (newSource) => {
    if (newSource === source) return;
    setSource(newSource);
    setItems([{ product: null, quantity: "", entryUnit: 2 }]);
    setErrors((prev) => ({ ...prev, items: null }));
  };

  if (!isOpen) return null;

  // إضافة صنف جديد للإذن
  const handleAddItem = () => {
    setItems((prev) => [...prev, { product: null, quantity: "", entryUnit: 2 }]);
  };

  // إزالة صنف من الإذن
  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // إضافة أو إزالة صنف من الإضافة المتقدمة (نقرة واحدة)
  const handleToggleProductFromPicker = (product) => {
    if (!product) return;
    const isAlreadyChosen = items.some((it) => it.product?.id === product.id);

    if (isAlreadyChosen) {
      // إزالة الصنف إذا كان موجوداً مسبقاً
      setItems((prev) => {
        const filtered = prev.filter((it) => it.product?.id !== product.id);
        return filtered.length > 0 ? filtered : [{ product: null, quantity: "", entryUnit: 2 }];
      });
    } else {
      // إضافة الصنف تلقائياً
      setItems((prev) => {
        const isCopyPaper = product?.unitType === 3 || product?.baseUnit === "كرتونة";
        const defaultUnit = isCopyPaper ? 2 : 1;
        const newItem = { product, quantity: "", entryUnit: defaultUnit };

        // لو كان هناك بند وحيد وفارغ، نستبدله بالصنف الجديد
        if (prev.length === 1 && !prev[0].product) {
          return [newItem];
        }
        return [...prev, newItem];
      });
    }

    if (errors.items) setErrors((prev) => ({ ...prev, items: null }));
  };

  // عند اختيار صنف عبر Combobox
  const handleSelectProduct = (index, product) => {
    setItems((prev) => {
      const updated = [...prev];
      const isCopyPaper = product?.unitType === 3 || product?.baseUnit === "كرتونة";
      const defaultUnit = isCopyPaper ? 2 : 1;
      updated[index] = { ...updated[index], product, entryUnit: defaultUnit };
      return updated;
    });
    if (errors.items) setErrors((prev) => ({ ...prev, items: null }));
  };

  // عند تغيير وحدة القياس للبند (خاص بورق التصوير: كرتونة أو رزمة)
  const handleUnitChange = (index, entryUnit) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], entryUnit };
      return updated;
    });
    if (errors.items) setErrors((prev) => ({ ...prev, items: null }));
  };

  // عند تغيير الكمية
  const handleQuantityChange = (index, quantity) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity };
      return updated;
    });
    if (errors.items) setErrors((prev) => ({ ...prev, items: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);

    // التحقق من تحديد صنف لكل بند
    const missingProduct = items.some((it) => !it.product || !it.product.id);
    if (missingProduct) {
      setErrors({ items: "يجب اختيار الصنف لكل بند مضاف في الإذن" });
      return;
    }

    // التحقق من الرصيد المتاح في الحركات التي تخصم من المخزون (صرف أو مرتجع لمورد)
    if (isStockDeduction) {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const prod = it.product;
        if (!prod) continue;

        const enteredQty = Number(it.quantity) || 0;
        const isCopyPaper = prod.unitType === 3 || prod.baseUnit === "كرتونة";
        const entryUnit = it.entryUnit ?? (isCopyPaper ? 2 : 1);
        const actualStock = prod.totalSubUnitStock !== undefined ? prod.totalSubUnitStock : prod.availableInEntryUnit;

        let availableInUnit = actualStock;
        let unitName = prod.entryUnitLabel;

        if (isCopyPaper) {
          if (entryUnit === 2) {
            availableInUnit = prod.unitsPerBaseUnit > 0 ? Math.floor(actualStock / prod.unitsPerBaseUnit) : 0;
            unitName = "كرتونة";
          } else {
            availableInUnit = actualStock;
            unitName = "رزمة";
          }
        } else {
          availableInUnit = actualStock;
        }

        if (enteredQty > availableInUnit) {
          setErrors({
            items: `الكمية المطلوبة للصنف "${prod.name}" (${enteredQty} ${unitName}) تتجاوز الرصيد المتاح بالمخزن (${availableInUnit.toLocaleString()} ${unitName})`,
          });
          return;
        }
      }
    }

    // تجهيز كائن الطلب
    const payload = {
      type,
      date: date || null,
      source: isInbound ? source : VOUCHER_SOURCE.EXTERNAL,
      partyName: isProductionSource ? null : partyName.trim() || null,
      receiverName: receiverName.trim(),
      delivererName: isOutbound ? null : (delivererName.trim() || null),
      notes: notes.trim() || null,
      returnDirection: isReturn ? returnDirection : null,
      returnReason: isReturn ? returnReason.trim() || null : null,
      items: items.map((it) => {
        const isCopyPaper = it.product?.unitType === 3 || it.product?.baseUnit === "كرتونة";
        const defaultUnit = isCopyPaper ? 2 : 1;
        return {
          productId: it.product?.id || "",
          quantity: Number(it.quantity) || 0,
          entryUnit: it.entryUnit ?? defaultUnit,
        };
      }),
    };

    const validation = validateVoucher(payload);
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error("خطأ في حفظ إذن المخزن:", err);
      setApiError(err.message || "حدث خطأ غير متوقع أثناء تسجيل الإذن بالخادم.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-2xl max-h-[calc(100dvh-2rem)] sm:max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-right">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                isReturn
                  ? "bg-amber-100/90 text-amber-800"
                  : isInbound
                  ? "bg-emerald-100/80 text-emerald-700"
                  : "bg-rose-100/80 text-rose-700"
              }`}
            >
              {isReturn ? (
                <RotateCcw className="w-5 h-5" />
              ) : isInbound ? (
                <ArrowDownToLine className="w-5 h-5" />
              ) : (
                <ArrowUpFromLine className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isReturn
                  ? "تسجيل إذن مرتجع جديد"
                  : isInbound
                  ? "تسجيل إذن وارد جديد"
                  : "تسجيل إذن صرف جديد"}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {isReturn
                  ? "توثيق استلام بضاعة مرتجعة من عميل أو رد بضاعة لمورد وضبط أرصدة المخزن"
                  : isInbound
                  ? "إضافة بضاعة مستلمة من صالة الإنتاج أو مورد خارجي"
                  : "صرف وتسليم بضاعة للعملاء وتجار الجملة"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-right">
          {apiError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* حقول رأس الإذن */}
          {isReturn ? (
            <>
              {/* 1. نوع حركة المرتجع (وارد للمخزن أم منصرف لمورد) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  نوع حركة المرتجع <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReturnDirection(RETURN_DIRECTION.INBOUND)}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      returnDirection === RETURN_DIRECTION.INBOUND
                        ? "border-amber-600 bg-amber-50/70 text-amber-950 font-bold ring-2 ring-amber-600/20"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <p className="text-xs sm:text-sm">مرتجع وارد (إيداع بالمخزن)</p>
                    </div>
                    <p className="text-2xs text-slate-400 mt-1">بضاعة مرتجعة من عميل أو صالة وتضاف للرصيد (+)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnDirection(RETURN_DIRECTION.OUTBOUND)}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      returnDirection === RETURN_DIRECTION.OUTBOUND
                        ? "border-amber-600 bg-amber-50/70 text-amber-950 font-bold ring-2 ring-amber-600/20"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <p className="text-xs sm:text-sm">مرتجع منصرف (رد لمورّد)</p>
                    </div>
                    <p className="text-2xs text-slate-400 mt-1">إرجاع بضاعة من المخزن لمورد خارجي (-)</p>
                  </button>
                </div>
              </div>

              {/* 2. سبب الإرجاع واختصارات شائعة */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                    سبب الإرجاع <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-2xs text-slate-400">انقر على أحد الأسباب أو اكتب سبباً مخصصاً</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {[
                    "مرتجع مبيعات / عميل",
                    "عيوب تصنيع أو طباعة",
                    "زيادة عن الطلبية المطلوبة",
                    "تالف أثناء النقل أو التحميل",
                    "فائض عن تشغيل الصالة",
                    "خطأ في المقاس أو الوزن"
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setReturnReason(chip);
                        if (errors.returnReason) setErrors((prev) => ({ ...prev, returnReason: null }));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
                        returnReason === chip
                          ? "bg-amber-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-800"
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => {
                    setReturnReason(e.target.value);
                    if (errors.returnReason) setErrors((prev) => ({ ...prev, returnReason: null }));
                  }}
                  placeholder="اكتب سبب إرجاع البضاعة بالتفصيل..."
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white font-medium ${
                    errors.returnReason ? "border-rose-400 bg-rose-50/30" : "border-slate-200 focus:border-slate-800"
                  }`}
                />
                {errors.returnReason && <p className="text-xs text-rose-500 font-bold mt-1">{errors.returnReason}</p>}
              </div>

              {/* 3. التاريخ والجهة */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    تاريخ الإذن <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    max={getTodayDateString()}
                    onChange={(e) => {
                      setDate(e.target.value);
                      if (errors.date) setErrors((prev) => ({ ...prev, date: null }));
                    }}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white font-medium ${
                      errors.date ? "border-rose-400 bg-rose-50/30" : "border-slate-200 focus:border-slate-800"
                    }`}
                  />
                  {errors.date && <p className="text-xs text-rose-500 font-bold mt-1">{errors.date}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {returnDirection === RETURN_DIRECTION.OUTBOUND ? "الجهة المرتجع إليها (المورّد)" : "الجهة المرتجع منها (العميل)"} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={partyName}
                    onChange={(e) => {
                      setPartyName(e.target.value);
                      if (errors.partyName) setErrors((prev) => ({ ...prev, partyName: null }));
                    }}
                    placeholder={returnDirection === RETURN_DIRECTION.OUTBOUND ? "اسم المورد أو المصنع الخارجي" : "اسم العميل أو المكتبة أو المعرض"}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white font-medium ${
                      errors.partyName ? "border-rose-400 bg-rose-50/30" : "border-slate-200 focus:border-slate-800"
                    }`}
                  />
                  {errors.partyName && <p className="text-xs text-rose-500 font-bold mt-1">{errors.partyName}</p>}
                </div>
              </div>

              {/* 4. المستلم والقائم بالإرجاع */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    المستلم (أمين المخزن) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={receiverName}
                    onChange={(e) => {
                      setReceiverName(e.target.value);
                      if (errors.receiverName) setErrors((prev) => ({ ...prev, receiverName: null }));
                    }}
                    placeholder="اسم أمين المخزن الذي استلم وفحص المرتجع"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white font-medium ${
                      errors.receiverName ? "border-rose-400 bg-rose-50/30" : "border-slate-200 focus:border-slate-800"
                    }`}
                  />
                  {errors.receiverName && <p className="text-xs text-rose-500 font-bold mt-1">{errors.receiverName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    القائم بالإرجاع (المندوب / السائق)
                  </label>
                  <input
                    type="text"
                    value={delivererName}
                    onChange={(e) => {
                      setDelivererName(e.target.value);
                      if (errors.delivererName) setErrors((prev) => ({ ...prev, delivererName: null }));
                    }}
                    placeholder="اسم الشخص أو السائق الذي أحضر البضاعة"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:bg-white font-medium"
                  />
                </div>
              </div>
            </>
          ) : isInbound ? (
            <>
              {/* نوع ومصدر الإذن في حالة الوارد */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  مصدر الاستلام (جهة التوريد) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSourceChange(VOUCHER_SOURCE.PRODUCTION)}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      source === VOUCHER_SOURCE.PRODUCTION
                        ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold ring-2 ring-emerald-600/20"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <p className="text-xs sm:text-sm">صالة الإنتاج والتجليد</p>
                    <p className="text-2xs text-slate-400 mt-0.5">استلام كشاكيل وكراريس تامة الصنع</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSourceChange(VOUCHER_SOURCE.EXTERNAL)}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      source === VOUCHER_SOURCE.EXTERNAL
                        ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold ring-2 ring-emerald-600/20"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <p className="text-xs sm:text-sm">جهة خارجية / مورد</p>
                    <p className="text-2xs text-slate-400 mt-0.5">توريد ورق تصوير أو بضاعة خارجية</p>
                  </button>
                </div>
              </div>

              {/* التاريخ واسم المستلم */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* التاريخ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    تاريخ الإذن <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    max={getTodayDateString()}
                    onChange={(e) => {
                      setDate(e.target.value);
                      if (errors.date) setErrors((prev) => ({ ...prev, date: null }));
                    }}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white font-medium ${
                      errors.date ? "border-rose-400 bg-rose-50/30" : "border-slate-200 focus:border-slate-800"
                    }`}
                  />
                  {errors.date && <p className="text-xs text-rose-500 font-bold mt-1">{errors.date}</p>}
                </div>

                {/* المستلم */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    المستلم (أمين المخزن / المفوض) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={receiverName}
                    onChange={(e) => {
                      setReceiverName(e.target.value);
                      if (errors.receiverName) setErrors((prev) => ({ ...prev, receiverName: null }));
                    }}
                    placeholder="اسم أمين المخزن أو المستلم الفعلي"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white font-medium ${
                      errors.receiverName ? "border-rose-400 bg-rose-50/30" : "border-slate-200 focus:border-slate-800"
                    }`}
                  />
                  {errors.receiverName && <p className="text-xs text-rose-500 font-bold mt-1">{errors.receiverName}</p>}
                </div>
              </div>

              {/* الحقول الإضافية بحسب المصدر (صالة الإنتاج أو مورد خارجي) */}
              {isProductionSource ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* المُسلِّم من صالة الإنتاج */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      المُسلِّم (مسؤول صالة الإنتاج) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={delivererName}
                      onChange={(e) => {
                        setDelivererName(e.target.value);
                        if (errors.delivererName) setErrors((prev) => ({ ...prev, delivererName: null }));
                      }}
                      placeholder="اسم مشرف أو عامل صالة الإنتاج الذي قام بالتسليم"
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white font-medium ${
                        errors.delivererName ? "border-rose-400 bg-rose-50/30" : "border-slate-200 focus:border-slate-800"
                      }`}
                    />
                    {errors.delivererName && <p className="text-xs text-rose-500 font-bold mt-1">{errors.delivererName}</p>}
                  </div>

                  {/* جهة التسليم بالمصنع */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      الجهة المُسلّمة بالمصنع
                    </label>
                    <input
                      type="text"
                      value="صالة الإنتاج والتجليد (قسم تجهيز الكشاكيل)"
                      disabled
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed select-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* الجهة / المورد */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      المورّد / المصدر الخارجي <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={partyName}
                      onChange={(e) => {
                        setPartyName(e.target.value);
                        if (errors.partyName) setErrors((prev) => ({ ...prev, partyName: null }));
                      }}
                      placeholder="مثال: مصنع الأهرام للورق"
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white font-medium ${
                        errors.partyName ? "border-rose-400 bg-rose-50/30" : "border-slate-200 focus:border-slate-800"
                      }`}
                    />
                    {errors.partyName && <p className="text-xs text-rose-500 font-bold mt-1">{errors.partyName}</p>}
                  </div>

                  {/* المُسلِّم (الجايب) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      المُسلِّم (الجايب / السائق) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={delivererName}
                      onChange={(e) => {
                        setDelivererName(e.target.value);
                        if (errors.delivererName) setErrors((prev) => ({ ...prev, delivererName: null }));
                      }}
                      placeholder="اسم السائق أو المندوب المورد"
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white font-medium ${
                        errors.delivererName ? "border-rose-400 bg-rose-50/30" : "border-slate-200 focus:border-slate-800"
                      }`}
                    />
                    {errors.delivererName && <p className="text-xs text-rose-500 font-bold mt-1">{errors.delivererName}</p>}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* نموذج الصرف: */}
              {/* صف أول: (التاريخ + العميل) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* التاريخ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    تاريخ الإذن <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    max={getTodayDateString()}
                    onChange={(e) => {
                      setDate(e.target.value);
                      if (errors.date) setErrors((prev) => ({ ...prev, date: null }));
                    }}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white font-medium ${
                      errors.date ? "border-rose-400 bg-rose-50/30" : "border-slate-200 focus:border-slate-800"
                    }`}
                  />
                  {errors.date && <p className="text-xs text-rose-500 font-bold mt-1">{errors.date}</p>}
                </div>

                {/* الجهة المنصرف إليها (العميل) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    الجهة المنصرف إليها (العميل) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={partyName}
                    onChange={(e) => {
                      setPartyName(e.target.value);
                      if (errors.partyName) setErrors((prev) => ({ ...prev, partyName: null }));
                    }}
                    placeholder="مثال: مكتبات الفجالة - شركة الأمل"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white font-medium ${
                      errors.partyName ? "border-rose-400 bg-rose-50/30" : "border-slate-200 focus:border-slate-800"
                    }`}
                  />
                  {errors.partyName && <p className="text-xs text-rose-500 font-bold mt-1">{errors.partyName}</p>}
                </div>
              </div>

              {/* صف تاني: (المستلم فقط) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  المستلم <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => {
                    setReceiverName(e.target.value);
                    if (errors.receiverName) setErrors((prev) => ({ ...prev, receiverName: null }));
                  }}
                  placeholder="اسم الشخص اللي استلم البضاعة (مندوب العميل / السواق)"
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:border-slate-800 font-medium ${
                    errors.receiverName ? "border-rose-400 bg-rose-50/30" : "border-slate-200 focus:border-slate-800"
                  }`}
                />
                {errors.receiverName && <p className="text-xs text-rose-500 font-bold mt-1">{errors.receiverName}</p>}
              </div>
            </>
          )}

          {/* بنود وأصناف الإذن */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600" />
                أصناف وبنود الإذن <span className="text-rose-500">*</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdvancedPickerOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/60 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="عرض جميع الأصناف وإضافتها بضغطة واحدة"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  إضافة متقدمة
                </button>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/60 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  إضافة صنف آخر
                </button>
              </div>
            </div>

            {errors.items && <p className="text-xs text-rose-500 font-bold">{errors.items}</p>}

            <div className="space-y-3">
              {items.map((item, index) => {
                const selectedProd = item.product;
                const isCopyPaper = selectedProd?.unitType === 3 || selectedProd?.baseUnit === "كرتونة";
                const currentUnit = item.entryUnit ?? (isCopyPaper ? 2 : 1);
                const unitLabel = isCopyPaper
                  ? (currentUnit === 2 ? "كرتونة" : "رزمة")
                  : (selectedProd?.entryUnitLabel || "قطعة");

                const actualStock = selectedProd
                  ? (selectedProd.totalSubUnitStock !== undefined ? selectedProd.totalSubUnitStock : selectedProd.availableInEntryUnit)
                  : 0;

                const fullCartons = isCopyPaper && selectedProd?.unitsPerBaseUnit > 0
                  ? Math.floor(actualStock / selectedProd.unitsPerBaseUnit)
                  : 0;
                const looseReams = isCopyPaper && selectedProd?.unitsPerBaseUnit > 0
                  ? actualStock % selectedProd.unitsPerBaseUnit
                  : 0;

                const availableInCurrentUnit = isCopyPaper
                  ? (currentUnit === 2 ? fullCartons : actualStock)
                  : (Number(selectedProd?.availableInEntryUnit ?? actualStock));

                const enteredQty = Number(item.quantity) || 0;
                const isOverStock = !isInbound && selectedProd && enteredQty > availableInCurrentUnit;

                const quantityLabel = `عدد ال${unitLabel}`;
                const quantityBadge = unitLabel;

                // الأصناف المختارة في بنود أخرى لتتعطل في هذا البند
                const disabledProductIds = items
                  .map((it, i) => (i !== index ? it.product?.id : null))
                  .filter(Boolean);

                return (
                  <div
                    key={index}
                    className={`p-3.5 rounded-xl space-y-2.5 border transition-colors ${
                      isOverStock ? "bg-rose-50/50 border-rose-200" : "bg-slate-50/80 border-slate-200/80"
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      {/* اختيار الصنف عبر Combobox المخصص */}
                      <div className="sm:col-span-7">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-2xs font-bold text-slate-500">
                            الصنف #{index + 1}
                          </label>
                          {/* في إذن الصرف: عرض المتاح جنب الصنف */}
                          {!isInbound && selectedProd && (
                            <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                              {isCopyPaper
                                ? looseReams > 0
                                  ? `المتاح: ${fullCartons.toLocaleString()} كرتونة و ${looseReams.toLocaleString()} رزمة (${actualStock.toLocaleString()} رزمة)`
                                  : `المتاح: ${fullCartons.toLocaleString()} كرتونة (${actualStock.toLocaleString()} رزمة)`
                                : `المتاح: ${availableInCurrentUnit.toLocaleString()} ${unitLabel}`}
                            </span>
                          )}
                        </div>

                        <ProductCombobox
                          selectedProduct={selectedProd}
                          onSelect={(prod) => handleSelectProduct(index, prod)}
                          notebooksOnly={isProductionSource}
                          isOutbound={!isInbound}
                          disabledProductIds={disabledProductIds}
                          placeholder="اختر الصنف من القائمة..."
                        />
                      </div>

                      {/* الكمية */}
                      <div className="sm:col-span-4">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <label className="text-2xs font-bold text-slate-500">
                              {quantityLabel}
                            </label>
                            {isCopyPaper && (
                              <div className="flex items-center gap-0.5 bg-slate-200/90 p-0.5 rounded-md border border-slate-300">
                                <button
                                  type="button"
                                  onClick={() => handleUnitChange(index, 2)}
                                  className={`px-1.5 py-0.5 text-3xs font-extrabold rounded transition-all cursor-pointer ${
                                    currentUnit === 2
                                      ? "bg-emerald-600 text-white shadow-2xs"
                                      : "text-slate-600 hover:text-slate-900"
                                  }`}
                                  title="إدخال الكمية بعدد الكراتين"
                                >
                                  📦 كرتونة
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUnitChange(index, 1)}
                                  className={`px-1.5 py-0.5 text-3xs font-extrabold rounded transition-all cursor-pointer ${
                                    currentUnit === 1
                                      ? "bg-blue-600 text-white shadow-2xs"
                                      : "text-slate-600 hover:text-slate-900"
                                  }`}
                                  title="إدخال الكمية بعدد الرزم"
                                >
                                  📄 رزمة
                                </button>
                              </div>
                            )}
                          </div>
                          {!isInbound && selectedProd && (
                            <span
                              className={`text-2xs font-bold px-1.5 py-0.5 rounded ${
                                isOverStock
                                  ? "text-rose-700 bg-rose-100"
                                  : "text-slate-500 bg-slate-100"
                              }`}
                            >
                              أقصى كمية: {availableInCurrentUnit.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max={!isInbound && selectedProd ? availableInCurrentUnit : undefined}
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            placeholder="0"
                            className={`w-full px-3 py-2 pl-16 text-xs sm:text-sm font-bold bg-white border rounded-lg focus:outline-none ${
                              isOverStock
                                ? "border-rose-400 focus:border-rose-600 text-rose-700"
                                : "border-slate-200 focus:border-slate-800"
                            }`}
                          />
                          {quantityBadge && (
                            <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400 pointer-events-none">
                              {quantityBadge}
                            </span>
                          )}
                        </div>

                        {/* معادلة التحويل التلقائية بالمستودع */}
                        {enteredQty > 0 && selectedProd && (
                          <div className="mt-1.5 text-2xs font-bold">
                            {isCopyPaper ? (
                              currentUnit === 1 ? (
                                <div className="flex flex-wrap items-center justify-between gap-1 text-blue-900 bg-blue-50 border border-blue-200/80 px-2 py-1 rounded-md">
                                  <span>المسجل: {enteredQty.toLocaleString()} رزمة</span>
                                  <span className="text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200 font-extrabold">
                                    = {(enteredQty / (selectedProd.unitsPerBaseUnit || 5)).toFixed(2).replace(/\.00$/, "")} كرتونة
                                    {enteredQty % (selectedProd.unitsPerBaseUnit || 5) !== 0 &&
                                      ` (${Math.floor(enteredQty / (selectedProd.unitsPerBaseUnit || 5))} ك و ${enteredQty % (selectedProd.unitsPerBaseUnit || 5)} ر)`}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-wrap items-center justify-between gap-1 text-emerald-900 bg-emerald-50 border border-emerald-200/80 px-2 py-1 rounded-md">
                                  <span>المسجل: {enteredQty.toLocaleString()} كرتونة</span>
                                  <span className="text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200 font-extrabold">
                                    = {(enteredQty * (selectedProd.unitsPerBaseUnit || 5)).toLocaleString()} رزمة
                                  </span>
                                </div>
                              )
                            ) : (
                              <div className="flex flex-wrap items-center justify-between gap-1 text-slate-800 bg-slate-100 border border-slate-200/80 px-2 py-1 rounded-md">
                                <span>المسجل: {enteredQty.toLocaleString()} باكو</span>
                                <span className="text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-extrabold">
                                  = {(enteredQty * (selectedProd.unitsPerBaseUnit || 1)).toLocaleString()} قطعة
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* زر الحذف */}
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          disabled={items.length <= 1}
                          title="حذف هذا الصنف"
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {isOverStock && (
                      <p className="text-xs text-rose-600 font-bold">
                        ⚠️ الكمية المدخلة ({enteredQty} {unitLabel}) تتجاوز الرصيد المتوفر بالمخزن ({availableInCurrentUnit.toLocaleString()} {unitLabel})
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ملاحظات الإذن */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              ملاحظات أو بيان إضافي
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات حول الشحنة، رقم الفاتورة الخارجية أو إشعار التشغيل..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:bg-white font-medium resize-none"
            />
          </div>

          {/* Footer Buttons (Sticky for mobile browsers) */}
          <div className="pt-3 pb-2 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0 sticky bottom-0 bg-white/95 backdrop-blur-xs z-10 -mx-6 px-6 shadow-xs">
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
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 ${
                isReturn
                  ? "bg-amber-600 hover:bg-amber-700"
                  : isInbound
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {submitting
                ? "جاري التسجيل..."
                : isReturn
                ? "تسجيل إذن المرتجع"
                : isInbound
                ? "تسجيل إذن الوارد"
                : "تسجيل إذن الصرف"}
            </button>
          </div>
        </form>
      </div>

      {isAdvancedPickerOpen && (
        <AdvancedProductPickerModal
          isOpen={isAdvancedPickerOpen}
          onClose={() => setIsAdvancedPickerOpen(false)}
          selectedProductIds={items.map((it) => it.product?.id).filter(Boolean)}
          onToggleProduct={handleToggleProductFromPicker}
          notebooksOnly={isProductionSource}
          isOutbound={isStockDeduction}
        />
      )}
    </div>
  );
}

export default VoucherFormModal;
