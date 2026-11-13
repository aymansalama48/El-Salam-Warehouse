import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  XCircle, 
  RefreshCw,
  ExternalLink,
  Inbox
} from "lucide-react";
import { notificationService } from "../../features/notifications/services/notificationService";
import { formatArabicTimeAgo } from "../../utils/dateUtils";

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem("read_notification_ids");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // جلب الإشعارات الحية من الباك إند
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications(25);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("فشل في تحديث الإشعارات:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // التحميل المبدئي والاستماع لتغييرات الأذونات
  useEffect(() => {
    fetchNotifications();

    const handleDataChanged = () => {
      fetchNotifications();
    };

    window.addEventListener("vouchers:changed", handleDataChanged);
    window.addEventListener("permissions:updated", handleDataChanged);

    // تحديث دوري كل دقيقة في الخلفية
    const interval = setInterval(fetchNotifications, 60000);

    return () => {
      window.removeEventListener("vouchers:changed", handleDataChanged);
      window.removeEventListener("permissions:updated", handleDataChanged);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // إغلاق الدروب داون عند النقر خارجها
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // حفظ المعرفات المقروءة في localStorage
  const saveReadIds = (newIds) => {
    setReadIds(newIds);
    try {
      localStorage.setItem("read_notification_ids", JSON.stringify(newIds));
    } catch (e) {
      console.warn("تعذر تخزين حالة قراءة الإشعارات:", e);
    }
  };

  // عدد الإشعارات غير المقروءة
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readIds.includes(n.id)).length;
  }, [notifications, readIds]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  // تحديد الكل كمقروء
  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    const allIds = notifications.map((n) => n.id);
    const combined = Array.from(new Set([...readIds, ...allIds]));
    saveReadIds(combined);
  };

  // عند الضغط على إشعار معين
  const handleNotificationClick = (item) => {
    if (!readIds.includes(item.id)) {
      saveReadIds([...readIds, item.id]);
    }
    setIsOpen(false);
    if (item.linkUrl) {
      navigate(item.linkUrl);
    }
  };

  // أيقونة وتنسيق نوع الإشعار
  const getNotificationVisuals = (type) => {
    switch (type) {
      case "danger":
        return {
          icon: AlertCircle,
          badgeBg: "bg-rose-50 text-rose-600 border border-rose-200",
          cardBorder: "border-r-4 border-r-rose-500",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          badgeBg: "bg-amber-50 text-amber-600 border border-amber-200",
          cardBorder: "border-r-4 border-r-amber-500",
        };
      case "inbound":
        return {
          icon: ArrowDownToLine,
          badgeBg: "bg-emerald-50 text-emerald-600 border border-emerald-200",
          cardBorder: "border-r-4 border-r-emerald-500",
        };
      case "outbound":
        return {
          icon: ArrowUpFromLine,
          badgeBg: "bg-blue-50 text-blue-600 border border-blue-200",
          cardBorder: "border-r-4 border-r-blue-500",
        };
      case "cancelled":
        return {
          icon: XCircle,
          badgeBg: "bg-slate-100 text-slate-500 border border-slate-200",
          cardBorder: "border-r-4 border-r-slate-400",
        };
      default:
        return {
          icon: Bell,
          badgeBg: "bg-slate-100 text-slate-600 border border-slate-200",
          cardBorder: "border-r-4 border-r-slate-300",
        };
    }
  };

  return (
    <div className="relative" ref={dropdownRef} dir="rtl">
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        title="الإشعارات وتنبيهات المستودع"
        className={`relative p-2 rounded-xl transition-all duration-150 cursor-pointer ${
          isOpen
            ? "bg-blue-50 text-blue-600 ring-2 ring-blue-100"
            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-2 border-white"></span>
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute left-0 mt-2.5 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border border-slate-200/80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 text-right"
          style={{ transformOrigin: "top left" }}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                إشعارات وتنبيهات المخزن
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-blue-100 text-blue-800 shrink-0">
                  {unreadCount} جديد
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  title="تحديد كافة التنبيهات كمقروءة"
                  className="text-3xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">تحديد الكل كمقروء</span>
                </button>
              )}
              <button
                type="button"
                onClick={fetchNotifications}
                title="تحديث الإشعارات الآن"
                className={`p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer ${
                  loading ? "animate-spin text-blue-600" : ""
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[22rem] overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-blue-500" />
                <p className="font-bold">جاري تحميل إشعارات المستودع...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-600">لا توجد تنبيهات حالياً</p>
                <p className="text-3xs text-slate-400 mt-1">
                  المستودع مستقر ولا توجد حركات حديثة أو نواقص تتطلب الانتباه
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isUnread = !readIds.includes(item.id);
                const { icon: IconComp, badgeBg, cardBorder } = getNotificationVisuals(item.type);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-right ${cardBorder} ${
                      isUnread ? "bg-blue-50/25" : "bg-white opacity-85 hover:opacity-100"
                    }`}
                  >
                    {/* Icon Badge */}
                    <div className={`p-2 rounded-xl shrink-0 shadow-2xs ${badgeBg}`}>
                      <IconComp className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <p
                          className={`text-xs truncate ${
                            isUnread ? "font-bold text-slate-900" : "font-semibold text-slate-700"
                          }`}
                        >
                          {item.title}
                        </p>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                        )}
                      </div>

                      <p className="text-2xs text-slate-500 mt-1 line-clamp-2 leading-relaxed font-normal">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 text-3xs text-slate-400">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatArabicTimeAgo(item.occurredAtUtc)}</span>
                        </span>

                        {item.linkUrl && (
                          <span className="text-blue-600 font-bold flex items-center gap-0.5 hover:underline">
                            <span>عرض التفاصيل</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50/70 border-t border-slate-100 text-center flex items-center justify-between px-4">
            <span className="text-3xs text-slate-400 font-medium">
              تنبيهات فورية متصلة بقاعدة البيانات
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate("/daybook");
              }}
              className="text-2xs font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              عرض دفتر اليومية
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsDropdown;
