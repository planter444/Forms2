import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AnimatedPatternBackground from "../components/AnimatedPatternBackground.jsx";
import BrandLogo from "../components/BrandLogo.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

const desktopHomepageSizeClasses = {
  normal: {
    headerPadding: "lg:py-3",
    logoSize: "sm",
    headerCta: "lg:px-5 lg:py-2.5 lg:text-xs",
    heroSectionPadding: "lg:py-14",
    heroBadge: "lg:px-3 lg:py-1.5 lg:text-xs",
    heroDescription: "lg:max-w-xl lg:text-base lg:leading-7",
    heroButton: "lg:px-6 lg:py-4 lg:text-base",
    statCard: "lg:p-4",
    statValue: "lg:text-2xl",
    statLabel: "lg:text-xs",
    panel: "lg:p-6",
    innerPanel: "lg:p-5",
    panelHeading: "lg:text-xs",
    highlightCard: "lg:p-3",
    highlightDot: "lg:h-2 lg:w-2",
    highlightText: "lg:text-xs lg:leading-5",
    noteCard: "lg:mt-5 lg:p-4",
    noteTitle: "lg:text-xs",
    noteText: "lg:text-xs lg:leading-5",
    sectionPadding: "lg:py-12",
    eyebrow: "lg:text-xs",
    sectionTitle: "lg:text-2xl",
    stepCard: "lg:p-5",
    stepIcon: "lg:h-10 lg:w-10 lg:text-base",
    stepTitle: "lg:mt-4 lg:text-lg",
    stepBody: "lg:text-xs lg:leading-5"
  },
  large: {
    headerPadding: "lg:py-4",
    logoSize: "md",
    headerCta: "lg:px-6 lg:py-3 lg:text-sm",
    heroSectionPadding: "lg:py-20",
    heroBadge: "lg:px-4 lg:py-2 lg:text-sm",
    heroDescription: "lg:max-w-2xl lg:text-lg lg:leading-8",
    heroButton: "lg:px-8 lg:py-5 lg:text-lg",
    statCard: "lg:p-5",
    statValue: "lg:text-3xl",
    statLabel: "lg:text-sm",
    panel: "lg:p-8",
    innerPanel: "lg:p-6",
    panelHeading: "lg:text-sm",
    highlightCard: "lg:p-4",
    highlightDot: "lg:h-2.5 lg:w-2.5",
    highlightText: "lg:text-sm lg:leading-6",
    noteCard: "lg:mt-6 lg:p-5",
    noteTitle: "lg:text-sm",
    noteText: "lg:text-sm lg:leading-6",
    sectionPadding: "lg:py-14",
    eyebrow: "lg:text-sm",
    sectionTitle: "lg:text-3xl",
    stepCard: "lg:p-6",
    stepIcon: "lg:h-12 lg:w-12 lg:text-lg",
    stepTitle: "lg:mt-5 lg:text-xl",
    stepBody: "lg:text-sm lg:leading-6"
  },
  xl: {
    headerPadding: "lg:py-5",
    logoSize: "lg",
    headerCta: "lg:px-7 lg:py-3.5 lg:text-base",
    heroSectionPadding: "lg:py-24",
    heroBadge: "lg:px-5 lg:py-2.5 lg:text-base",
    heroDescription: "lg:max-w-2xl lg:text-xl lg:leading-9",
    heroButton: "lg:px-9 lg:py-6 lg:text-xl",
    statCard: "lg:p-6",
    statValue: "lg:text-4xl",
    statLabel: "lg:text-base",
    panel: "lg:p-9",
    innerPanel: "lg:p-7",
    panelHeading: "lg:text-base",
    highlightCard: "lg:p-5",
    highlightDot: "lg:h-3 lg:w-3",
    highlightText: "lg:text-base lg:leading-7",
    noteCard: "lg:mt-7 lg:p-6",
    noteTitle: "lg:text-base",
    noteText: "lg:text-base lg:leading-7",
    sectionPadding: "lg:py-16",
    eyebrow: "lg:text-base",
    sectionTitle: "lg:text-4xl",
    stepCard: "lg:p-7",
    stepIcon: "lg:h-14 lg:w-14 lg:text-xl",
    stepTitle: "lg:mt-6 lg:text-2xl",
    stepBody: "lg:text-base lg:leading-7"
  }
};

