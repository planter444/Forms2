import { useEffect, useState } from "react";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

const AnimatedPatternBackground = () => {
  const { settings, palette } = useSiteSettings();
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = (event) => setIsMobile(event.matches);

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const backgroundStyle = isMobile
    ? settings.theme.mobileBackgroundStyle || settings.theme.backgroundStyle
    : settings.theme.desktopBackgroundStyle || settings.theme.backgroundStyle;
  const pattern = isMobile ? settings.theme.mobilePattern || settings.theme.pattern : settings.theme.desktopPattern || settings.theme.pattern;
  const patternsEnabled = isMobile
    ? settings.theme.mobilePatternsEnabled ?? settings.theme.patternsEnabled
    : settings.theme.desktopPatternsEnabled ?? settings.theme.patternsEnabled;
  const patternMotion = isMobile
    ? settings.theme.mobilePatternMotion ?? settings.theme.patternMotion
    : settings.theme.desktopPatternMotion ?? settings.theme.patternMotion;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className={`absolute inset-0 pattern-surface pattern-surface-${backgroundStyle}`}
        style={{
          "--pattern-primary": palette.primary,
          "--pattern-primary-deep": palette.primaryDeep,
          "--pattern-primary-soft": palette.primarySoft,
          "--pattern-primary-glow": palette.primaryGlow,
          "--surface-page": palette.pageBackground,
          "--surface-page-alt": palette.pageBackgroundAlt,
          "--surface-muted": palette.surfaceMuted
        }}
      />
      {patternsEnabled ? (
        <div
          className={`absolute inset-0 pattern-layer pattern-${pattern} ${
            patternMotion ? "pattern-animate" : ""
          }`}
          style={{
            "--pattern-primary": palette.primary,
            "--pattern-primary-deep": palette.primaryDeep,
            "--pattern-primary-soft": palette.primarySoft,
            "--pattern-primary-glow": palette.primaryGlow
          }}
        />
      ) : null}
    </div>
  );
};

export default AnimatedPatternBackground;
