export const patternOptions = [
  "orbs",
  "grid",
  "waves",
  "rings",
  "dots",
  "mesh"
];

export const paletteOptions = [
  "sky",
  "emerald",
  "teal",
  "lavender",
  "slate",
  "sunrise",
  "midnight",
  "forest"
];

export const backgroundOptions = [
  "soft",
  "glow",
  "contrast"
];

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
    {
      value: "5 min",
      label: "Average completion time"
    },
    {
      value: "47",
      label: "Counties supported in search"
    },
    {
      value: "100%",
      label: "Mobile-responsive experience"
    }
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
      {
        label: "Start form",
        href: "/form"
      },
      {
        label: "Learn more",
        href: "#how-it-works"
      }
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
