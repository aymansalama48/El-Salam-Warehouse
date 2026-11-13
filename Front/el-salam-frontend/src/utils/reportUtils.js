/**
 * أدوات مساعدة لتنزيل ومعاينة تقارير الـ PDF وحساب فترات التقرير
 */

/**
 * فتح ملف الـ PDF للمعاينة في نافذة جديدة وتنزيله باسم مخصص
 * @param {Blob} blob - كائن الـ Blob الخاص بالـ PDF
 * @param {string} fileName - الاسم الافتراضي للملف
 */
export function handlePdfDownloadAndPreview(blob, fileName = "تقرير.pdf") {
  if (!blob) return;

  // التأكد من أن الـ Blob من نوع application/pdf
  const pdfBlob = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(pdfBlob);

  // 1) تنزيل الملف بالاسم المخصص
  try {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error("فشل في تنزيل ملف الـ PDF:", err);
  }

  // 2) فتح في تاب جديد للمعاينة والطباعة المباشرة
  try {
    window.open(blobUrl, "_blank");
  } catch (err) {
    console.warn("المتصفح منع فتح نافذة المعاينة التلقائية:", err);
  }

  // 3) تحرير الرابط بعد فترة كافية
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 60000);
}

/**
 * اختصارات التواريخ الشائعة للتقارير بصيغة YYYY-MM-DD
 */
export function getReportDateShortcuts() {
  const now = new Date();
  const format = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const today = format(now);

  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = format(yesterdayDate);

  const sevenDaysAgoDate = new Date(now);
  sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 6);
  const sevenDaysAgo = format(sevenDaysAgoDate);

  const firstDayOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayOfMonth = format(firstDayOfMonthDate);

  return {
    today: { label: "اليوم", fromDate: today, toDate: today },
    yesterday: { label: "أمس", fromDate: yesterday, toDate: yesterday },
    last7Days: { label: "آخر 7 أيام", fromDate: sevenDaysAgo, toDate: today },
    thisMonth: { label: "هذا الشهر", fromDate: firstDayOfMonth, toDate: today },
  };
}

/**
 * حساب الفرق بالأيام بين تاريخين بصيغة YYYY-MM-DD
 */
export function getDaysDifference(fromDateStr, toDateStr) {
  if (!fromDateStr || !toDateStr) return 0;
  const from = new Date(fromDateStr);
  const to = new Date(toDateStr);
  const diffTime = to.getTime() - from.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

