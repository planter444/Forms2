export const defaultSiteSettings = {
  brandName: "KEREA Listing Portal",
  supportLabel: "Certified renewable energy stakeholders in Kenya",
  heroBadge: "Trusted intake for the KEREA USSD discovery platform",
  heroTitle: "A simple, secure way for renewable energy stakeholders to request listing.",
  heroDescription:
    "Collect consent, contact information, category, and location details in a professional flow designed for fast mobile completion across Kenya.",
  heroPrimaryCta: "Start form now",
  heroSecondaryCta: "Learn more",
  heroStats: [
    { value: "5 min", label: "Average completion time" },
    { value: "47", label: "Counties supported in search" },
    { value: "100%", label: "Mobile-responsive experience" }
  ],
  landingHighlights: [
    "Consent to be listed on the KEREA USSD platform",
    "Contact and professional information for review",
    "County of operation for better discoverability",
    "Optional reason if you prefer not to be listed"
  ],
  whyItMattersTitle: "Why this matters",
  whyItMattersBody:
    "Accurate entries help clients identify verified solar, biodigester, and financing stakeholders more quickly while keeping the directory relevant and trustworthy.",
  howItWorksTitle: "Built for clarity, speed, and trust.",
  howItWorksSteps: [
    {
      title: "Share consent",
      body: "Confirm whether you would like your organization or service to be considered for listing."
    },
    {
      title: "Provide key details",
      body: "If you consent, add your name, phone number, category, and county using touch-friendly controls."
    },
    {
      title: "Submit for review",
      body: "Review everything on one screen before sending your information to the KEREA team."
    }
  ],
  formPageTitle: "KEREA USSD platform listing request",
  formPageDescription:
    "Complete the short form below. Required fields are validated as you move through each step.",
  formTips: [
    "Use an email address you check regularly.",
    "If you consent to listing, keep your phone number and county details ready.",
    "Your information will be reviewed before publication on the platform."
  ],
  formStepTips: {
    consent: [
      "Use an email address you check regularly.",
      "If you proceed to listing, keep your phone number and county details ready.",
      "Your information will be reviewed before publication on the platform."
    ],
    details: [
      "Enter the name exactly as it should appear on the KEREA USSD platform.",
      "Use a phone number that customers or the KEREA team can reliably reach.",
      "Select every service category that properly describes your work."
    ],
    location: [
      "Choose each county where you actively operate.",
      "Use the sub-county and ward choices to make your listing easier to find.",
      "Add another county if your services cover more than one area."
    ],
    review: [
      "Check your email, phone number, service categories, and coverage areas.",
      "Use the Edit buttons if anything needs correction before submission.",
      "Submit only when the details are accurate and ready for review."
    ],
    decline: [
      "You can leave a short note if you do not want to be listed right now.",
      "Your preference will be recorded without publishing a listing.",
      "You can return later if your organization decides to participate."
    ]
  },
  formBanner: "Clear flow, mobile-friendly controls, and fast submission.",
  successTitle:
    "Thank you! Your information has been received and will be reviewed before listing.",
  successBodyConsented:
    "Our team will review the details you shared for the KEREA USSD platform.",
  successBodyDeclined:
    "We appreciate your response and will keep your preference on record.",
  footer: {
    enabled: true,
    layout: "columns",
    title: "KEREA Listing Portal",
    body: "Helping Kenyan renewable energy stakeholders share accurate listing information for better client discovery.",
    links: [
      { label: "Start form", href: "/form" },
      { label: "Learn more", href: "#how-it-works" }
    ],
    supportTitle: "Need help?",
    supportPhone: "",
    supportEmail: "",
    note: "© 2026 KEREA. All rights reserved."
  },
  branding: {
    logoUrl: "",
    logoAlt: "KEREA logo",
    faviconUrl: "",
    browserTitle: "KEREA Listing Portal"
  },
  theme: {
    palette: "sky",
    heroLayout: "split",
    backgroundStyle: "soft",
    pattern: "waves",
    patternsEnabled: true,
    patternMotion: true,
    mobileBackgroundStyle: "soft",
    desktopBackgroundStyle: "glow",
    mobilePattern: "dots",
    desktopPattern: "waves",
    mobilePatternsEnabled: true,
    desktopPatternsEnabled: true,
    mobilePatternMotion: false,
    desktopPatternMotion: true,
    mobileCtaTrace: true,
    desktopCtaTrace: true,
    mobileCtaAnimation: "pulse",
    desktopCtaAnimation: "pulse",
    heroCtaAnimation: "white-line",
    mobileHeroAnimation: "float",
    desktopHeroAnimation: "shake",
    mobileLoadAnimation: "rise",
    desktopLoadAnimation: "stagger",
    ctaPulse: true,
    formTipsLayout: "row",
    mobileHeaderSize: "large",
    desktopHeroTitleFontSize: 48,
    desktopHomepageSize: "large",
    desktopHomepageScale: 115,
    mobilePageLoadEnabled: true,
    desktopPageLoadEnabled: true,
    mobilePageLoadAnimation: "pop",
    desktopPageLoadAnimation: "fade",
    colors: {
      primary: "#2563eb",
      primaryDeep: "#1d4ed8",
      primarySoft: "#dbeafe",
      primaryGlow: "rgba(37, 99, 235, 0.18)",
      textOnPrimary: "#ffffff",
      accent: "#eff6ff",
      accentStrong: "#1e3a8a",
      pageBackground: "#f8fbff",
      pageBackgroundAlt: "#ffffff",
      surfaceBackground: "#ffffff",
      surfaceMuted: "#f3f8ff",
      fieldBackground: "#f8fbff",
      guidanceBackground: "#eaf5ff",
      guidanceCardBackground: "#ffffff",
      guidanceBorderColor: "#bfdbfe",
      headerBackground: "rgba(255, 255, 255, 0.92)",
      footerBackground: "#ffffff",
      footerTextColor: "#0f172a",
      footerMutedTextColor: "#475569",
      footerButtonBackground: "#ffffff",
      footerButtonTextColor: "#0f172a",
      ctaTraceColor: "#ffffff",
      ctaTraceAccent: "#dbeafe",
      borderColor: "#dbeafe",
      textColor: "#0f172a",
      mutedTextColor: "#475569"
    }
  }
};

