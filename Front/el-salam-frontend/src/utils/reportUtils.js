/**
 * أدوات مساعدة لتنزيل ومعاينة تقارير الـ PDF وحساب فترات التقرير
 */

/**
 * فتح نافذة جديدة مسبقاً بشكل متزامن مع نقرة المستخدم لتفادي حظر النوافذ المنبثقة (Popup Blocker)
 * @param {string} title - عنوان صفحة المعاينة أثناء التحميل
 * @returns {Window|null}
 */
export function createPendingPdfWindow(title = "جاري تجهيز التقرير...") {
  try {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
          <head>
            <meta charset="utf-8" />
            <title>${title}</title>
            <style>
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: #f8fafc;
                color: #0f172a;
              }
              .box {
                text-align: center;
                padding: 32px 40px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 4px 20px -2px rgba(0,0,0,0.06);
                border: 1px solid #e2e8f0;
              }
              .spinner {
                width: 36px;
                height: 36px;
                border: 3px solid #e2e8f0;
                border-top-color: #2563eb;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin: 0 auto 16px;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
              h3 { margin: 0 0 8px; font-size: 18px; color: #1e293b; }
              p { margin: 0; font-size: 13px; color: #64748b; }
            </style>
          </head>
          <body>
            <div class="box">
              <div class="spinner"></div>
              <h3>جاري إعداد وتوليد التقرير (PDF)...</h3>
              <p>سيتم فتح التقرير للمعاينة والطباعة والبدء في التحميل تلقائياً.</p>
            </div>
          </body>
        </html>
      `);
      win.document.close();
    }
    return win;
  } catch (err) {
    console.warn("تعذر فتح نافذة المعاينة المسبقة:", err);
    return null;
  }
}

/**
 * فتح ملف الـ PDF للمعاينة والطباعة في المتصفح وتنزيله باسم مخصص
 * @param {Blob} blob - كائن الـ Blob الخاص بالـ PDF
 * @param {string} fileName - الاسم الافتراضي للملف
 * @param {Window|null} targetWindow - نافذة المعاينة المفتوحة مسبقاً (اختياري)
 */
export function handlePdfDownloadAndPreview(blob, fileName = "تقرير.pdf", targetWindow = null) {
  if (!blob) {
    if (targetWindow && !targetWindow.closed) targetWindow.close();
    return;
  }

  // التأكد من أن الـ Blob من نوع application/pdf
  const pdfBlob = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(pdfBlob);

  // 1) فتح التقرير في المتصفح للمعاينة والطباعة أولاً
  let tabOpened = false;
  if (targetWindow && !targetWindow.closed) {
    try {
      targetWindow.location.href = blobUrl;
      tabOpened = true;
    } catch {
      // fallback إذا تعذر التوجيه المباشر
    }
  }

  if (!tabOpened) {
    try {
      const newWin = window.open(blobUrl, "_blank");
      if (newWin) tabOpened = true;
    } catch (err) {
      console.warn("المتصفح منع فتح نافذة المعاينة التلقائية:", err);
    }
  }

  // 2) تنزيل الملف بالاسم المخصص بعد إطلاق التاب بفارق زمني بسيط حتى لا يتعارض التنزيل مع نافذة المعاينة في المتصفح
  setTimeout(() => {
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
  }, 350);

  // 3) تحرير الرابط بعد فترة كافية (دقيقتين لضمان انتهاء العرض والتحميل)
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 120000);
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

