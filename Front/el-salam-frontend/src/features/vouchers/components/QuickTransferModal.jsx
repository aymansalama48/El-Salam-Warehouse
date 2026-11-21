import { useState } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  Zap,
  ArrowDownToLine, 
  ArrowUpFromLine, 
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
  Layers,
  ArrowRightLeft
} from "lucide-react";
import Swal from "sweetalert2";
import { ProductCombobox } from "./ProductCombobox";
import { AdvancedProductPickerModal } from "./AdvancedProductPickerModal";
import { UnitSelect } from "../../../components/common/UnitSelect";
import { VOUCHER_SOURCE } from "../schemas/voucherSchema";
import { getTodayDateString } from "../../../utils/dateUtils";
import { createQuickTransfer } from "../services/voucherService";
import { notifyVoucherChanged } from "../hooks/useVoucherSummary";

export function QuickTransferModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}) {
  // حقول التاريخ والمصدر
  const [date, setDate] = useState(getTodayDateString());
  const [inboundSource, setInboundSource] = useState(VOUCHER_SOURCE.PRODUCTION);
  
  // بيانات الوارد
  const [inboundPartyName, setInboundPartyName] = useState("");
  const [inboundDelivererName, setInboundDelivererName] = useState("");
  const [inboundReceiverName, setInboundReceiverName] = useState("");

  // بيانات المنصرف للعميل
  const [outboundPartyName, setOutboundPartyName] = useState("");
  const [outboundReceiverName, setOutboundReceiverName] = useState("");

  // ملاحظات عامة
  const [notes, setNotes] = useState("");

  // بنود الأصناف
  const [items, setItems] = useState([
    { productId: "", product: null, quantity: "", entryUnit: null }
  ]);

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  if (!isOpen) return null;

  const isExternalInbound = inboundSource === VOUCHER_SOURCE.EXTERNAL;

  // --- التعامل مع الأصناف ---
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { productId: "", product: null, quantity: "", entryUnit: null },
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length === 0
        ? [{ productId: "", product: null, quantity: "", entryUnit: null }]
        : next;
    });
  };

  const handleProductSelect = (index, product) => {
    setItems((prev) => {
      const next = [...prev];
      if (product) {
        next[index] = {
          productId: product.id,
          product: product,
          quantity: next[index].quantity || "",
          entryUnit: product.entryUnit || null,
        };
      } else {
        next[index] = {
          productId: "",
          product: null,
          quantity: "",
          entryUnit: null,
        };
      }
      return next;
    });
  };

  const handleQuantityChange = (index, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: value };
      return next;
    });
  };

  const handleUnitChange = (index, unitValue) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], entryUnit: Number(unitValue) };
      return next;
    });
  };

  const handleToggleProductFromPicker = (product) => {
    const isSelected = items.some((it) => it.productId === product.id);
    if (isSelected) {
      setItems((prev) => {
        const next = prev.filter((it) => it.productId !== product.id);
        return next.length === 0
          ? [{ productId: "", product: null, quantity: "", entryUnit: null }]
          : next;
      });
    } else {
      setItems((prev) => {
        const hasSingleEmpty =
          prev.length === 1 && !prev[0].productId && !prev[0].quantity;
        const newItem = {
          productId: product.id,
          product: product,
          quantity: "",
          entryUnit: product.entryUnit || null,
        };
        return hasSingleEmpty ? [newItem] : [...prev, newItem];
      });
    }
  };

  // --- التحقق من صحة البيانات وحفظ الحركة ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);

    const formErrors = {};

    // 1. تحقق من بيانات الوارد
    if (isExternalInbound && !inboundPartyName.trim()) {
      formErrors.inboundPartyName = "اسم المورد أو الجهة الموردة مطلوب عند اختيار مصدر خارجي";
    }
    if (!inboundDelivererName.trim()) {
      formErrors.inboundDelivererName = "اسم السائق أو مندوب التسليم مطلوب";
    }
    if (!inboundReceiverName.trim()) {
      formErrors.inboundReceiverName = "اسم أمين المخزن المستلم مطلوب";
    }

    // 2. تحقق من بيانات المنصرف
    if (!outboundPartyName.trim()) {
      formErrors.outboundPartyName = "اسم العميل أو الجهة المستلمة مطلوب";
    }
    if (!outboundReceiverName.trim()) {
      formErrors.outboundReceiverName = "اسم مندوب العميل أو المستلم الفعلي مطلوب";
    }

    // 3. تحقق من الأصناف
    const validItems = items.filter((it) => it.productId);
    if (validItems.length === 0) {
      formErrors.items = "يجب اختيار صنف واحد على الأقل للحركة السريعة";
    } else {
      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        const qty = Number(item.quantity);
        if (!item.quantity || isNaN(qty) || qty <= 0) {
          formErrors.items = "يرجى تحديد كمية صحيحة أكبر من الصفر لجميع الأصناف المحددة";
          break;
        }

        // إذا كان المصدر صالة الإنتاج: كشاكيل وكراريس فقط
        if (inboundSource === VOUCHER_SOURCE.PRODUCTION && item.product?.entryUnit !== 1) {
          formErrors.items = `الصنف "${item.product?.name}" غير مسموح توريده من صالة الإنتاج. مسموح فقط بالكشاكيل والكراريس.`;
          break;
        }
      }
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        date: date || null,
        inboundSource: Number(inboundSource),
        inboundPartyName: isExternalInbound ? inboundPartyName.trim() : null,
        inboundDelivererName: inboundDelivererName.trim(),
        inboundReceiverName: inboundReceiverName.trim(),
        outboundPartyName: outboundPartyName.trim(),
        outboundReceiverName: outboundReceiverName.trim(),
        notes: notes.trim() || null,
        items: validItems.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity),
          entryUnit: it.entryUnit ? Number(it.entryUnit) : null,
        })),
      };

      const result = await createQuickTransfer(payload);

      // تنبيه التطبيق بتحديث الإحصائيات والحركات
      notifyVoucherChanged();

      // رسالة نجاح مميزة توضح رقم إذن الوارد ورقم إذن الصرف معاً
      await Swal.fire({
        icon: "success",
        title: "<span style='font-weight: 800; font-size: 1.25rem;'>تم تسجيل الحركة السريعة بنجاح! ⚡</span>",
        html: `
          <div style="font-family: inherit; text-align: right; line-height: 1.8; font-size: 0.95rem; margin-top: 10px;">
            <p style="color: #475569; margin-bottom: 12px;">تم إنشاء كلا الإذنين وتسجيل حركة البضاعة بالمخزن بنجاح:</p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 10px 14px; margin-bottom: 8px;">
              <strong style="color: #166534;">📥 إذن وارد:</strong>
              <span style="direction: ltr; display: inline-block; font-weight: bold; color: #15803d; margin-right: 8px;">${result?.inboundVoucherNumber || "تم الإنشاء"}</span>
            </div>
            <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 10px 14px; margin-bottom: 8px;">
              <strong style="color: #9f1239;">📤 إذن صرف:</strong>
              <span style="direction: ltr; display: inline-block; font-weight: bold; color: #be123c; margin-right: 8px;">${result?.outboundVoucherNumber || "تم الإنشاء"}</span>
            </div>
            <p style="color: #64748b; font-size: 0.82rem; margin-top: 10px;">
              عدد الأصناف: <b>${result?.itemsCount || validItems.length}</b> أصناف | تم استلامها وصرفها فوراً للعميل.
            </p>
          </div>
        `,
        confirmButtonText: "تمام، متابعة",
        confirmButtonColor: "#4f46e5",
        customClass: {
          popup: "rounded-2xl shadow-2xl",
          confirmButton: "rounded-xl font-bold px-6 py-2.5",
        },
      });

      onClose();
      onSuccess?.(result);
    } catch (err) {
      console.error("خطأ في تسجيل الحركة السريعة:", err);
      setApiError(err.message || "حدث خطأ غير متوقع أثناء تسجيل الحركة السريعة بالخادم.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProductIds = items.filter((it) => it.productId).map((it) => it.productId);

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-indigo-200/60 shadow-2xl w-full max-w-3xl max-h-[calc(100dvh-2rem)] sm:max-h-[92dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-right">
        
        {/* رأس النافذة المميز بستايل Gradient والبرق */}
        <div className="relative px-6 py-4.5 bg-gradient-to-r from-violet-700 via-indigo-600 to-amber-600 text-white shrink-0 overflow-hidden shadow-sm">
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 right-1/4 w-32 h-32 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
                <Zap className="w-6 h-6 text-amber-300 fill-amber-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                    حركة سريعة (وارد وصرف فوري)
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-2xs font-extrabold bg-amber-400 text-amber-950 uppercase shadow-xs">
                    Cross-Docking ⚡
                  </span>
                </div>
                <p className="text-xs text-white/80 font-medium mt-0.5">
                  تسجيل إذن وارد واستلام البضاعة ثم صرفها فوراً للعميل في حركة واحدة وتحديث الأرصدة تلقائياً
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* محتوى الفورم القابل للتمرير */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
          
          {apiError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-semibold leading-relaxed">{apiError}</div>
            </div>
          )}

          {/* سطر التاريخ والملاحظات السريعة */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div>
              <label className="block text-2xs font-bold text-slate-700 mb-1">
                تاريخ الحركة *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={submitting}
                  className="w-full pl-3 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-semibold text-slate-800 transition-all outline-hidden"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-2xs font-bold text-slate-700 mb-1">
                ملاحظات عامة مشتركة (اختياري)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={submitting}
                  placeholder="مثال: تسليم مباشر بالسيارة / طلب عاجل للعميل..."
                  className="w-full pl-3 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-semibold text-slate-800 transition-all outline-hidden"
                />
                <FileText className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* بطاقتان متجاورتان: أ. الوارد (الاستلام) | ب. المنصرف (التسليم) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* 1. كارت بيانات الوارد والمصدر */}
            <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <ArrowDownToLine className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-emerald-950">
                    أولاً: بيانات الوارد (الاستلام)
                  </h3>
                </div>
                <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  إذن وارد IN
                </span>
              </div>

              {/* اختيار مصدر الوارد */}
              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">
                  مصدر ورود البضاعة *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInboundSource(VOUCHER_SOURCE.PRODUCTION)}
                    disabled={submitting}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      inboundSource === VOUCHER_SOURCE.PRODUCTION
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    صالة الإنتاج والتجليد
                  </button>

                  <button
                    type="button"
                    onClick={() => setInboundSource(VOUCHER_SOURCE.EXTERNAL)}
                    disabled={submitting}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      inboundSource === VOUCHER_SOURCE.EXTERNAL
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    مورد / جهة خارجية
                  </button>
                </div>
              </div>

              {/* اسم المورد الخارجي */}
              {isExternalInbound && (
                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1">
                    اسم المورد أو الشركة المورّدة *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={inboundPartyName}
                      onChange={(e) => setInboundPartyName(e.target.value)}
                      disabled={submitting}
                      placeholder="اسم المورد أو المصنع الخارجي..."
                      className={`w-full pl-3 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border rounded-xl text-xs font-semibold text-slate-800 transition-all outline-hidden ${
                        errors.inboundPartyName ? "border-rose-400 bg-rose-50/40" : "border-slate-200 focus:border-emerald-500"
                      }`}
                    />
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.inboundPartyName && (
                    <p className="text-2xs font-bold text-rose-600 mt-1">{errors.inboundPartyName}</p>
                  )}
                </div>
              )}

              {/* السائق / مُسلّم الوارد */}
              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">
                  اسم السائق أو مندوب التسليم (مُسلّم الوارد) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inboundDelivererName}
                    onChange={(e) => setInboundDelivererName(e.target.value)}
                    disabled={submitting}
                    placeholder="اسم السائق أو المشرف الذي أحضر البضاعة..."
                    className={`w-full pl-3 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border rounded-xl text-xs font-semibold text-slate-800 transition-all outline-hidden ${
                      errors.inboundDelivererName ? "border-rose-400 bg-rose-50/40" : "border-slate-200 focus:border-emerald-500"
                    }`}
                  />
                  <Truck className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.inboundDelivererName && (
                  <p className="text-2xs font-bold text-rose-600 mt-1">{errors.inboundDelivererName}</p>
                )}
              </div>

              {/* أمين المخزن المستلم */}
              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">
                  اسم أمين المخزن المستلم (المستلم) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inboundReceiverName}
                    onChange={(e) => setInboundReceiverName(e.target.value)}
                    disabled={submitting}
                    placeholder="اسم أمين المخزن المسؤول..."
                    className={`w-full pl-3 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border rounded-xl text-xs font-semibold text-slate-800 transition-all outline-hidden ${
                      errors.inboundReceiverName ? "border-rose-400 bg-rose-50/40" : "border-slate-200 focus:border-emerald-500"
                    }`}
                  />
                  <User className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.inboundReceiverName && (
                  <p className="text-2xs font-bold text-rose-600 mt-1">{errors.inboundReceiverName}</p>
                )}
              </div>
            </div>

            {/* 2. كارت بيانات الصرف والعميل */}
            <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                    <ArrowUpFromLine className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-rose-950">
                    ثانياً: بيانات الصرف (العميل)
                  </h3>
                </div>
                <span className="text-2xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                  إذن منصرف OUT
                </span>
              </div>

              {/* اسم العميل */}
              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">
                  اسم العميل أو الجهة المستلمة *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={outboundPartyName}
                    onChange={(e) => setOutboundPartyName(e.target.value)}
                    disabled={submitting}
                    placeholder="اسم التاجر، المكتبة، أو العميل..."
                    className={`w-full pl-3 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border rounded-xl text-xs font-semibold text-slate-800 transition-all outline-hidden ${
                      errors.outboundPartyName ? "border-rose-400 bg-rose-50/40" : "border-slate-200 focus:border-rose-500"
                    }`}
                  />
                  <Building2 className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.outboundPartyName && (
                  <p className="text-2xs font-bold text-rose-600 mt-1">{errors.outboundPartyName}</p>
                )}
              </div>

              {/* المستلم الفعلي / مندوب العميل */}
              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">
                  اسم المستلم الفعلي / مندوب العميل *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={outboundReceiverName}
                    onChange={(e) => setOutboundReceiverName(e.target.value)}
                    disabled={submitting}
                    placeholder="اسم الشخص المستلم للبضاعة فعلياً..."
                    className={`w-full pl-3 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border rounded-xl text-xs font-semibold text-slate-800 transition-all outline-hidden ${
                      errors.outboundReceiverName ? "border-rose-400 bg-rose-50/40" : "border-slate-200 focus:border-rose-500"
                    }`}
                  />
                  <User className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.outboundReceiverName && (
                  <p className="text-2xs font-bold text-rose-600 mt-1">{errors.outboundReceiverName}</p>
                )}
              </div>

              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 flex items-start gap-2.5 text-amber-900 text-2xs leading-relaxed">
                <ArrowRightLeft className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  سيتم تسليم البضاعة فور استلامها مباشرة وتوثيق اسم أمين المخزن كمسلّم للصرف تلقائياً.
                </div>
              </div>
            </div>

          </div>

          {/* 3. كارت الأصناف والكميات المحمولة */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-indigo-100 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    أصناف وكميات الحركة السريعة
                  </h3>
                  <p className="text-2xs text-slate-400">
                    حدد الأصناف والكميات التي تم استلامها وصرفها في هذه الحركة
                  </p>
                </div>
              </div>

              {/* أزرار الإضافة المتقدمة والإضافة العادية */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 rounded-xl transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>الإضافة المتقدمة للأصناف</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة صنف</span>
                </button>
              </div>
            </div>

            {errors.items && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-2xs font-bold flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{errors.items}</span>
              </div>
            )}

            {/* سطور الأصناف */}
            <div className="space-y-2.5">
              {items.map((item, index) => {
                const prod = item.product;
                const isCopyPaper = prod?.entryUnit === 2; // ورق تصوير

                return (
                  <div
                    key={index}
                    className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200/70 transition-all flex flex-col md:flex-row items-stretch md:items-center gap-3"
                  >
                    <div className="flex-1 min-w-[220px]">
                      <label className="block text-2xs font-bold text-slate-500 mb-1">
                        الصنف #{index + 1}
                      </label>
                      <ProductCombobox
                        value={item.productId}
                        onChange={(selectedProd) => handleProductSelect(index, selectedProd)}
                        disabled={submitting}
                        notebooksOnly={inboundSource === VOUCHER_SOURCE.PRODUCTION}
                        placeholder="ابحث واختر الصنف..."
                      />
                    </div>

                    {/* خيار الوحدة في حال كان الصنف ورق تصوير */}
                    {isCopyPaper && (
                      <div className="w-full md:w-36">
                        <label className="block text-2xs font-bold text-slate-500 mb-1">
                          الوحدة المحددة
                        </label>
                        <UnitSelect
                          value={item.entryUnit || prod?.entryUnit || 2}
                          onChange={(e) => handleUnitChange(index, e.target.value)}
                          disabled={submitting}
                          isCopyPaper={true}
                        />
                      </div>
                    )}

                    <div className="w-full md:w-36">
                      <label className="block text-2xs font-bold text-slate-500 mb-1">
                        الكمية ({prod ? (isCopyPaper ? (item.entryUnit === 2 ? "كرتونة" : "رزمة") : prod.entryUnitLabel) : "الوحدة"})
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        disabled={submitting}
                        placeholder="الكمية..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-800 transition-all outline-hidden"
                      />
                    </div>

                    <div className="flex items-center justify-end md:self-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={submitting || items.length === 1}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        title="حذف هذا الصنف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* إجمالي الأصناف المضافة */}
            <div className="flex items-center justify-between pt-2 text-2xs text-slate-500 font-semibold">
              <span>إجمالي بنود الحركة: {validItems.length} صنف</span>
              {inboundSource === VOUCHER_SOURCE.PRODUCTION && (
                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold">
                  ⚠️ توريد صالة الإنتاج مخصص للكشاكيل والكراريس فقط
                </span>
              )}
            </div>
          </div>

        </form>

        {/* ذيل النافذة والأزرار */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between shrink-0 shadow-lg">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            إلغاء التراجع
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-amber-600 hover:from-violet-700 hover:via-indigo-700 hover:to-amber-700 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري تسجيل الحركة المزدوجة...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>تسجيل الحركة السريعة (وارد + منصرف فوري)</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* نافذة الإضافة المتقدمة للأصناف */}
      {isPickerOpen && (
        <AdvancedProductPickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          selectedProductIds={selectedProductIds}
          onToggleProduct={handleToggleProductFromPicker}
          notebooksOnly={inboundSource === VOUCHER_SOURCE.PRODUCTION}
          isOutbound={false}
        />
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}
