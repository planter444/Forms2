import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { getSolarMkononiSettings } from "../lib/api.js";

const useCountUp = (endValue, duration = 2000) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const originalValue = endValue.toString();
          const hasPlus = originalValue.includes("+");
          const hasComma = originalValue.includes(",");
          const numericValue = parseFloat(originalValue.replace(/[^0-9.]/g, "")) || 0;

          let startTime;
          const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentCount = easeOutQuart * numericValue;

            let displayValue = Math.floor(currentCount);
            if (hasComma) {
              displayValue = displayValue.toLocaleString();
            }
            if (hasPlus) {
              displayValue = displayValue + "+";
            }

            setCount(displayValue);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(originalValue);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [endValue, duration, hasAnimated]);

  return [count, elementRef];
};

const useScrollReveal = ({ threshold = 0.15, rootMargin = "0px 0px -50px 0px" } = {}) => {
  const [inView, setInView] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !inView) {
          setInView(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, inView]);

  return [elementRef, inView];
};

const SolarMkononiNav = ({ settings, theme, overHero = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);
  const primaryColor = overHero ? "#ffffff" : (theme.primaryColor || "#059669");
  const textColor = overHero ? "#ffffff" : (theme.textColor || "#064e3b");
  const backgroundColor = theme.backgroundColor || "#f0fdf4";
  const borderColor = overHero ? "rgba(255,255,255,0.3)" : (theme.borderColor || "#a7f3d0");
  const navOpacity = overHero ? 1 : (theme.navOpacity !== undefined ? theme.navOpacity : 0.85);
  const slideDirection = theme.navSlideDirection || "left";

  const navItems = [
    { label: "Home", href: "#top", to: null },
    { label: "Services", href: "#services", to: null },
    { label: "How It Works", href: "#how-it-works", to: null },
    { label: "PAYGO", href: "#paygo", to: null },
    { label: "Resources", href: null, to: "/solar/resource-library" },
    { label: "Contact", href: "#contact", to: null }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 60) {
        setNavHidden(false);
      } else if (currentY > lastScrollY.current) {
        setNavHidden(true);
      } else {
        setNavHidden(false);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = (item) => {
    setMenuOpen(false);
    if (item.href) {
      const el = document.querySelector(item.href);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const glassStyle = {
    backgroundColor: overHero ? "rgba(0,0,0,0.25)" : `${backgroundColor}${Math.round(navOpacity * 255).toString(16).padStart(2, "0")}`,
    backdropFilter: overHero ? "blur(8px)" : "blur(12px)",
    WebkitBackdropFilter: overHero ? "blur(8px)" : "blur(12px)",
    borderColor
  };

  return (
    <>
      <style>{`
        @keyframes navSlideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes navSlideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes navFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .brand-char {
          display: inline-block;
          animation: colorShift 6s ease-in-out infinite;
        }
        .brand-sun {
          width: 1.1em;
          height: 1.1em;
          vertical-align: -0.15em;
          animation: none;
        }
        @keyframes colorShift {
          0%, 100% { color: #ffffff; }
          33% { color: #10b981; }
          66% { color: #0ea5e9; }
        }
        @keyframes sunSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes sunGlow {
          0%, 100% { filter: drop-shadow(0 0 3px rgba(255,255,255,0.6)); opacity: 0.95; }
          50% { filter: drop-shadow(0 0 10px rgba(255,255,255,1)); opacity: 1; }
        }
      `}</style>
      <div
        className={`left-0 right-0 z-50 px-4 ${overHero ? "absolute" : "sticky"} top-3 md:top-0`}
        style={{ paddingTop: overHero ? undefined : "0.5rem" }}
      >
        <header
          id="top"
          className={`mx-auto ${overHero ? "max-w-6xl" : "max-w-5xl"} rounded-2xl border shadow-lg transition-transform duration-300 ${overHero ? "md:mt-3 lg:mt-4" : ""}`}
          style={{ ...glassStyle, transform: navHidden ? "translateY(-150%)" : "translateY(0)" }}
        >
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-xl font-bold"
              style={{ color: primaryColor }}
            >
              {"Solar Mkononi".split("").map((char, i) => {
                const delay = i * 0.15;
                const sun = (
                  <span key={i} className="brand-char brand-sun" style={{ animationDelay: `${delay}s` }}>
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ overflow: "visible", animation: "sunGlow 2s ease-in-out infinite" }}>
                      <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
                      <path d="M12 4V2M12 22v-2M4.93 4.93 3.51 3.51M20.49 20.49l-1.42-1.42M4 12H2m20 0h-2M4.93 19.07l-1.42 1.42M20.49 3.51l-1.42 1.42" style={{ transformOrigin: "12px 12px", animation: "sunSpin 8s linear infinite" }} />
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeDasharray="2 4" opacity="0.6" style={{ transformOrigin: "12px 12px", animation: "sunSpin 12s linear infinite reverse" }} />
                    </svg>
                  </span>
                );
                const letter = (
                  <span key={i} className="brand-char" style={{ animationDelay: `${delay}s` }}>
                    {char === " " ? "\u00A0" : char}
                  </span>
                );
                return i === 1 ? sun : letter;
              })}
            </a>

            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) =>
                item.to ? (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="rounded-full px-4 py-2 text-sm font-medium transition hover:opacity-80"
                    style={{ color: textColor }}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleClick(item);
                    }}
                    className="rounded-full px-4 py-2 text-sm font-medium transition hover:opacity-80"
                    style={{ color: textColor }}
                  >
                    {item.label}
                  </a>
                )
              )}
            </nav>

            <button
              type="button"
              className="rounded-xl border p-2 md:hidden"
              style={{ borderColor, color: textColor }}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuOpen ? (
                  <path d="M6 6l12 12M6 18L18 6" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </header>

        {menuOpen ? (
          <>
            <div
              className="fixed inset-0 z-40 md:hidden"
              style={{ backgroundColor: "rgba(0,0,0,0.25)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", animation: "navFadeIn 0.2s ease-out" }}
              onClick={() => setMenuOpen(false)}
            />
            <nav
              className="fixed top-0 z-50 h-screen w-72 border-r shadow-2xl md:hidden"
              style={{
                backgroundColor: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(22px)",
                WebkitBackdropFilter: "blur(22px)",
                borderColor: "rgba(255,255,255,0.18)",
                [slideDirection === "left" ? "left" : "right"]: 0,
                animation: `${slideDirection === "left" ? "navSlideInLeft" : "navSlideInRight"} 0.3s ease-out`
              }}
            >
              <div className="flex items-center justify-between border-b px-4 py-4" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
                <span className="text-lg font-bold" style={{ color: "#ffffff" }}>Menu</span>
                <button
                  type="button"
                  className="rounded-xl border p-2"
                  style={{ borderColor: "rgba(255,255,255,0.3)", color: "#ffffff" }}
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M6 18L18 6" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col gap-1 p-4">
                {navItems.map((item) =>
                  item.to ? (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-xl px-4 py-3 text-sm font-medium transition hover:opacity-80"
                      style={{ color: "#ffffff" }}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleClick(item);
                      }}
                      className="rounded-xl px-4 py-3 text-sm font-medium transition hover:opacity-80"
                      style={{ color: "#ffffff" }}
                    >
                      {item.label}
                    </a>
                  )
                )}
              </div>
            </nav>
          </>
        ) : null}
      </div>
    </>
  );
};

const SolarMkononiPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getSolarMkononiSettings();
        setSettings(data.settings);
      } catch (error) {
        console.error("Failed to load Solar Mkononi settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#f0fdf4" }}>
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600 mx-auto" />
          <p className="text-emerald-800">Loading Solar Mkononi...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#f0fdf4" }}>
        <p className="text-emerald-800">Unable to load Solar Mkononi settings.</p>
      </div>
    );
  }

  const theme = settings.theme || {};
  const sections = settings.sections || {};
  const desktopScale = theme.desktopHomepageSize ?? 0.9;

  return (
    <div style={{ backgroundColor: theme.backgroundColor || "#f0fdf4", color: theme.textColor || "#064e3b", ["--homepage-scale"]: desktopScale }}>
      <style>{`@media (min-width: 1024px) { .homepage-scale { zoom: var(--homepage-scale, 0.9); } .homepage-hero { min-height: calc(100vh / var(--homepage-scale, 0.9)); } }`}</style>
      <div className="homepage-scale">
        {sections.hero !== false && <HeroSection settings={settings} theme={theme} />}
        {sections.stats !== false && <StatsSection settings={settings} theme={theme} />}
        {sections.services !== false && <ServicesSection settings={settings} theme={theme} />}
        {sections.registration !== false && <RegistrationSection settings={settings} theme={theme} />}
        {sections.howItWorks !== false && <HowItWorksSection settings={settings} theme={theme} />}
        {sections.ussd !== false && <USSDSection settings={settings} theme={theme} />}
        {sections.paygo !== false && <PAYGOSection settings={settings} theme={theme} />}
      </div>
      {sections.resourceLibrary !== false && <ResourceLibrarySection settings={settings} theme={theme} />}
      <div className="homepage-scale">
        {sections.impact !== false && <ImpactSection settings={settings} theme={theme} />}
        {sections.partners !== false && <PartnersSection settings={settings} theme={theme} />}
        {sections.contact !== false && <ContactSection settings={settings} theme={theme} />}
        {sections.footer !== false && <FooterSection settings={settings} theme={theme} />}
      </div>
    </div>
  );
};

