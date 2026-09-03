import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSiteSettings } from "../lib/api.js";
import { defaultLocationHierarchy } from "../lib/locationHierarchyText.js";
import { setLocationHierarchy } from "../lib/locationCoverage.js";
import { defaultSiteSettings, getPalette, mergeSettings } from "../lib/siteTheme.js";

const SiteSettingsContext = createContext(null);
const settingsCacheKey = "kerea-site-settings-cache-v1";

const loadCachedSettings = () => {
  if (typeof window === "undefined") {
    return defaultSiteSettings;
  }

  try {
    const cached = window.localStorage.getItem(settingsCacheKey);
    return cached ? mergeSettings(defaultSiteSettings, JSON.parse(cached)) : defaultSiteSettings;
  } catch {
    return defaultSiteSettings;
  }
};

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettingsState] = useState(loadCachedSettings);
  const [loading, setLoading] = useState(true);
  const setSettings = (nextSettings) => {
    const resolvedSettings = mergeSettings(defaultSiteSettings, nextSettings || {});
    setSettingsState(resolvedSettings);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(settingsCacheKey, JSON.stringify(resolvedSettings));
    }
  };

  const refreshSettings = async () => {
    try {
      const data = await getSiteSettings();
      setSettings(data.settings || {});
    } catch {
      setSettings(settings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  useEffect(() => {
    setLocationHierarchy(settings.locationHierarchy || defaultLocationHierarchy);
  }, [settings]);

  useEffect(() => {
    const browserTitle = settings.branding?.browserTitle || settings.brandName || defaultSiteSettings.branding.browserTitle;
    const faviconUrl = settings.branding?.faviconUrl || settings.branding?.logoUrl || "";

    document.title = browserTitle;

    if (!faviconUrl) {
      return;
    }

    let link = document.querySelector("link[rel='icon']");

    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "icon");
      document.head.appendChild(link);
    }

    link.setAttribute("href", faviconUrl);
  }, [settings]);

  const palette = useMemo(() => getPalette(settings), [settings]);

  const value = useMemo(
    () => ({
      settings,
      setSettings,
      refreshSettings,
      palette,
      loading
    }),
    [loading, palette, settings]
  );

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);

  if (!context) {
    throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  }

  return context;
};
