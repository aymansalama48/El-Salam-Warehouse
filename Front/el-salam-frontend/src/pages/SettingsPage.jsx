import { useState, useEffect, useRef } from "react";
import { 
  Building2, 
  UploadCloud, 
  Image as ImageIcon, 
  Check, 
  AlertCircle, 
  Save, 
  RefreshCw, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  Sparkles,
  Loader2,
  FileCheck
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { showSuccess, showError } from "../utils/alertUtils";

export function SettingsPage() {
  const { settings, loading, updateSettings, uploadLogo, refreshSettings } = useSettings();

  // نموذج الحقول النصية
  const [formData, setFormData] = useState({
    warehouseName: "",
    subtitle: "",
    phoneNumber: "",
    contactEmail: "",
    address: "",
  });

  const [savingText, setSavingText] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // ملف الشعار المختار للمعاينة والرفع
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // تحميل البيانات الأولية
  useEffect(() => {
    if (settings) {
      setFormData({
        warehouseName: settings.warehouseName || "",
        subtitle: settings.subtitle || "",
        phoneNumber: settings.phoneNumber || "",
        contactEmail: settings.contactEmail || "",
        address: settings.address || "",
      });
    }
  }, [settings]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // اختيار ملف الشعار وقراءته فورياً عبر FileReader كـ Data URL للمعاينة بدون أخطاء روابط الـ Blob
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".png") && file.type !== "image/png") {
      showError("صيغة غير مدعومة", "شعار المنشأة يجب أن يكون بصيغة PNG حصراً لدعم الشفافية ودقة التقارير.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("حجم الملف كبير", "الحد الأقصى المسموح به لحجم الشعار هو 5 ميجابايت.");
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target.result);
    };
    reader.onerror = () => {
      showError("تعذر قراءة الملف", "حدث خطأ أثناء قراءة ملف الصورة محلياً للمعاينة.");
    };
    reader.readAsDataURL(file);
  };

  // رفع الشعار
  const handleUploadLogo = async () => {
    if (!selectedFile) return;

    setUploadingLogo(true);
    try {
      await uploadLogo(selectedFile);
      showSuccess("تم تحديث الشعار بنجاح", "تم حفظ وتطبيق شعار المنشأة الجديد في النظام وكافة تقارير الـ PDF.");
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("فشل في رفع الشعار:", err);
      showError("تعذر رفع الشعار", err.message || "حدث خطأ أثناء رفع ملف الشعار إلى الخادم.");
    } finally {
      setUploadingLogo(false);
    }
  };

  // حفظ بيانات المنشأة النصية
  const handleSaveTextSettings = async (e) => {
    e.preventDefault();
    if (!formData.warehouseName.trim()) {
      showError("بيانات ناقصة", "يرجى كتابة اسم المصنع / المنشأة.");
      return;
    }

    setSavingText(true);
    try {
      await updateSettings({
        warehouseName: formData.warehouseName.trim(),
        subtitle: formData.subtitle.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        contactEmail: formData.contactEmail.trim(),
        address: formData.address.trim(),
      });
      showSuccess("تم حفظ الإعدادات", "تم تحديث اسم وبيانات المنشأة وتطبيقها في كامل واجهات النظام والتقارير.");
    } catch (err) {
      console.error("فشل في حفظ الإعدادات:", err);
      showError("تعذر حفظ الإعدادات", err.message || "حدث خطأ أثناء إرسال البيانات إلى الخادم.");
    } finally {
      setSavingText(false);
    }
  };

  const currentDisplayLogo = previewUrl || settings?.logoUrl;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-200 text-right">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                إعدادات المنشأة والشعار الرسمي
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                تخصيص اسم المصنع والنشاط وشعار الـ PNG وتضمينهم تلقائياً في السندات وتقارير الـ PDF
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={refreshSettings}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          title="تحديث البيانات من السيرفر"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          تحديث الإعدادات
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* العمود الأيمن: الشعار والاسم (الأهم للمستخدم) */}
        <div className="lg:col-span-5 space-y-6">
          {/* كارت الشعار الرسمي */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <h2 className="font-bold text-slate-800 text-sm">شعار المنشأة (Logo PNG)</h2>
              </div>
              <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                PNG بدقة عالية
              </span>
            </div>

            <div className="p-5 space-y-5">
              {/* صندوق استعراض الشعار الحالي */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 relative group">
                {currentDisplayLogo ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-32 h-32 rounded-2xl bg-white p-3 shadow-md border border-slate-200/80 flex items-center justify-center overflow-hidden">
                      <img
                        src={currentDisplayLogo}
                        alt="شعار المنشأة"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    {previewUrl && (
                      <span className="text-2xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                        معاينة الشعار الجديد قبل الرفع
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-200/80 text-slate-400 flex items-center justify-center mx-auto mb-2">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <p className="text-xs font-semibold text-slate-600">لا يوجد شعار مخصص حالياً</p>
                    <p className="text-2xs text-slate-400 mt-0.5">يتم استخدام الشعار الافتراضي للنظام</p>
                  </div>
                )}
              </div>

              {/* أزرار اختيار ورفع الشعار */}
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".png,image/png"
                  className="hidden"
                  id="logo-file-input"
                />

                <div className="flex items-center gap-2">
                  <label
                    htmlFor="logo-file-input"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-slate-600" />
                    <span>{selectedFile ? "تغيير الملف المحدد" : "اختيار ملف PNG"}</span>
                  </label>

                  {selectedFile && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="px-3.5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                        title="إلغاء الملف المحدد"
                      >
                        إلغاء
                      </button>

                      <button
                        type="button"
                        onClick={handleUploadLogo}
                        disabled={uploadingLogo}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {uploadingLogo ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>جاري الرفع...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>تأكيد وحفظ الشعار</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2 text-2xs text-amber-800">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>ملاحظة مهمة:</strong> يُشترط أن يكون ملف الشعار بصيغة <strong>PNG</strong> وبخلفية شفافة حتى يظهر بشكل أنيق واحترافي في ترويسات تقارير الـ PDF وأعلى القائمة الجانبية.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* بطاقة المعاينة في تقارير PDF */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>معاينة حية في ترويسة تقارير الـ PDF</span>
            </div>
            <p className="text-2xs text-slate-500">
              هذا الشكل النموذجي الذي سيظهر في رأس جميع أذونات الصرف والوارد وكشوف دفتر اليومية والجرد الصادرة من السيرفر:
            </p>

            {/* محاكاة رأس ورقة التقرير */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3 text-right">
              <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center p-1 overflow-hidden shrink-0">
                    {currentDisplayLogo ? (
                      <img src={currentDisplayLogo} alt="شعار" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                      {formData.warehouseName || "مصنع السلام"}
                    </h3>
                    <p className="text-3xs text-slate-500 font-medium mt-0.5">
                      {formData.subtitle || "للكراسات والحلول الورقية"}
                    </p>
                    <p className="text-2xs font-bold text-blue-700 mt-1">
                      إذن استلام وارد / سند صرف مخزني رسمي
                    </p>
                  </div>
                </div>

                <div className="text-left text-3xs text-slate-400 font-mono">
                  <span>تاريخ الطباعة</span>
                  <br />
                  <span>2026/11/06 15:30</span>
                </div>
              </div>
              <div className="h-1 bg-blue-800 rounded-full" />
            </div>
          </div>
        </div>

        {/* العمود الأيسر: بيانات المنشأة النصية */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSaveTextSettings} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-slate-800 text-sm">بيانات وهوية المنشأة</h2>
              </div>
              <span className="text-2xs text-slate-400 font-medium">
                تظهر في كافة الشاشات والتقارير
              </span>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {/* اسم المنشأة */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم المصنع / المنشأة <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="warehouseName"
                    value={formData.warehouseName}
                    onChange={handleInputChange}
                    placeholder="مثال: مصنع السلام"
                    className="w-full pl-4 pr-10 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-hidden"
                    required
                  />
                  <Building2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
                <p className="text-2xs text-slate-400 mt-1">
                  الاسم الأساسي الذي يظهر في أعلى القائمة الجانبية والشريط العلوي وعنوان صفحة المتصفح.
                </p>
              </div>

              {/* الوصف والنشاط */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الوصف أو الشعار الفرعي (النشاط)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    placeholder="مثال: للكراسات والحلول الورقية"
                    className="w-full pl-4 pr-10 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-hidden"
                  />
                  <Sparkles className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
                <p className="text-2xs text-slate-400 mt-1">
                  النص الثانوي التوضيحي الذي يظهر تحت اسم المصنع في القائمة والتقارير.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* رقم الهاتف */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    رقم هاتف التواصل
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="01012345678"
                      className="w-full pl-4 pr-10 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-hidden"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  </div>
                </div>

                {/* البريد الإلكتروني */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    البريد الإلكتروني الرسمي
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      placeholder="info@elsalamwarehouse.com"
                      className="w-full pl-4 pr-10 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-hidden"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  </div>
                </div>
              </div>

              {/* العنوان */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  عنوان المستودع أو المصنع الرئيسي
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="مثال: المنطقة الصناعية - المستودع المركزي"
                    className="w-full pl-4 pr-10 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-hidden"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>

              {/* زر الحفظ */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={savingText}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingText ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري حفظ البيانات...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>حفظ بيانات المنشأة</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;