export const paletteOptions = ["sky", "emerald", "teal", "lavender", "slate", "sunrise", "midnight", "forest"];
export const appearancePresetOptions = ["original", "green"];
export const patternOptions = ["orbs", "grid", "waves", "rings", "dots", "mesh"];
export const backgroundOptions = ["soft", "glow", "contrast"];

const paletteMap = {
  sky: {
    primary: "#2563eb",
    primaryDeep: "#1d4ed8",
    primarySoft: "#dbeafe",
    primaryGlow: "rgba(37, 99, 235, 0.18)",
    textOnPrimary: "#ffffff",
    accent: "#eff6ff",
    accentStrong: "#1e3a8a",
    pageBackground: "#f8fbff",
    pageBackgroundAlt: "#ffffff",
    surfaceBackground: "#ffffff",
    surfaceMuted: "#f3f8ff",
    fieldBackground: "#f8fbff",
    guidanceBackground: "#eaf5ff",
    guidanceCardBackground: "#ffffff",
    guidanceBorderColor: "#bfdbfe",
    headerBackground: "rgba(255, 255, 255, 0.92)",
    footerBackground: "#ffffff",
    footerTextColor: "#0f172a",
    footerMutedTextColor: "#475569",
    footerButtonBackground: "#ffffff",
    footerButtonTextColor: "#0f172a",
    ctaTraceColor: "#ffffff",
    ctaTraceAccent: "#dbeafe",
    borderColor: "#dbeafe",
    textColor: "#0f172a",
    mutedTextColor: "#475569"
  },
  emerald: {
    primary: "#1f9d5c",
    primaryDeep: "#13663d",
    primarySoft: "#d8f3e3",
    primaryGlow: "rgba(31, 157, 92, 0.18)",
    textOnPrimary: "#ffffff",
    accent: "#ecfdf3",
    accentStrong: "#065f46",
    pageBackground: "#f7fcf9",
    pageBackgroundAlt: "#ffffff",
    surfaceBackground: "#ffffff",
    surfaceMuted: "#f2fbf6",
    fieldBackground: "#f7fcf9",
    guidanceBackground: "#ecfdf5",
    guidanceCardBackground: "#ffffff",
    guidanceBorderColor: "#bbf7d0",
    headerBackground: "rgba(255, 255, 255, 0.92)",
    footerBackground: "#ffffff",
    footerTextColor: "#0f172a",
    footerMutedTextColor: "#475569",
    footerButtonBackground: "#ffffff",
    footerButtonTextColor: "#064e3b",
    ctaTraceColor: "#ffffff",
    ctaTraceAccent: "#bbf7d0",
    borderColor: "#d7f5e1",
    textColor: "#0f172a",
    mutedTextColor: "#475569"
  },
  forest: {
    primary: "#2f855a",
    primaryDeep: "#22543d",
    primarySoft: "#def7e5",
    primaryGlow: "rgba(47, 133, 90, 0.18)",
    textOnPrimary: "#ffffff",
    accent: "#effaf3",
    accentStrong: "#22543d",
    pageBackground: "#f7fbf8",
    pageBackgroundAlt: "#ffffff",
    surfaceBackground: "#ffffff",
    surfaceMuted: "#f2f8f4",
    fieldBackground: "#f6fbf7",
    guidanceBackground: "#e8f8ed",
    guidanceCardBackground: "#f8fff9",
    guidanceBorderColor: "#9ae6b4",
    headerBackground: "rgba(255, 255, 255, 0.94)",
    footerBackground: "#ffffff",
    footerTextColor: "#0f172a",
    footerMutedTextColor: "#475569",
    footerButtonBackground: "#ffffff",
    footerButtonTextColor: "#14532d",
    ctaTraceColor: "#ffffff",
    ctaTraceAccent: "#bbf7d0",
    borderColor: "#d8eee0",
    textColor: "#0f172a",
    mutedTextColor: "#475569"
  },
  teal: {
    primary: "#0f766e",
    primaryDeep: "#134e4a",
    primarySoft: "#ccfbf1",
    primaryGlow: "rgba(15, 118, 110, 0.18)",
    textOnPrimary: "#ffffff",
    accent: "#ecfeff",
    accentStrong: "#115e59",
    pageBackground: "#f5fcfc",
    pageBackgroundAlt: "#ffffff",
    surfaceBackground: "#ffffff",
    surfaceMuted: "#eefafa",
    fieldBackground: "#f3fbfb",
    headerBackground: "rgba(255, 255, 255, 0.92)",
    borderColor: "#d2f3f0",
    textColor: "#0f172a",
    mutedTextColor: "#475569"
  },
  lavender: {
    primary: "#7c3aed",
    primaryDeep: "#6d28d9",
    primarySoft: "#ede9fe",
    primaryGlow: "rgba(124, 58, 237, 0.18)",
    textOnPrimary: "#ffffff",
    accent: "#f5f3ff",
    accentStrong: "#5b21b6",
    pageBackground: "#faf9ff",
    pageBackgroundAlt: "#ffffff",
    surfaceBackground: "#ffffff",
    surfaceMuted: "#f6f4ff",
    fieldBackground: "#faf8ff",
    headerBackground: "rgba(255, 255, 255, 0.92)",
    borderColor: "#e7dcff",
    textColor: "#0f172a",
    mutedTextColor: "#475569"
  },
  slate: {
    primary: "#334155",
    primaryDeep: "#1e293b",
    primarySoft: "#e2e8f0",
    primaryGlow: "rgba(51, 65, 85, 0.16)",
    textOnPrimary: "#ffffff",
    accent: "#f8fafc",
    accentStrong: "#334155",
    pageBackground: "#fbfdff",
    pageBackgroundAlt: "#ffffff",
    surfaceBackground: "#ffffff",
    surfaceMuted: "#f8fafc",
    fieldBackground: "#f8fbfd",
    headerBackground: "rgba(255, 255, 255, 0.94)",
    borderColor: "#e2e8f0",
    textColor: "#0f172a",
    mutedTextColor: "#475569"
  },
  sunrise: {
    primary: "#ea580c",
    primaryDeep: "#9a3412",
    primarySoft: "#ffedd5",
    primaryGlow: "rgba(234, 88, 12, 0.18)",
    textOnPrimary: "#ffffff",
    accent: "#fff7ed",
    accentStrong: "#9a3412",
    pageBackground: "#fffaf5",
    pageBackgroundAlt: "#ffffff",
    surfaceBackground: "#ffffff",
    surfaceMuted: "#fff7ef",
    fieldBackground: "#fffaf4",
    headerBackground: "rgba(255, 255, 255, 0.92)",
    borderColor: "#ffe4c7",
    textColor: "#0f172a",
    mutedTextColor: "#475569"
  },
  midnight: {
    primary: "#4338ca",
    primaryDeep: "#312e81",
    primarySoft: "#e0e7ff",
    primaryGlow: "rgba(67, 56, 202, 0.18)",
    textOnPrimary: "#ffffff",
    accent: "#eef2ff",
    accentStrong: "#312e81",
    pageBackground: "#f7f8ff",
    pageBackgroundAlt: "#ffffff",
    surfaceBackground: "#ffffff",
    surfaceMuted: "#f1f3ff",
    fieldBackground: "#f5f6ff",
    headerBackground: "rgba(255, 255, 255, 0.92)",
    borderColor: "#dde4ff",
    textColor: "#0f172a",
    mutedTextColor: "#475569"
  }
};

export const getPalette = (settings) => {
  const basePalette = paletteMap[settings?.theme?.palette] || paletteMap[defaultSiteSettings.theme.palette];
  const overrides = settings?.theme?.colors || {};

  return {
    ...defaultSiteSettings.theme.colors,
    ...basePalette,
    ...overrides
  };
};

export const mergeSettings = (base, updates) => {
  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    return base;
  }

  const next = Array.isArray(base) ? [...base] : { ...base };

  Object.entries(updates).forEach(([key, value]) => {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      base[key] &&
      typeof base[key] === "object" &&
      !Array.isArray(base[key])
    ) {
      next[key] = mergeSettings(base[key], value);
      return;
    }

    next[key] = value;
  });

  return next;
};