const legacyDesktopHomepageScale = {
  normal: 100,
  large: 115,
  xl: 135
};

const normalizeDesktopHomepageScale = (value, fallback = 115) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(180, Math.max(70, numericValue));
};

const normalizeDesktopHeroTitleFontSize = (value, fallback = 48) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(96, Math.max(24, numericValue));
};

const getDesktopHomepageSizeFromScale = (scale) => {
  if (scale >= 130) {
    return "xl";
  }

  if (scale >= 106) {
    return "large";
  }

  return "normal";
};

const getDeviceState = () =>
  typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false;

const normalizeMotion = (value) => {
  if (value === "wiggle") {
    return "shake";
  }

  if (value === "glow") {
    return "breathe";
  }

  return value;
};

const getMotionClass = (animation) =>
  ({
    pulse: "motion-pulse",
    float: "motion-float",
    shake: "motion-shake",
    breathe: "motion-breathe",
    rise: "motion-rise",
    stagger: "motion-stagger",
    none: ""
  })[animation] || "";

const LandingPage = () => {
  const { palette, settings } = useSiteSettings();
  const [isMobile, setIsMobile] = useState(getDeviceState);
  const splitLayout = settings.theme.heroLayout === "split";
  const ctaTraceEnabled = isMobile
    ? settings.theme.mobileCtaTrace ?? settings.theme.mobileCtaTraceEnabled
    : settings.theme.desktopCtaTrace ?? settings.theme.desktopCtaTraceEnabled;
  const ctaAnimation = isMobile
    ? settings.theme.mobileCtaAnimation || settings.theme.mobileCtaMotion
    : settings.theme.desktopCtaAnimation || settings.theme.desktopCtaMotion;
  const heroAnimation = isMobile
    ? settings.theme.mobileHeroAnimation || settings.theme.mobileBrandMotion
    : settings.theme.desktopHeroAnimation || settings.theme.desktopBrandMotion;
  const loadAnimation = isMobile
    ? settings.theme.mobileLoadAnimation || settings.theme.mobileSurfaceMotion
    : settings.theme.desktopLoadAnimation || settings.theme.desktopSurfaceMotion;
  const ctaMotionClass = getMotionClass(ctaAnimation);
  const heroCtaAnimation = settings.theme.heroCtaAnimation || "white-line";
  const heroCtaAnimationClass = heroCtaAnimation === "white-line" ? "hero-cta-border-trace" : getMotionClass(heroCtaAnimation);
  const heroMotionClass = getMotionClass(heroAnimation);
  const loadMotionClass = getMotionClass(loadAnimation);
  const ctaTraceClass = ctaTraceEnabled !== false ? "cta-trace" : "";
  const mobileHeaderSize = settings.theme.mobileHeaderSize || "large";
  const mobileHeaderClass = mobileHeaderSize === "xl" ? "py-7" : mobileHeaderSize === "compact" ? "py-4" : "py-6";
  const mobileLogoSize = mobileHeaderSize === "xl" ? "lg" : mobileHeaderSize === "compact" ? "sm" : "md";
  const desktopHomepageScale = normalizeDesktopHomepageScale(
    settings.theme.desktopHomepageScale,
    legacyDesktopHomepageScale[settings.theme.desktopHomepageSize] || 115
  );
  const desktopHomepageSize = getDesktopHomepageSizeFromScale(desktopHomepageScale);
  const desktopScaleBase = legacyDesktopHomepageScale[desktopHomepageSize] || 115;
  const desktopScaleStyle = isMobile
    ? undefined
    : {
        zoom: `${desktopHomepageScale / desktopScaleBase}`
      };
  const desktopClasses = desktopHomepageSizeClasses[desktopHomepageSize] || desktopHomepageSizeClasses.large;
  const desktopHeroTitleStyle = isMobile
    ? { color: palette.textColor }
    : {
        color: palette.textColor,
        fontSize: `${normalizeDesktopHeroTitleFontSize(settings.theme.desktopHeroTitleFontSize)}px`
      };
  const getOddCardClass = (length, index) =>
    length % 2 === 1 && index === length - 1
      ? "col-span-2 mx-auto w-full max-w-[18rem] min-[900px]:col-span-1 min-[900px]:max-w-none"
      : "";
  const getOddStatCardClass = (length, index) =>
    length % 2 === 1 && index === length - 1
      ? "col-span-2 mx-auto w-full max-w-[18rem] min-[900px]:col-span-1 min-[900px]:max-w-none"
      : "";
  const scrollToLearnMore = (event) => {
    event.preventDefault();
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", "#how-it-works");
  };

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

  const heroStats = useMemo(() => settings.heroStats || [], [settings.heroStats]);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: palette.pageBackground, color: palette.textColor }}>
      <AnimatedPatternBackground />

      <header className="relative z-10 border-b shadow-sm backdrop-blur-xl" style={{ borderColor: palette.borderColor, backgroundColor: palette.headerBackground }}>
        <div className={`mx-auto flex max-w-6xl items-center justify-center gap-3 px-4 ${mobileHeaderClass} sm:justify-between sm:gap-4 sm:px-6 sm:py-4 lg:px-8 ${desktopClasses.headerPadding}`} style={desktopScaleStyle}>
          <BrandLogo size={isMobile ? mobileLogoSize : desktopClasses.logoSize} showWordmark />
          <Link
            to="/form"
            className={`${ctaTraceClass} ${ctaMotionClass} cta-border-sweep hidden shrink-0 items-center justify-center rounded-full px-4 py-2 text-xs font-bold shadow-soft transition hover:scale-[1.02] sm:inline-flex sm:px-6 sm:py-3 sm:text-sm ${desktopClasses.headerCta} ${
              settings.theme.ctaPulse && ctaAnimation === "pulse" ? "cta-pulse" : ""
            }`}
            style={{
              color: palette.textOnPrimary,
              "--trace-color": palette.ctaTraceColor || "#ffffff",
              "--trace-accent": palette.ctaTraceAccent || palette.primarySoft,
              "--cta-fill": palette.primary,
              boxShadow: `0 10px 28px ${palette.primaryGlow}`
            }}
          >
            {settings.heroPrimaryCta}
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section
          className={`mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:gap-8 ${desktopClasses.heroSectionPadding} ${loadMotionClass} ${
            splitLayout ? "lg:grid-cols-[1.05fr_0.95fr]" : ""
          }`}
        >
          <div className={`${splitLayout ? "self-center" : "mx-auto max-w-4xl text-center"}`}>
            <div
              className={`inline-flex rounded-full border px-4 py-2 text-sm font-medium shadow-sm ${desktopClasses.heroBadge}`}
              style={{ ...desktopScaleStyle, borderColor: palette.primaryGlow, backgroundColor: palette.accent, color: palette.accentStrong }}
            >
              {settings.heroBadge}
            </div>
            <h1 className={`mt-5 max-w-4xl text-2xl font-black leading-[1.08] tracking-tight sm:text-[2.35rem] sm:leading-[1.02] lg:text-[2.75rem] xl:text-5xl ${heroMotionClass}`} style={desktopHeroTitleStyle}>
              {settings.heroTitle}
            </h1>
            <p className={`mt-3 max-w-2xl text-sm leading-6 sm:mt-4 sm:text-lg sm:leading-8 ${desktopClasses.heroDescription}`} style={{ ...desktopScaleStyle, color: palette.mutedTextColor }}>
              {settings.heroDescription}
            </p>
            <div className={`mt-6 flex flex-row items-center gap-2 sm:gap-3 ${splitLayout ? "" : "justify-center"}`} style={desktopScaleStyle}>
              <Link
                to="/form"
                className={`${heroCtaAnimationClass} inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold shadow-soft transition hover:-translate-y-0.5 sm:rounded-3xl sm:px-8 sm:py-5 sm:text-lg ${desktopClasses.heroButton}`}
                style={{
                  color: palette.textOnPrimary,
                  "--cta-fill": palette.primary,
                  backgroundColor: palette.primary,
                  boxShadow: `0 12px 35px ${palette.primaryGlow}`
                }}
              >
                {settings.heroPrimaryCta}
              </Link>
              <a
                href="#how-it-works"
                onClick={scrollToLearnMore}
                className={`inline-flex items-center justify-center rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition sm:rounded-3xl sm:px-8 sm:py-5 sm:text-lg ${desktopClasses.heroButton}`}
                style={{ borderColor: palette.primary, backgroundColor: palette.surfaceBackground, color: palette.primaryDeep }}
              >
                {settings.heroSecondaryCta}
              </a>
            </div>
            <div className={`mt-8 grid grid-cols-2 gap-4 md:grid-cols-2 min-[900px]:grid-cols-3 ${loadAnimation === "stagger" ? "motion-stagger" : ""}`} style={desktopScaleStyle}>
              {heroStats.map((item, index) => {
                const oddCardClass = getOddStatCardClass(heroStats.length, index);

                return (
                  <div
                    key={`${item.value}-${item.label}`}
                    className={`rounded-[28px] border p-5 shadow-soft backdrop-blur-md ${desktopClasses.statCard} ${oddCardClass}`}
                    style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                  >
                    <div className={`text-3xl font-black ${desktopClasses.statValue}`} style={{ color: palette.primary }}>
                      {item.value}
                    </div>
                    <div className={`mt-2 text-sm ${desktopClasses.statLabel}`} style={{ color: palette.mutedTextColor }}>{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`${splitLayout ? "" : "mx-auto max-w-4xl"}`}>
            <div className={`rounded-[32px] border p-6 shadow-soft backdrop-blur-xl ${desktopClasses.panel}`} style={{ ...desktopScaleStyle, borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
              <div
                className={`rounded-[28px] p-6 text-white ${desktopClasses.innerPanel}`}
                style={{
                  background: `linear-gradient(135deg, ${palette.primaryDeep}, ${palette.primary})`
                }}
              >
                <div className={`text-sm font-semibold uppercase tracking-[0.2em] text-white/80 ${desktopClasses.panelHeading}`}>
                  What you’ll submit
                </div>
                <div className="mt-5 space-y-3">
                  {settings.landingHighlights.map((item) => (
                    <div key={item} className={`flex gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur ${desktopClasses.highlightCard}`}>
                      <div className={`mt-1 h-2.5 w-2.5 rounded-full bg-white ${desktopClasses.highlightDot}`} />
                      <p className={`text-sm leading-6 text-white/95 ${desktopClasses.highlightText}`}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`mt-6 rounded-[28px] border p-5 ${desktopClasses.noteCard}`} style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                <div className={`text-sm font-semibold ${desktopClasses.noteTitle}`} style={{ color: palette.textColor }}>{settings.whyItMattersTitle}</div>
                <p className={`mt-2 text-sm leading-6 ${desktopClasses.noteText}`} style={{ color: palette.mutedTextColor }}>{settings.whyItMattersBody}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="relative border-y backdrop-blur-xl" style={{ borderColor: palette.borderColor, backgroundColor: palette.pageBackgroundAlt }}>
          <div className={`mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 ${desktopClasses.sectionPadding}`} style={desktopScaleStyle}>
            <div className="max-w-2xl">
              <div className={`text-sm font-semibold uppercase tracking-[0.2em] ${desktopClasses.eyebrow}`} style={{ color: palette.primary }}>
                How it works
              </div>
              <h2 className={`mt-3 text-3xl font-bold tracking-tight text-slate-950 ${desktopClasses.sectionTitle}`}>
                {settings.howItWorksTitle}
              </h2>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-2 min-[900px]:grid-cols-3">
              {settings.howItWorksSteps.map((item, index) => (
                <article key={item.title} className={`rounded-[28px] border p-6 shadow-sm ${desktopClasses.stepCard} ${getOddCardClass(settings.howItWorksSteps.length, index)}`} style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold ${desktopClasses.stepIcon}`}
                    style={{ backgroundColor: palette.primarySoft, color: palette.primaryDeep }}
                  >
                    {index + 1}
                  </div>
                  <h3 className={`mt-5 text-xl font-semibold ${desktopClasses.stepTitle}`} style={{ color: palette.textColor }}>{item.title}</h3>
                  <p className={`mt-3 text-sm leading-6 ${desktopClasses.stepBody}`} style={{ color: palette.mutedTextColor }}>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter desktopHomepageSize={desktopHomepageSize} desktopScaleStyle={desktopScaleStyle} />
    </div>
  );
};

export default LandingPage;
