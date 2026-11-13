/**
 * دوال مساعدة للتعامل مع التواريخ وتوقيت القاهرة
 */

/**
 * تحليل التاريخ مع ضمان التعرف على توقيت UTC حتى لو أرسله الخادم بدون حرف Z
 * @param {string|Date} dateInput
 * @returns {Date|null}
 */
export function parseUtcDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
  if (typeof dateInput !== "string") return new Date(dateInput);

  let str = dateInput.trim();
  // إذا كانت السلسلة تحتوي على وقت ISO بدون Z وبدون إزاحة منطقة زمنية
  if (str.includes("T") && !str.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(str)) {
    str += "Z";
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * تحويل تاريخ ووقت UTC قادم من الخادم إلى توقيت القاهرة بصيغة منسقة
 * @param {string|Date} utcDateString 
 * @returns {string}
 */
export function formatCairoDateTime(utcDateString) {
  if (!utcDateString) return "—";
  try {
    const date = parseUtcDate(utcDateString);
    if (!date) return String(utcDateString);
    
    return new Intl.DateTimeFormat("ar-EG", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return String(utcDateString);
  }
}

/**
 * حساب الوقت النسبي بالعربي بدقة (منذ دقيقة / منذ ساعة...)
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatArabicTimeAgo(dateInput) {
  if (!dateInput) return "الآن";
  const date = parseUtcDate(dateInput);
  if (!date) return "الآن";

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  // إذا كان الفرق ثوانٍ بسيطة أو في المستقبل بسبب فرق التوقيت البسيط
  if (diffSec < 60) return "الآن";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return "منذ دقيقة";
  if (diffMin === 2) return "منذ دقيقتين";
  if (diffMin <= 10) return `منذ ${diffMin} دقائق`;
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return "منذ ساعة";
  if (diffHours === 2) return "منذ ساعتين";
  if (diffHours <= 10) return `منذ ${diffHours} ساعات`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "أمس";
  if (diffDays === 2) return "منذ يومين";
  if (diffDays <= 10) return `منذ ${diffDays} أيام`;
  if (diffDays < 30) return `منذ ${diffDays} يوماً`;

  return date.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
}

/**
 * تحويل تاريخ إلى صيغة مقروءة بتوقيت القاهرة
 * @param {string|Date} dateString 
 * @returns {string}
 */
export function formatCairoDate(dateString) {
  if (!dateString) return "—";
  try {
    const date = parseUtcDate(dateString);
    if (!date) return String(dateString);

    return new Intl.DateTimeFormat("ar-EG", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return String(dateString);
  }
}

/**
 * إرجاع تاريخ اليوم بصيغة yyyy-MM-dd
 * @returns {string}
 */
export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