const HeroSection = ({ settings, theme }) => {
  const hero = settings.hero || {};
  const branding = settings.branding || {};
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const useDesktopOnMobile = hero.useDesktopOnMobile !== false;
  let backgroundUrl;
  if (isMobile) {
    backgroundUrl = hero.backgroundUrlMobile || (useDesktopOnMobile ? hero.backgroundUrl : null);
  } else {
    backgroundUrl = hero.backgroundUrl;
  }

  const heroStyle = {
    backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
    backgroundColor: backgroundUrl ? undefined : theme.primaryColor || "#059669",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat"
  };

  const overlayOpacity = hero.overlayOpacity !== undefined ? hero.overlayOpacity : 0.5;
  const overlayStyle = {
    backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`
  };

  return (
    <section className="homepage-hero relative min-h-screen flex flex-col justify-center px-4 overflow-hidden" style={heroStyle}>
      <SolarMkononiNav settings={settings} theme={theme} overHero />
      <div className="absolute inset-0" style={overlayStyle} />
      <div className="relative z-10 max-w-4xl mx-auto text-center text-white lg:mt-[6vh]">
        {branding.logoUrl && (
          <img src={branding.logoUrl} alt={branding.logoAlt || "Solar Mkononi"} className="h-20 mx-auto mb-8" />
        )}
        <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">{hero.headline || "Renewable Energy at Your Fingertips"}</h1>
        <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto drop-shadow-md">
          {hero.description || "Connect with verified renewable energy suppliers, technicians, financial institutions, and innovative clean energy solutions through Solar Mkononi."}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={hero.primaryCtaHref || "#services"}
            className="px-8 py-4 rounded-full font-bold text-white transition hover:scale-105 shadow-xl"
            style={{ backgroundColor: theme.primaryColor || "#059669" }}
          >
            {hero.primaryCta || "Explore Services"}
          </a>
          <a
            href={hero.secondaryCtaHref || "#ussd"}
            className="px-8 py-4 rounded-full font-bold border-2 border-white text-white transition hover:scale-105 backdrop-blur-sm"
          >
            {hero.secondaryCta || "Access USSD Platform"}
          </a>
        </div>
      </div>
    </section>
  );
};

const hexToHsl = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
};

const hslToHex = (h, s, l) => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const lightCardColors = [
  { bg: "#f0fdf4", border: "#a7f3d0", text: "#065f46" },
  { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  { bg: "#ffffff", border: "#e5e7eb", text: "#15803d" },
  { bg: "#f7fee7", border: "#d9f99d", text: "#3f6212" },
  { bg: "#f0f9ff", border: "#bae6fd", text: "#0c4a6e" },
  { bg: "#fafaf9", border: "#e7e5e4", text: "#15803d" },
  { bg: "#f3f4f6", border: "#d1d5db", text: "#1d4ed8" },
  { bg: "#ecfdf5", border: "#6ee7b7", text: "#047857" }
];

const svgIcon = (path) => (
  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
);

const iconMap = {
  sun: svgIcon(<><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>),
  panel: svgIcon(<><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/><rect x="2" y="4" width="20" height="16" rx="2"/></>),
  wrench: svgIcon(<><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>),
  install: svgIcon(<><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>),
  bank: svgIcon(<><path d="M3 21h18M4 18h16M5 18v-8h3v8M10 18v-8h4v8M16 18v-8h3v8M2 10l10-6 10 6"/></>),
  coins: svgIcon(<><circle cx="12" cy="12" r="10"/><path d="M14.83 14.83a4 4 0 0 0-7.66-1.66"/></>),
  finance: svgIcon(<><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>),
  leaf: svgIcon(<><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 17 4.5c-1 4-2.5 6.5-3.5 8a3 3 0 0 0 3 3c2.5-4.5 2-9.5 2-9.5-1 1-3.5 2-6 2.5a8 8 0 0 0-2.5 14.5z"/></>),
  droplet: svgIcon(<><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z"/></>),
  slurry: svgIcon(<><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z"/></>),
  digester: svgIcon(<><path d="M2 12h20M2 12c0-5.5 4.5-10 10-10s10 4.5 10 10M2 12c0 5.5 4.5 10 10 10s10-4.5 10-10"/><path d="M12 6v12M8 9v6M16 9v6"/></>),
  bio: svgIcon(<><path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9-4.03-9-9-4.97 0-9 4.03-9 9 0 4.97 4.03 9 9 9z"/><path d="M12 8v8M8 12h8"/></>),
  pump: svgIcon(<><path d="M12 2v8M8 6l4-4 4 4M7 20h10v-6H7z"/><path d="M9 14v-2a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v2"/></>),
  light: svgIcon(<><path d="M9 18h6M10 22h4M12 2a6 6 0 0 0-6 6c0 2.39 1.4 4.46 3.43 5.42L9 16h6l.57-2.58A6 6 0 0 0 18 8a6 6 0 0 0-6-6z"/></>),
  paygo: svgIcon(<><rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v4"/><path d="M6 11v2"/></>),
  cooking: svgIcon(<><path d="M4 18h16M2 22h20M6 14c0-3.31 2.69-6 6-6s6 2.69 6 6"/><path d="M8 14v-2a4 4 0 0 1 8 0v2"/></>),
  phone: svgIcon(<><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.8 12.8 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.8 12.8 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></>),
  search: svgIcon(<><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></>),
  link: svgIcon(<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>),
  growth: svgIcon(<><path d="M12 20v-8"/><path d="M12 12l-4 4"/><path d="M12 12l4 4"/><path d="M12 4a8 8 0 0 1 8 8"/><path d="M12 4a8 8 0 0 0-8 8"/></>),
  default: svgIcon(<><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></>)
};

const getIcon = (iconKey, title) => {
  const key = String(iconKey || "").toLowerCase().trim();
  if (iconMap[key]) return iconMap[key];
  const text = String(title || "").toLowerCase();
  for (const k of Object.keys(iconMap)) {
    if (text.includes(k)) return iconMap[k];
  }
  return iconMap.default;
};

const StatsSection = ({ settings, theme }) => {
  const stats = settings.stats || {};
  const items = stats.items || [];
  const isOdd = items.length % 2 !== 0;
  const [isMobile, setIsMobile] = useState(false);
  const gradientStart = stats.gradientColor || "#059669";
  const gradientEnd = stats.gradientEnd || "#86efac";

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <section className="py-16 px-4" style={{ backgroundColor: theme.surfaceBackground || "#ffffff" }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8">
          {items.map((item, index) => {
            const [count, ref] = useCountUp(item.value);
            const isLastItem = index === items.length - 1;
            const isEven = index % 2 === 0;
            const textGradient = {
              backgroundImage: `linear-gradient(135deg, ${isEven ? gradientStart : gradientEnd}, ${isEven ? gradientEnd : gradientStart})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              display: "inline-block"
            };
            return (
              <div
                key={index}
                className="text-center"
                ref={ref}
                style={isMobile && isOdd && isLastItem ? { gridColumn: "1 / -1", maxWidth: "50%", margin: "0 auto" } : {}}
              >
                <div className="text-4xl md:text-5xl font-bold mb-2" style={textGradient}>
                  {count}
                </div>
                <div className="text-sm md:text-base" style={{ color: theme.mutedTextColor || "#475569" }}>
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const ServicesSection = ({ settings, theme }) => {
  const services = settings.services || {};
  const cards = services.cards || [];
  const [isMobile, setIsMobile] = useState(false);
  const carouselRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [activeIndex, setActiveIndex] = useState(cards.length || 0);
  const [cardWidth, setCardWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [dragTranslateX, setDragTranslateX] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef(null);

  const duplicatedCards = [...cards, ...cards, ...cards];
  const delayMs = (services.mobileCarouselDelay || 5) * 1000;
  const baseTranslate = -activeIndex * cardWidth;
  const currentTranslate = isDragging ? dragTranslateX : baseTranslate;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (carouselRef.current && isMobile) {
      setCardWidth(carouselRef.current.offsetWidth);
    }
  }, [isMobile, cards]);

  useEffect(() => {
    setIsResetting(true);
    setActiveIndex(cards.length || 0);
  }, [cards.length]);

  useEffect(() => {
    if (isResetting) {
      const id = requestAnimationFrame(() => setIsResetting(false));
      return () => cancelAnimationFrame(id);
    }
  }, [isResetting]);

  useEffect(() => {
    if (!isMobile || cards.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => prev + 1);
    }, delayMs);
    return () => clearInterval(id);
  }, [isMobile, cards.length, delayMs]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const nextSlide = () => {
    if (isMobile) {
      setActiveIndex((prev) => prev + 1);
    } else {
      setActiveIndex((prev) => Math.min(prev + 1, cards.length - 1));
    }
  };

  const prevSlide = () => {
    if (isMobile) {
      setActiveIndex((prev) => prev - 1);
    } else {
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  useEffect(() => {
    if (cards.length && activeIndex < 0) {
      setIsResetting(true);
      setActiveIndex(activeIndex + cards.length);
    } else if (cards.length && activeIndex >= 2 * cards.length) {
      setIsResetting(true);
      setActiveIndex(activeIndex - cards.length);
    }
  }, [activeIndex, cards.length]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    touchEndX.current = e.touches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    setDragTranslateX(baseTranslate - diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const diff = touchStartX.current - touchEndX.current;
    const threshold = cardWidth ? cardWidth * 0.15 : 50;
    if (diff > threshold) {
      nextSlide();
    } else if (diff < -threshold) {
      prevSlide();
    } else {
      setDragTranslateX(baseTranslate);
    }
  };

  const getAnimationStyle = (index) => {
    const animationEnabled = isMobile ? services.mobileAnimationEnabled : services.animationEnabled;
    if (!animationEnabled || !hasAnimated) return {};
    const animationStyle = isMobile ? services.mobileAnimationStyle : services.animationStyle;
    const animationDelay = isMobile ? services.mobileAnimationDelay : services.animationDelay;
    const style = animationStyle || "fade-up";
    const delay = index * (animationDelay || 100);
    const animations = {
      "fade-up": { opacity: 0, transform: "translateY(30px)", animation: `fadeInUp 0.6s ease-out ${delay}ms forwards` },
      "fade-down": { opacity: 0, transform: "translateY(-30px)", animation: `fadeInDown 0.6s ease-out ${delay}ms forwards` },
      "fade-left": { opacity: 0, transform: "translateX(30px)", animation: `fadeInLeft 0.6s ease-out ${delay}ms forwards` },
      "fade-right": { opacity: 0, transform: "translateX(-30px)", animation: `fadeInRight 0.6s ease-out ${delay}ms forwards` },
      "scale-up": { opacity: 0, transform: "scale(0.8)", animation: `scaleUp 0.6s ease-out ${delay}ms forwards` },
      "scale-down": { opacity: 0, transform: "scale(1.2)", animation: `scaleDown 0.6s ease-out ${delay}ms forwards` },
      "slide-up": { opacity: 0, transform: "translateY(100%)", animation: `slideUp 0.6s ease-out ${delay}ms forwards` },
      "slide-down": { opacity: 0, transform: "translateY(-100%)", animation: `slideDown 0.6s ease-out ${delay}ms forwards` },
      "rotate": { opacity: 0, transform: "scale(0.5) rotate(-45deg)", animation: `rotateIn 0.6s ease-out ${delay}ms forwards` },
      "none": {}
    };
    return animations[style] || animations["fade-up"];
  };

  return (
    <section id="services" ref={sectionRef} className="py-16 px-4" style={{ backgroundColor: services.backgroundColor || theme.backgroundColor || "#f0fdf4" }}>
      <style>{`
        @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInLeft { to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInRight { to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleUp { to { opacity: 1; transform: scale(1); } }
        @keyframes scaleDown { to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { to { opacity: 1; transform: translateY(0); } }
        @keyframes rotateIn { to { opacity: 1; transform: scale(1) rotate(0deg); } }
      `}</style>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: theme.textColor || "#064e3b" }}>
          {services.title || "Our Services"}
        </h2>
        <p className="text-center mb-12 max-w-2xl mx-auto text-lg" style={{ color: theme.mutedTextColor || "#475569" }}>
          {services.description || "Comprehensive renewable energy solutions for Kenya"}
        </p>

        {isMobile ? (
          <div className="relative">
            <div
              ref={carouselRef}
              className="overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex"
                style={{
                  transform: `translateX(${currentTranslate}px)`,
                  transition: isResetting || isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }}
              >
                {duplicatedCards.map((card, index) => {
                  const color = lightCardColors[index % lightCardColors.length];
                  return (
                    <div key={`${card.title}-${index}`} className="w-full flex-shrink-0 px-4">
                      <div
                        className="p-6 rounded-2xl shadow-sm"
                        style={{
                          backgroundColor: color.bg,
                          border: `1px solid ${color.border}`,
                          ...getAnimationStyle(index % cards.length)
                        }}
                      >
                        <div className="mb-4" style={{ color: color.text }}>{getIcon(card.icon, card.title)}</div>
                        <h3 className="text-xl font-bold mb-2" style={{ color: color.text }}>
                          {card.title}
                        </h3>
                        <p style={{ color: theme.mutedTextColor || "#475569" }}>{card.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {cards.length > 1 ? (
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={prevSlide}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold transition hover:scale-110"
                  style={{ backgroundColor: theme.primaryColor || "#059669", color: "#ffffff" }}
                >
                  ←
                </button>
                <div className="flex items-center gap-2">
                  {cards.map((_, index) => {
                    const currentCardIndex = cards.length ? activeIndex % cards.length : 0;
                    return (
                      <button
                        key={index}
                        onClick={() => setActiveIndex(cards.length + index)}
                        className={`w-3 h-3 rounded-full transition ${index === currentCardIndex ? "scale-125" : ""}`}
                        style={{
                          backgroundColor: index === currentCardIndex ? theme.primaryColor || "#059669" : theme.borderColor || "#a7f3d0"
                        }}
                      />
                    );
                  })}
                </div>
                <button
                  onClick={nextSlide}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold transition hover:scale-110"
                  style={{ backgroundColor: theme.primaryColor || "#059669", color: "#ffffff" }}
                >
                  →
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cards.map((card, index) => {
              const color = lightCardColors[index % lightCardColors.length];
              return (
                <div
                  key={index}
                  className="p-6 rounded-2xl transition hover:scale-105 shadow-sm hover:shadow-md"
                  style={{
                    backgroundColor: color.bg,
                    border: `1px solid ${color.border}`,
                    ...getAnimationStyle(index)
                  }}
                >
                  <div className="mb-4" style={{ color: color.text }}>{getIcon(card.icon, card.title)}</div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: color.text }}>
                    {card.title}
                  </h3>
                  <p className="text-sm" style={{ color: theme.mutedTextColor || "#475569" }}>{card.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

const RegistrationSection = ({ settings, theme }) => {
  const registration = settings.registration || {};
  const backgroundColor = registration.backgroundColor || "#059669";
  const backgroundPattern = registration.backgroundPattern || "none";

  const getPatternStyle = () => {
    switch (backgroundPattern) {
      case "wave":
        return {
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
          backgroundSize: "60px 60px",
          animation: "wavePattern 3s ease-in-out infinite"
        };
      case "web":
        return {
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
          animation: "webPattern 2s linear infinite"
        };
      case "dots":
        return {
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.2) 2px, transparent 2px)`,
          backgroundSize: "20px 20px",
          animation: "dotsPattern 1.5s ease-in-out infinite"
        };
      case "grid":
        return {
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.1) 2px, transparent 2px)`,
          backgroundSize: "40px 40px",
          animation: "gridPattern 3s linear infinite"
        };
      case "zigzag":
        return {
          backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 10px, transparent 10px, transparent 20px)`,
          backgroundSize: "40px 40px",
          animation: "zigzagPattern 2s linear infinite"
        };
      default:
        return {};
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes wavePattern {
            0%, 100% { background-position: 0% 0%; }
            50% { background-position: 100% 100%; }
          }
          @keyframes webPattern {
            0% { background-position: 0 0; }
            100% { background-position: 30px 30px; }
          }
          @keyframes dotsPattern {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes gridPattern {
            0% { background-position: 0 0; }
            100% { background-position: 40px 40px; }
          }
          @keyframes zigzagPattern {
            0% { background-position: 0 0; }
            100% { background-position: 40px 40px; }
          }
        `}
      </style>
      <section className="py-20 px-4 relative overflow-hidden" style={{ backgroundColor, ...getPatternStyle() }}>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#ffffff" }}>
            {registration.title || "Register as a Stakeholder"}
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.9)" }}>
            {registration.description || "Join our network of solar suppliers, installers, financing institutions, biogas suppliers, and more. Register today to become part of Kenya's renewable energy ecosystem."}
          </p>
          <a
            href={registration.link || "https://ussd.kerea.org"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 rounded-full text-lg font-bold text-white transition hover:scale-105 hover:shadow-lg"
            style={{ backgroundColor: "#ffffff", color: backgroundColor }}
          >
            {registration.buttonText || "Register Now"}
          </a>
        </div>
      </section>
    </>
  );
};

const HowItWorksSection = ({ settings, theme }) => {
  const howItWorks = settings.howItWorks || {};
  const steps = howItWorks.steps || [];
  const backgroundColor = howItWorks.backgroundColor || "#ffffff";
  const [{ activeIndex, colorIndices }, setStepState] = useState({
    activeIndex: 0,
    colorIndices: steps.map((_, index) => index % lightCardColors.length)
  });

  useEffect(() => {
    if (!steps.length) {
      return;
    }

    const id = setInterval(() => {
      setStepState((prev) => {
        const nextActive = (prev.activeIndex + 1) % steps.length;
        const nextColors = [...prev.colorIndices];
        nextColors[nextActive] = (nextColors[nextActive] + 1) % lightCardColors.length;
        return { activeIndex: nextActive, colorIndices: nextColors };
      });
    }, 800);

    return () => clearInterval(id);
  }, [steps.length]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const getAnimationStyle = (index) => {
    const animationEnabled = isMobile ? howItWorks.mobileAnimationEnabled : howItWorks.animationEnabled;
    if (!animationEnabled) return {};
    const animationStyle = isMobile ? howItWorks.mobileAnimationStyle : howItWorks.animationStyle;
    const animationDelay = isMobile ? howItWorks.mobileAnimationDelay : howItWorks.animationDelay;
    const style = animationStyle || "fade-up";
    const delay = index * (animationDelay || 100);
    const animations = {
      "fade-up": { opacity: 0, transform: "translateY(30px)", animation: `fadeInUp 0.6s ease-out ${delay}ms forwards` },
      "fade-down": { opacity: 0, transform: "translateY(-30px)", animation: `fadeInDown 0.6s ease-out ${delay}ms forwards` },
      "fade-left": { opacity: 0, transform: "translateX(30px)", animation: `fadeInLeft 0.6s ease-out ${delay}ms forwards` },
      "fade-right": { opacity: 0, transform: "translateX(-30px)", animation: `fadeInRight 0.6s ease-out ${delay}ms forwards` },
      "scale-up": { opacity: 0, transform: "scale(0.8)", animation: `scaleUp 0.6s ease-out ${delay}ms forwards` },
      "scale-down": { opacity: 0, transform: "scale(1.2)", animation: `scaleDown 0.6s ease-out ${delay}ms forwards` },
      "slide-up": { opacity: 0, transform: "translateY(100%)", animation: `slideUp 0.6s ease-out ${delay}ms forwards` },
      "slide-down": { opacity: 0, transform: "translateY(-100%)", animation: `slideDown 0.6s ease-out ${delay}ms forwards` },
      "rotate": { opacity: 0, transform: "scale(0.5) rotate(-45deg)", animation: `rotateIn 0.6s ease-out ${delay}ms forwards` },
      "none": {}
    };
    return animations[style] || animations["fade-up"];
  };

  return (
    <section id="how-it-works" className="py-20 px-4" style={{ backgroundColor }}>
      <style>{`
        @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInLeft { to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInRight { to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleUp { to { opacity: 1; transform: scale(1); } }
        @keyframes scaleDown { to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { to { opacity: 1; transform: translateY(0); } }
        @keyframes rotateIn { to { opacity: 1; transform: scale(1) rotate(0deg); } }
      `}</style>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: theme.textColor || "#064e3b" }}>
          {howItWorks.title || "How It Works"}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {steps.map((step, index) => {
            const isActive = index === activeIndex;
            const color = lightCardColors[colorIndices[index]];
            return (
              <div key={index} className="text-center" style={getAnimationStyle(index)}>
                <div
                  className={`w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-3 md:mb-4 text-lg md:text-2xl font-bold shadow-sm ${isMobile ? "rounded-bl-xl border-l-2 border-b-2" : "rounded-full border-2"}`}
                  style={{
                    backgroundColor: color.bg,
                    color: color.text,
                    borderColor: color.border,
                    transform: isActive ? "scale(1.25)" : "scale(1)",
                    transition: "transform 0.3s cubic-bezier(.68,-0.55,.27,1.55), background-color 0.3s, color 0.3s"
                  }}
                >
                  {index + 1}
                </div>
                <h3 className="text-sm md:text-lg font-bold mb-2" style={{ color: theme.textColor || "#064e3b" }}>
                  {step.title}
                </h3>
                <p className="text-xs md:text-sm" style={{ color: theme.mutedTextColor || "#475569" }}>
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const USSDSection = ({ settings, theme }) => {
  const ussd = settings.ussd || {};
  const backgroundColor = ussd.backgroundColor || theme.primaryColor || "#059669";
  const instructions = (ussd.instructions && ussd.instructions.length > 0) ? ussd.instructions : [
    "Open your phone's dialer",
    "Enter *789*788#",
    "Press the call button",
    "Follow the menu prompts"
  ];
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const getAnimationStyle = (index) => {
    const animationEnabled = isMobile ? ussd.mobileAnimationEnabled : ussd.animationEnabled;
    if (!animationEnabled) return {};
    const animationStyle = isMobile ? ussd.mobileAnimationStyle : ussd.animationStyle;
    const animationDelay = isMobile ? ussd.mobileAnimationDelay : ussd.animationDelay;
    const style = animationStyle || "fade-up";
    const delay = index * (animationDelay || 100);
    const animations = {
      "fade-up": { opacity: 0, transform: "translateY(30px)", animation: `fadeInUp 0.6s ease-out ${delay}ms forwards` },
      "fade-down": { opacity: 0, transform: "translateY(-30px)", animation: `fadeInDown 0.6s ease-out ${delay}ms forwards` },
      "fade-left": { opacity: 0, transform: "translateX(30px)", animation: `fadeInLeft 0.6s ease-out ${delay}ms forwards` },
      "fade-right": { opacity: 0, transform: "translateX(-30px)", animation: `fadeInRight 0.6s ease-out ${delay}ms forwards` },
      "scale-up": { opacity: 0, transform: "scale(0.8)", animation: `scaleUp 0.6s ease-out ${delay}ms forwards` },
      "scale-down": { opacity: 0, transform: "scale(1.2)", animation: `scaleDown 0.6s ease-out ${delay}ms forwards` },
      "slide-up": { opacity: 0, transform: "translateY(100%)", animation: `slideUp 0.6s ease-out ${delay}ms forwards` },
      "slide-down": { opacity: 0, transform: "translateY(-100%)", animation: `slideDown 0.6s ease-out ${delay}ms forwards` },
      "rotate": { opacity: 0, transform: "scale(0.5) rotate(-45deg)", animation: `rotateIn 0.6s ease-out ${delay}ms forwards` },
      "none": {}
    };
    return animations[style] || animations["fade-up"];
  };

  return (
    <section id="ussd" className="py-20 px-4" style={{ backgroundColor }}>
      <style>{`
        @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInLeft { to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInRight { to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleUp { to { opacity: 1; transform: scale(1); } }
        @keyframes scaleDown { to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { to { opacity: 1; transform: translateY(0); } }
        @keyframes rotateIn { to { opacity: 1; transform: scale(1) rotate(0deg); } }
        @keyframes ussdShake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-2px, -1px) rotate(-1deg); }
          20% { transform: translate(2px, 1px) rotate(1deg); }
          30% { transform: translate(-2px, 2px) rotate(0deg); }
          40% { transform: translate(2px, -2px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(1px, -2px) rotate(0deg); }
          70% { transform: translate(-1px, -1px) rotate(1deg); }
          80% { transform: translate(1px, 1px) rotate(-1deg); }
          90% { transform: translate(0, 0) rotate(0deg); }
        }
      `}</style>
      <div className="max-w-6xl mx-auto text-center text-white">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{ussd.title || "Access via USSD"}</h2>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
          {ussd.description || "No internet? No problem. Access our platform directly from your mobile phone"}
        </p>

        <a
          href={`tel:${ussd.dialCode || "*789*788#"}`}
          className="inline-block rounded-2xl bg-white px-8 py-6 mb-10 shadow-2xl transition hover:scale-105"
        >
          <div className="text-4xl md:text-5xl font-bold" style={{ color: theme.primaryColor || "#059669" }}>{ussd.dialCode || "*789*788#"}</div>
          <div className="mt-2 text-sm" style={{ color: theme.mutedTextColor || "#6b7280" }}>Tap to dial</div>
        </a>

        {ussd.screenshotUrl && (
          <div className="mb-10 max-w-xs mx-auto">
            <img src={ussd.screenshotUrl} alt="USSD screenshot" className="rounded-xl shadow-lg" />
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto">
          {instructions.map((instruction, index) => {
            const shapes = [
              { borderRadius: "20px 40px 20px 40px", minHeight: "140px" },
              { borderRadius: "40px 20px 40px 20px", minHeight: "160px" },
              { borderRadius: "30px 30px 50px 10px", minHeight: "130px" },
              { borderRadius: "10px 50px 30px 30px", minHeight: "150px" }
            ];
            const shape = shapes[index % shapes.length];
            const fill = lightCardColors[index % lightCardColors.length];
            const baseStyle = getAnimationStyle(index);
            return (
              <div
                key={index}
                className="p-3 md:p-5 flex flex-col items-center justify-center text-center font-semibold"
                style={{
                  ...baseStyle,
                  ...shape,
                  backgroundColor: fill.bg,
                  color: fill.text,
                  border: `2px solid ${fill.border}`,
                  minHeight: isMobile ? "100px" : shape.minHeight,
                  animation: baseStyle.animation
                    ? `${baseStyle.animation}, ussdShake ${1.5 + (index % 4) * 0.3}s ease-in-out ${index * 0.2}s infinite`
                    : `ussdShake ${1.5 + (index % 4) * 0.3}s ease-in-out ${index * 0.2}s infinite`
                }}
              >
                <div className="text-2xl md:text-3xl mb-1 md:mb-2">{index + 1}</div>
                <p className="text-xs md:text-sm leading-snug">{instruction}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const PAYGOSection = ({ settings, theme }) => {
  const paygo = settings.paygo || {};
  const items = paygo.items || [];
  const backgroundColor = paygo.backgroundColor || "#f0fdf4";
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const getAnimationStyle = (index) => {
    const animationEnabled = isMobile ? paygo.mobileAnimationEnabled : paygo.animationEnabled;
    if (!animationEnabled) return {};
    const animationStyle = isMobile ? paygo.mobileAnimationStyle : paygo.animationStyle;
    const animationDelay = isMobile ? paygo.mobileAnimationDelay : paygo.animationDelay;
    const style = animationStyle || "fade-up";
    const delay = index * (animationDelay || 100);
    const animations = {
      "fade-up": { opacity: 0, transform: "translateY(30px)", animation: `fadeInUp 0.6s ease-out ${delay}ms forwards` },
      "fade-down": { opacity: 0, transform: "translateY(-30px)", animation: `fadeInDown 0.6s ease-out ${delay}ms forwards` },
      "fade-left": { opacity: 0, transform: "translateX(30px)", animation: `fadeInLeft 0.6s ease-out ${delay}ms forwards` },
      "fade-right": { opacity: 0, transform: "translateX(-30px)", animation: `fadeInRight 0.6s ease-out ${delay}ms forwards` },
      "scale-up": { opacity: 0, transform: "scale(0.8)", animation: `scaleUp 0.6s ease-out ${delay}ms forwards` },
      "scale-down": { opacity: 0, transform: "scale(1.2)", animation: `scaleDown 0.6s ease-out ${delay}ms forwards` },
      "slide-up": { opacity: 0, transform: "translateY(100%)", animation: `slideUp 0.6s ease-out ${delay}ms forwards` },
      "slide-down": { opacity: 0, transform: "translateY(-100%)", animation: `slideDown 0.6s ease-out ${delay}ms forwards` },
      "rotate": { opacity: 0, transform: "scale(0.5) rotate(-45deg)", animation: `rotateIn 0.6s ease-out ${delay}ms forwards` },
      "none": {}
    };
    const baseStyle = animations[style] || animations["fade-up"];
    if (!inView) {
      return { opacity: 0, ...(baseStyle.transform ? { transform: baseStyle.transform } : {}) };
    }
    return baseStyle;
  };

  const [ref, inView] = useScrollReveal();

  return (
    <section id="paygo" ref={ref} className="py-20 px-4" style={{ backgroundColor }}>
      <style>{`
        @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInLeft { to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInRight { to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleUp { to { opacity: 1; transform: scale(1); } }
        @keyframes scaleDown { to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { to { opacity: 1; transform: translateY(0); } }
        @keyframes rotateIn { to { opacity: 1; transform: scale(1) rotate(0deg); } }
      `}</style>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: theme.textColor || "#064e3b" }}>
          {paygo.title || "PAYGO Solutions"}
        </h2>
        <p className="text-center mb-12 max-w-2xl mx-auto" style={{ color: theme.mutedTextColor || "#475569" }}>
          {paygo.description || "Pay-as-you-go solar solutions for affordable clean energy access"}
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item, index) => {
            const color = lightCardColors[index % lightCardColors.length];
            return (
              <div
                key={index}
                className="p-6 rounded-2xl text-center transition hover:scale-105 shadow-sm hover:shadow-md"
                style={{
                  backgroundColor: color.bg,
                  border: `1px solid ${color.border}`,
                  ...getAnimationStyle(index)
                }}
              >
                <div className="mb-4 flex" style={{ color: color.text, justifyContent: isMobile ? (index % 2 === 0 ? "flex-start" : "flex-end") : "center" }}>{getIcon(item.icon, item.title)}</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: color.text }}>
                  {item.title}
                </h3>
                <p className="text-sm" style={{ color: theme.mutedTextColor || "#475569" }}>
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const ResourceLibrarySection = ({ settings, theme }) => {
  const resourceLibrary = settings.resourceLibrary || {};
  const resources = resourceLibrary.resources || [];
  const backgroundColor = resourceLibrary.backgroundColor || "#eff6ff";
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const getAnimationStyle = (index) => {
    const animationEnabled = isMobile ? resourceLibrary.mobileAnimationEnabled : resourceLibrary.animationEnabled;
    if (!animationEnabled) return {};
    const animationStyle = isMobile ? resourceLibrary.mobileAnimationStyle : resourceLibrary.animationStyle;
    const animationDelay = isMobile ? resourceLibrary.mobileAnimationDelay : resourceLibrary.animationDelay;
    const style = animationStyle || "fade-up";
    const delay = index * (animationDelay || 100);
    const animations = {
      "fade-up": { opacity: 0, transform: "translateY(40px)", animation: `fadeInUp 0.7s ease-out ${delay}ms forwards` },
      "fade-down": { opacity: 0, transform: "translateY(-40px)", animation: `fadeInDown 0.7s ease-out ${delay}ms forwards` },
      "fade-left": { opacity: 0, transform: "translateX(40px)", animation: `fadeInLeft 0.7s ease-out ${delay}ms forwards` },
      "fade-right": { opacity: 0, transform: "translateX(-40px)", animation: `fadeInRight 0.7s ease-out ${delay}ms forwards` },
      "scale-up": { opacity: 0, transform: "scale(0.85)", animation: `scaleUp 0.7s ease-out ${delay}ms forwards` },
      "scale-down": { opacity: 0, transform: "scale(1.15)", animation: `scaleDown 0.7s ease-out ${delay}ms forwards` },
      "slide-up": { opacity: 0, transform: "translateY(100%)", animation: `slideUp 0.7s ease-out ${delay}ms forwards` },
      "slide-down": { opacity: 0, transform: "translateY(-100%)", animation: `slideDown 0.7s ease-out ${delay}ms forwards` },
      "rotate": { opacity: 0, transform: "scale(0.6) rotate(-30deg)", animation: `rotateIn 0.7s ease-out ${delay}ms forwards` },
      "none": {}
    };
    const baseStyle = animations[style] || animations["fade-up"];
    if (!inView) {
      return { opacity: 0, ...(baseStyle.transform ? { transform: baseStyle.transform } : {}) };
    }
    return baseStyle;
  };

  const [ref, inView] = useScrollReveal();

  return (
    <section ref={ref} className="py-20 px-4" style={{ backgroundColor }}>
      <style>{`
        @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInLeft { to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInRight { to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleUp { to { opacity: 1; transform: scale(1); } }
        @keyframes scaleDown { to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { to { opacity: 1; transform: translateY(0); } }
        @keyframes rotateIn { to { opacity: 1; transform: scale(1) rotate(0deg); } }
      `}</style>
      <div className="max-w-6xl mx-auto" style={getAnimationStyle(0)}>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: theme.textColor || "#064e3b" }}>
          {resourceLibrary.title || "Resource Library"}
        </h2>
        <p className="text-center mb-12 max-w-2xl mx-auto" style={{ color: theme.mutedTextColor || "#475569" }}>
          {resourceLibrary.description || "Access policies, best practices, and sector guides"}
        </p>
        {resources.length > 0 ? (
          <div className={`grid gap-6 ${resources.length === 1 ? "grid-cols-1 justify-items-center" : "md:grid-cols-2 lg:grid-cols-3"}`}>
            {resources.map((resource, index) => {
              const downloadUrl = resource.downloadUrl || resource.fileUrl || resource.externalUrl || resource.url || "";
              return (
                <div
                  key={index}
                  className={`flex h-64 flex-col overflow-hidden rounded-2xl transition hover:scale-105 sm:h-72 ${resources.length === 1 ? "w-full max-w-sm" : ""}`}
                  style={{ backgroundColor: theme.surfaceMuted || "#f0fdf4", border: `1px solid ${theme.borderColor || "#a7f3d0"}` }}
                >
                  <div className="h-28 w-full shrink-0 sm:h-32">
                    {resource.coverImageUrl ? (
                      <img src={resource.coverImageUrl} alt={resource.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: theme.surfaceMuted || "#f0fdf4" }}>
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.mutedTextColor || "#475569" }}>{resource.resourceType || "Resource"}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col overflow-hidden bg-white/80 p-4">
                    <div>
                      <h3 className="text-sm font-semibold leading-tight line-clamp-1" style={{ color: theme.textColor || "#064e3b" }}>
                        {resource.title}
                      </h3>
                      <p className="mt-1 text-xs line-clamp-3" style={{ color: theme.mutedTextColor || "#475569" }}>
                        {resource.description || resource.summary}
                      </p>
                    </div>
                    {downloadUrl ? (
                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-auto inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-bold text-white"
                        style={{ backgroundColor: theme.primaryColor || "#059669" }}
                      >
                        Download
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center mb-8" style={{ color: theme.mutedTextColor || "#475569" }}>
            Browse our growing collection of curated resources.
          </p>
        )}
        <div className="text-center mt-8">
          <style>{`
            @keyframes borderSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes breatheText { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
          `}</style>
          <div className="relative inline-flex rounded-full p-[2px] lg:p-[5px] overflow-hidden">
            <div
              className="absolute -inset-1"
              style={{
                background: `conic-gradient(from 0deg, transparent, ${theme.primaryColor || "#059669"}, transparent 40%)`,
                animation: "borderSpin 2.5s linear infinite"
              }}
            />
            <Link
              to="/solar/resource-library"
              className="relative inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-semibold transition hover:scale-105"
              style={{
                color: theme.primaryColor || "#059669",
                backgroundColor: theme.surfaceMuted || "#f0fdf4"
              }}
            >
              <span style={{ animation: "breatheText 2.5s ease-in-out infinite", display: "inline-block" }}>
                Explore the full Resource Library →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

const ImpactSection = ({ settings, theme }) => {
  const impact = settings.impact || {};
  const stories = impact.stories || [];
  const backgroundColor = impact.backgroundColor || "#ffffff";
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const getAnimationStyle = (index) => {
    const animationEnabled = isMobile ? impact.mobileAnimationEnabled : impact.animationEnabled;
    if (!animationEnabled) return {};
    const animationStyle = isMobile ? impact.mobileAnimationStyle : impact.animationStyle;
    const animationDelay = isMobile ? impact.mobileAnimationDelay : impact.animationDelay;
    const style = animationStyle || "fade-up";
    const delay = index * (animationDelay || 100);
    const animations = {
      "fade-up": { opacity: 0, transform: "translateY(30px)", animation: `fadeInUp 0.6s ease-out ${delay}ms forwards` },
      "fade-down": { opacity: 0, transform: "translateY(-30px)", animation: `fadeInDown 0.6s ease-out ${delay}ms forwards` },
      "fade-left": { opacity: 0, transform: "translateX(30px)", animation: `fadeInLeft 0.6s ease-out ${delay}ms forwards` },
      "fade-right": { opacity: 0, transform: "translateX(-30px)", animation: `fadeInRight 0.6s ease-out ${delay}ms forwards` },
      "scale-up": { opacity: 0, transform: "scale(0.8)", animation: `scaleUp 0.6s ease-out ${delay}ms forwards` },
      "scale-down": { opacity: 0, transform: "scale(1.2)", animation: `scaleDown 0.6s ease-out ${delay}ms forwards` },
      "slide-up": { opacity: 0, transform: "translateY(100%)", animation: `slideUp 0.6s ease-out ${delay}ms forwards` },
      "slide-down": { opacity: 0, transform: "translateY(-100%)", animation: `slideDown 0.6s ease-out ${delay}ms forwards` },
      "rotate": { opacity: 0, transform: "scale(0.5) rotate(-45deg)", animation: `rotateIn 0.6s ease-out ${delay}ms forwards` },
      "none": {}
    };
    const baseStyle = animations[style] || animations["fade-up"];
    if (!inView) {
      return { opacity: 0, ...(baseStyle.transform ? { transform: baseStyle.transform } : {}) };
    }
    return baseStyle;
  };

  const [ref, inView] = useScrollReveal();

  return (
    <section ref={ref} className="py-20 px-4" style={{ backgroundColor }}>
      <style>{`
        @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInLeft { to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInRight { to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleUp { to { opacity: 1; transform: scale(1); } }
        @keyframes scaleDown { to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { to { opacity: 1; transform: translateY(0); } }
        @keyframes rotateIn { to { opacity: 1; transform: scale(1) rotate(0deg); } }
      `}</style>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: theme.textColor || "#064e3b" }}>
          {impact.title || "Our Impact"}
        </h2>
        <p className="text-center mb-12 max-w-2xl mx-auto" style={{ color: theme.mutedTextColor || "#475569" }}>
          {impact.description || "Transforming lives through renewable energy across Kenya"}
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {stories.map((story, index) => {
            const color = lightCardColors[index % lightCardColors.length];
            return (
              <div
                key={index}
                className="rounded-2xl overflow-hidden transition hover:scale-105 shadow-sm hover:shadow-md"
                style={{
                  backgroundColor: color.bg,
                  border: `1px solid ${color.border}`,
                  ...getAnimationStyle(index)
                }}
              >
                {story.imageUrl && (
                  <img src={story.imageUrl} alt={story.title} className="w-full h-48 object-cover" />
                )}
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-2" style={{ color: color.text }}>
                    {story.title}
                  </h3>
                  <p className="text-sm" style={{ color: theme.mutedTextColor || "#475569" }}>
                    {story.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const PartnersSection = ({ settings, theme }) => {
  const partners = settings.partners || {};
  const logos = partners.logos || [];
  const backgroundColor = partners.backgroundColor || "#ffffff";
  const trackLogos = logos.length > 0 ? [...logos, ...logos, ...logos] : [];

  return (
    <section className="py-20 px-4 overflow-hidden" style={{ backgroundColor }}>
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: theme.textColor || "#064e3b" }}>
          {partners.title || "Our Partners"}
        </h2>
        <p className="mb-12 max-w-2xl mx-auto" style={{ color: theme.mutedTextColor || "#475569" }}>
          {partners.description || "Working together to accelerate renewable energy adoption"}
        </p>
        {logos.length > 0 ? (
          <>
            <style>{`
              @keyframes partnerScroll { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }
              .partner-track { animation: partnerScroll 25s linear infinite; }
              .partner-track:hover { animation-play-state: paused; }
            `}</style>
            <div className="relative w-full">
              <div className="partner-track flex w-max items-center gap-12">
                {trackLogos.map((logo, index) => (
                  <img key={index} src={logo.url} alt={logo.alt || "Partner"} className="h-16 w-auto opacity-80 hover:opacity-100 transition select-none" draggable={false} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <p style={{ color: theme.mutedTextColor || "#475569" }}>Partner logos coming soon...</p>
        )}
      </div>
    </section>
  );
};

const ContactSection = ({ settings, theme }) => {
  const contact = settings.contact || {};
  const backgroundColor = contact.backgroundColor || "#f0fdf4";
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const getAnimationStyle = (index) => {
    const animationEnabled = isMobile ? contact.mobileAnimationEnabled : contact.animationEnabled;
    if (!animationEnabled) return {};
    const animationStyle = isMobile ? contact.mobileAnimationStyle : contact.animationStyle;
    const animationDelay = isMobile ? contact.mobileAnimationDelay : contact.animationDelay;
    const style = animationStyle || "fade-up";
    const delay = index * (animationDelay || 100);
    const animations = {
      "fade-up": { opacity: 0, transform: "translateY(40px)", animation: `fadeInUp 0.7s ease-out ${delay}ms forwards` },
      "fade-down": { opacity: 0, transform: "translateY(-40px)", animation: `fadeInDown 0.7s ease-out ${delay}ms forwards` },
      "fade-left": { opacity: 0, transform: "translateX(40px)", animation: `fadeInLeft 0.7s ease-out ${delay}ms forwards` },
      "fade-right": { opacity: 0, transform: "translateX(-40px)", animation: `fadeInRight 0.7s ease-out ${delay}ms forwards` },
      "scale-up": { opacity: 0, transform: "scale(0.85)", animation: `scaleUp 0.7s ease-out ${delay}ms forwards` },
      "scale-down": { opacity: 0, transform: "scale(1.15)", animation: `scaleDown 0.7s ease-out ${delay}ms forwards` },
      "slide-up": { opacity: 0, transform: "translateY(100%)", animation: `slideUp 0.7s ease-out ${delay}ms forwards` },
      "slide-down": { opacity: 0, transform: "translateY(-100%)", animation: `slideDown 0.7s ease-out ${delay}ms forwards` },
      "rotate": { opacity: 0, transform: "scale(0.6) rotate(-30deg)", animation: `rotateIn 0.7s ease-out ${delay}ms forwards` },
      "none": {}
    };
    const baseStyle = animations[style] || animations["fade-up"];
    if (!inView) {
      return { opacity: 0, ...(baseStyle.transform ? { transform: baseStyle.transform } : {}) };
    }
    return baseStyle;
  };

  const [ref, inView] = useScrollReveal();
  const primaryColor = theme.primaryColor || "#059669";
  const phoneRingEnabled = contact.phoneRingEnabled !== false;

  return (
    <section id="contact" ref={ref} className="py-20 px-4" style={{ backgroundColor }}>
      <style>{`
        @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInLeft { to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInRight { to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleUp { to { opacity: 1; transform: scale(1); } }
        @keyframes scaleDown { to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { to { opacity: 1; transform: translateY(0); } }
        @keyframes rotateIn { to { opacity: 1; transform: scale(1) rotate(0deg); } }
        @keyframes ringPulse { 0% { transform: scale(1); opacity: 0.55; } 100% { transform: scale(1.2); opacity: 0; } }
        @keyframes ringShake { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 20% { transform: translate(-1px, 1px) rotate(0.3deg); } 40% { transform: translate(1px, -1px) rotate(-0.3deg); } 60% { transform: translate(-1px, -1px) rotate(0.2deg); } 80% { transform: translate(1px, 1px) rotate(-0.2deg); } }
      `}</style>
      <div className="max-w-6xl mx-auto" style={getAnimationStyle(0)}>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: theme.textColor || "#064e3b" }}>
          {contact.title || "Get in Touch"}
        </h2>
        <p className="text-center mb-12 max-w-2xl mx-auto" style={{ color: theme.mutedTextColor || "#475569" }}>
          {contact.description || "Have questions? We're here to help"}
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="mx-auto max-w-[21.6rem] lg:max-w-[26.4rem] rounded-[2.5rem] p-3 lg:p-2 shadow-2xl relative" style={{ backgroundColor: "#1f2937", border: "4px solid #374151", animation: phoneRingEnabled ? "ringShake 0.25s ease-in-out infinite" : undefined }}>
            {phoneRingEnabled && (
              <>
                <div className="absolute -inset-2 rounded-[2.5rem] pointer-events-none" style={{ border: `2px solid ${primaryColor}`, opacity: 0.55, animation: "ringPulse 2s ease-out infinite" }} />
                <div className="absolute -inset-2 rounded-[2.5rem] pointer-events-none" style={{ border: `2px solid ${primaryColor}`, opacity: 0.55, animation: "ringPulse 2s ease-out infinite 0.6s" }} />
                <div className="absolute -inset-2 rounded-[2.5rem] pointer-events-none" style={{ border: `2px solid ${primaryColor}`, opacity: 0.55, animation: "ringPulse 2s ease-out infinite 1.2s" }} />
              </>
            )}
            <div className="relative rounded-[2rem] overflow-hidden h-full flex flex-col" style={{ backgroundColor: theme.surfaceBackground || "#ffffff" }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-28 rounded-b-xl" style={{ backgroundColor: "#1f2937" }} />
              <div className="pt-8 pb-4 px-6 lg:pt-6 lg:pb-3 lg:px-6 text-center border-b" style={{ borderColor: theme.borderColor || "#e5e7eb" }}>
                <div className="mx-auto h-1.5 w-12 rounded-full mb-2" style={{ backgroundColor: "#9ca3af" }} />
                <h3 className="text-lg font-bold" style={{ color: theme.textColor || "#064e3b" }}>Contact</h3>
              </div>
              <div className="p-6 space-y-4 lg:p-5 lg:space-y-3 flex-1">
                <a href={`mailto:${contact.email}`} className="flex items-center gap-3 p-3 rounded-xl transition hover:scale-105" style={{ backgroundColor: theme.surfaceMuted || "#f0fdf4" }}>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: theme.primaryColor || "#059669" }}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <div className="min-w-0">
                    <div className="text-xs font-bold" style={{ color: theme.primaryColor || "#059669" }}>Email</div>
                    <div className="text-sm break-all">{contact.email}</div>
                  </div>
                </a>
                <a href={`tel:${contact.phone}`} className="flex items-center gap-3 p-3 rounded-xl transition hover:scale-105" style={{ backgroundColor: theme.surfaceMuted || "#f0fdf4" }}>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: theme.primaryColor || "#059669" }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.8 12.8 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.8 12.8 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <div>
                    <div className="text-xs font-bold" style={{ color: theme.primaryColor || "#059669" }}>Phone</div>
                    <div className="text-sm">{contact.phone}</div>
                  </div>
                </a>
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: theme.surfaceMuted || "#f0fdf4" }}>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: theme.primaryColor || "#059669" }}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  <div>
                    <div className="text-xs font-bold" style={{ color: theme.primaryColor || "#059669" }}>Address</div>
                    <p className="text-sm">{contact.address}</p>
                  </div>
                </div>
                <div className="pt-4 lg:pt-2 flex-1 flex flex-col items-center justify-center text-center opacity-80">
                  <div className="text-xs font-semibold mb-3" style={{ color: theme.mutedTextColor || "#6b7280" }}>Tap an option to reach us</div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: theme.primaryColor || "#059669" }}>
                    <span>email</span>
                    <svg className="w-5 h-5 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
                    <span>phone</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center py-3 lg:py-2" style={{ backgroundColor: theme.surfaceBackground || "#ffffff" }}>
                <div className="h-1 w-24 rounded-full" style={{ backgroundColor: "#d1d5db" }} />
              </div>
            </div>
          </div>
          {contact.formEnabled && (
            <div className="h-full p-8 rounded-2xl flex flex-col" style={{ backgroundColor: theme.surfaceBackground || "#ffffff" }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: theme.textColor || "#064e3b" }}>
                Send us a message
              </h3>
              <div className="rounded-2xl p-[2px] flex-1" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${theme.secondaryColor || "#10b981"}, ${primaryColor})` }}>
                <form className="h-full p-6 rounded-2xl flex flex-col space-y-4" style={{ backgroundColor: theme.surfaceBackground || "#ffffff" }}>
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: theme.textColor || "#064e3b" }}>
                      Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border outline-none transition focus:ring-2"
                      style={{ borderColor: theme.borderColor || "#a7f3d0", backgroundColor: theme.surfaceMuted || "#f0fdf4" }}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: theme.textColor || "#064e3b" }}>
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 rounded-lg border outline-none transition focus:ring-2"
                      style={{ borderColor: theme.borderColor || "#a7f3d0", backgroundColor: theme.surfaceMuted || "#f0fdf4" }}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="block text-sm font-bold mb-2" style={{ color: theme.textColor || "#064e3b" }}>
                      Message
                    </label>
                    <textarea
                      className="w-full flex-1 min-h-[120px] px-4 py-3 rounded-lg border outline-none transition focus:ring-2 resize-none"
                      style={{ borderColor: theme.borderColor || "#a7f3d0", backgroundColor: theme.surfaceMuted || "#f0fdf4" }}
                      placeholder="Your message"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-6 py-3 rounded-lg font-bold text-white transition hover:scale-105 shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const FooterSection = ({ settings, theme }) => {
  const footer = settings.footer || {};
  const branding = settings.branding || {};
  const backgroundColor = footer.backgroundColor || "#064e3b";

  return (
    <footer className="py-12 px-4" style={{ backgroundColor, borderTop: `1px solid ${theme.borderColor || "#a7f3d0"}` }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            {branding.logoUrl && (
              <img src={branding.logoUrl} alt={branding.logoAlt || "Solar Mkononi"} className="h-12 mb-4" />
            )}
            <h3 className="text-xl font-bold mb-2" style={{ color: theme.textColor || "#064e3b" }}>
              {footer.title || "Solar Mkononi"}
            </h3>
            <p className="text-sm" style={{ color: theme.mutedTextColor || "#475569" }}>
              {footer.body || "Empowering Kenya with accessible renewable energy solutions"}
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4" style={{ color: theme.textColor || "#064e3b" }}>Quick Links</h4>
            <ul className="space-y-2">
              {footer.links?.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="hover:underline text-sm" style={{ color: theme.mutedTextColor || "#475569" }}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4" style={{ color: theme.textColor || "#064e3b" }}>Connect</h4>
            <div className="flex gap-4">
              {footer.socialLinks?.map((social, index) => (
                <a key={index} href={social.url} target="_blank" rel="noopener noreferrer" className="text-2xl">
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="text-center pt-8" style={{ borderTop: `1px solid ${theme.borderColor || "#a7f3d0"}` }}>
          <p className="text-sm" style={{ color: theme.mutedTextColor || "#475569" }}>
            {footer.copyright || "© 2026 Solar Mkononi. All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SolarMkononiPage;
