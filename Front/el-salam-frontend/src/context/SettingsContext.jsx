import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSettings, updateSettings as apiUpdateSettings, uploadLogo as apiUploadLogo } from "../features/settings/services/settingsService";

const defaultSettings = {
  warehouseName: "مصنع السلام",
  subtitle: "للكراسات والحلول الورقية",
  logoUrl: null,
  contactEmail: "contact@elsalamwarehouse.com",
  phoneNumber: "01012345678",
  address: "المستودع الرئيسي - مصنع السلام",
  currency: "EGP",
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      if (data) {
        setSettings((prev) => ({
          ...prev,
          ...data,
          warehouseName: data.warehouseName || data.WarehouseName || prev.warehouseName,
          subtitle: data.subtitle || data.Subtitle || prev.subtitle,
          logoUrl: data.logoUrl || data.LogoUrl || prev.logoUrl,
          contactEmail: data.contactEmail || data.ContactEmail || prev.contactEmail,
          phoneNumber: data.phoneNumber || data.PhoneNumber || prev.phoneNumber,
          address: data.address || data.Address || prev.address,
          currency: data.currency || data.Currency || prev.currency,
        }));
      }
    } catch (err) {
      console.warn("تعذر جلب إعدادات المنشأة من الخادم، سيتم استخدام الإعدادات الافتراضية:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // تحديث عنوان التبويب في المتصفح تلقائياً
  useEffect(() => {
    if (settings.warehouseName) {
      document.title = `${settings.warehouseName} | نظام إدارة المخازن`;
    }
  }, [settings.warehouseName]);

  const updateSettingsData = async (payload) => {
    const updated = await apiUpdateSettings(payload);
    if (updated) {
      setSettings((prev) => ({
        ...prev,
        ...updated,
      }));
    }
    return updated;
  };

  const updateLogoFile = async (file) => {
    const updated = await apiUploadLogo(file);
    if (updated) {
      setSettings((prev) => ({
        ...prev,
        ...updated,
      }));
    }
    return updated;
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings: fetchSettings,
        updateSettings: updateSettingsData,
        uploadLogo: updateLogoFile,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    return {
      settings: defaultSettings,
      loading: false,
      refreshSettings: () => {},
      updateSettings: async () => {},
      uploadLogo: async () => {},
    };
  }
  return context;
}

