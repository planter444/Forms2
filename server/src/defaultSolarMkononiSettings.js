export const defaultSolarMkononiSettings = {
  brandName: "Solar Mkononi",
  browserTitle: "Solar Mkononi - Renewable Energy at Your Fingertips",
  
  hero: {
    headline: "Renewable Energy at Your Fingertips",
    description: "Connect with verified renewable energy suppliers, technicians, financial institutions, and innovative clean energy solutions through Solar Mkononi.",
    primaryCta: "Explore Services",
    primaryCtaHref: "#services",
    secondaryCta: "Access USSD Platform",
    secondaryCtaHref: "#ussd",
    backgroundType: "image",
    backgroundUrl: "",
    backgroundUrlMobile: "",
    overlayOpacity: 0.5,
    useDesktopOnMobile: false,
    videoUrl: "",
    enabled: true
  },

  stats: {
    enabled: true,
    gradientColor: "#059669",
    gradientEnd: "#86efac",
    items: [
      { label: "Verified Suppliers", value: "500+" },
      { label: "Solar Installers", value: "200+" },
      { label: "Financial Institutions", value: "50+" },
      { label: "Counties Covered", value: "47" },
      { label: "Registered Users", value: "10,000+" }
    ]
  },

  services: {
    enabled: true,
    title: "Our Services",
    description: "Comprehensive renewable energy solutions for Kenya",
    animationEnabled: true,
    animationStyle: "fade-up",
    animationDelay: 100,
    mobileAnimationEnabled: true,
    mobileAnimationStyle: "fade-up",
    mobileAnimationDelay: 100,
    mobileCarouselDelay: 5,
    backgroundColor: "#f0fdf4",
    backgroundPattern: "none",
    cards: [
      {
        title: "Solar Suppliers",
        description: "Access verified solar panel and equipment suppliers across Kenya",
        icon: "sun"
      },
      {
        title: "Solar Installers",
        description: "Connect with certified solar installation professionals",
        icon: "wrench"
      },
      {
        title: "Solar Financing",
        description: "Find financial institutions offering solar financing options",
        icon: "bank"
      },
      {
        title: "Biodigester Suppliers",
        description: "Get biodigester systems from trusted suppliers",
        icon: "leaf"
      },
      {
        title: "Biodigester Financing",
        description: "Financing options for biodigester installations",
        icon: "coins"
      },
      {
        title: "Bio-Slurry Suppliers",
        description: "Connect with bio-slurry suppliers for organic farming",
        icon: "droplet"
      }
    ]
  },

  howItWorks: {
    enabled: true,
    title: "How It Works",
    backgroundColor: "#ffffff",
    backgroundPattern: "none",
    animationEnabled: true,
    animationStyle: "fade-up",
    animationDelay: 100,
    mobileAnimationEnabled: true,
    mobileAnimationStyle: "fade-up",
    mobileAnimationDelay: 100,
    steps: [
      {
        title: "Access Platform",
        description: "Dial *789*788# to access the USSD platform from any mobile phone",
        icon: "phone"
      },
      {
        title: "Find Services",
        description: "Browse and search for renewable energy services in your area",
        icon: "search"
      },
      {
        title: "Connect with Providers",
        description: "Get contact details and connect directly with verified providers",
        icon: "link"
      },
      {
        title: "Grow with Renewable Energy",
        description: "Access clean energy solutions and grow your business or home",
        icon: "growth"
      }
    ]
  },

  ussd: {
    enabled: true,
    title: "Access via USSD",
    description: "No internet? No problem. Access our platform directly from your mobile phone",
    dialCode: "*789*788#",
    animationEnabled: true,
    animationStyle: "fade-up",
    animationDelay: 100,
    mobileAnimationEnabled: true,
    mobileAnimationStyle: "fade-up",
    mobileAnimationDelay: 100,
    instructions: [
      "Open your phone's dialer",
      "Enter *789*788#",
      "Press the call button",
      "Follow the menu prompts"
    ],
    screenshotUrl: "",
    backgroundColor: "#15803d",
    backgroundPattern: "none"
  },

  paygo: {
    enabled: true,
    title: "PAYGO Solutions",
    description: "Pay-as-you-go solar solutions for affordable clean energy access",
    animationEnabled: true,
    animationStyle: "fade-up",
    animationDelay: 100,
    mobileAnimationEnabled: true,
    mobileAnimationStyle: "fade-up",
    mobileAnimationDelay: 100,
    backgroundColor: "#f0fdf4",
    backgroundPattern: "none",
    items: [
      {
        title: "Solar Pumps",
        description: "Affordable solar water pumps for irrigation and domestic use"
      },
      {
        title: "Solar Lighting",
        description: "Pay-as-you-go solar lighting systems for homes and businesses"
      },
      {
        title: "PAYGO Technology",
        description: "Flexible payment plans that make solar accessible to everyone"
      },
      {
        title: "Clean Cooking",
        description: "Coming soon: PAYGO clean cooking solutions"
      }
    ]
  },

  resourceLibrary: {
    enabled: true,
    title: "Resource Library",
    description: "Access policies, best practices, and sector guides",
    backgroundColor: "#eff6ff",
    backgroundPattern: "none",
    animationEnabled: true,
    animationStyle: "fade-up",
    animationDelay: 100,
    mobileAnimationEnabled: true,
    mobileAnimationStyle: "fade-up",
    mobileAnimationDelay: 100,
    resources: []
  },

  solarResourceLibrary: {
    hero: {
      eyebrow: "Solar Mkononi Resource Library",
      headline: "Curated knowledge for Kenya's clean energy leaders",
      description: "Search verified playbooks, policy briefs, financial toolkits, and implementation guides maintained by KEREA's working groups.",
      primaryCta: "Start exploring",
      primaryHref: "#library-feed",
      searchPlaceholder: "Search policies, toolkits, best practices...",
      backgroundImageUrl: "",
      desktopBackgroundImageUrl: "",
      mobileBackgroundImageUrl: "",
      overlayColor: "#044e38",
      overlayOpacity: 0.5
    },
    nav: {
      opacity: 0.85,
      slideDirection: "left"
    },
    stats: {
      tagline: "Powered by Kenya Renewable Energy Association",
      cards: [
        { label: "Resources curated", value: "150+" },
        { label: "Categories covered", value: "5" },
        { label: "Partners contributing", value: "25+" }
      ]
    },
    quickLinks: [
      {
        label: "Policy & Regulation",
        description: "Licensing guides, compliance templates, policy briefs",
        categorySlug: "policy-regulations",
        accentColor: "#0f766e"
      },
      {
        label: "Technical Guides",
        description: "Installation manuals, QA/QC checklists, safety posters",
        categorySlug: "technical-guides",
        accentColor: "#2563eb"
      },
      {
        label: "Business & Finance",
        description: "Investment decks, PAYGO models, business cases",
        categorySlug: "business-finance",
        accentColor: "#c2410c"
      },
      {
        label: "Training & Toolkits",
        description: "Curriculum, facilitator resources, cohort exercises",
        categorySlug: "training-toolkits",
        accentColor: "#7c3aed"
      }
    ],
    featured: {
      title: "Featured resources",
      description: "Timely releases handpicked by the Solar Mkononi secretariat."
    },
    feed: {
      columns: 2
    },
    filters: {
      sortOptions: [
        { value: "featured", label: "Featured first" },
        { value: "newest", label: "Newest" },
        { value: "popular", label: "Most downloaded" },
        { value: "alpha", label: "A → Z" }
      ],
      fileTypeLabels: {
        pdf: "PDF",
        doc: "Word Doc",
        docx: "Word Doc",
        xls: "Spreadsheet",
        xlsx: "Spreadsheet",
        csv: "Data",
        ppt: "Slide deck",
        pptx: "Slide deck",
        mp4: "Video",
        mp3: "Audio",
        zip: "Toolkit",
        json: "Dataset",
        txt: "Notes"
      }
    },
    emptyState: {
      title: "Resources are being curated",
      description: "Check back soon or reach out to the KEREA policy desk if you need a custom information pack.",
      actionLabel: "Contact KEREA",
      actionHref: "mailto:info@kerea.org"
    },
    cta: {
      title: "Can't find what you need?",
      body: "Our policy and technical working groups can help curate bespoke kits for counties, utilities, and enterprises.",
      primaryText: "Request support",
      primaryHref: "mailto:info@kerea.org",
      secondaryText: "Visit Solar Mkononi",
      secondaryHref: "/solar-mkononi"
    },
    focusAreas: [
      "Policies and regulations for Kenya's renewable energy landscape",
      "Technical implementation guides for PAYGO, solar, and biodigesters",
      "Business playbooks, financing toolkits, and investment decks",
      "Facilitator toolkits, training curricula, and cohort exercises"
    ],
    mobileAnimation: {
      enabled: true,
      delay: 100,
      duration: 600
    },
    seo: {
      title: "Solar Mkononi Resource Library | KEREA",
      description: "Download policies, business playbooks, training decks, and verified clean energy resources curated by KEREA."
    }
  },

  impact: {
    enabled: true,
    title: "Our Impact",
    description: "Transforming lives through renewable energy across Kenya",
    animationEnabled: true,
    animationStyle: "fade-up",
    animationDelay: 100,
    mobileAnimationEnabled: true,
    mobileAnimationStyle: "fade-up",
    mobileAnimationDelay: 100,
    backgroundColor: "#ffffff",
    backgroundPattern: "none",
    stories: [
      {
        title: "Lighting Up Rural Kenya",
        description: "How solar solutions are bringing electricity to remote communities",
        imageUrl: ""
      },
      {
        title: "Empowering Women Entrepreneurs",
        description: "Supporting women-led renewable energy businesses",
        imageUrl: ""
      },
      {
        title: "Sustainable Agriculture",
        description: "Biodigesters and bio-slurry transforming farming practices",
        imageUrl: ""
      }
    ]
  },

  partners: {
    enabled: true,
    title: "Our Partners",
    description: "Working together to accelerate renewable energy adoption",
    backgroundColor: "#ffffff",
    backgroundPattern: "none",
    animationDelay: 100,
    logos: []
  },

  contact: {
    enabled: true,
    title: "Get in Touch",
    description: "Have questions? We're here to help",
    email: "info@solarmkononi.org",
    phone: "+254 700 000 000",
    address: "Nairobi, Kenya",
    formEnabled: true,
    recipientEmail: "info@solarmkononi.org",
    backgroundColor: "#f0fdf4",
    backgroundPattern: "none",
    animationEnabled: true,
    animationStyle: "fade-up",
    animationDelay: 100,
    mobileAnimationEnabled: true,
    mobileAnimationStyle: "fade-up",
    mobileAnimationDelay: 100,
    phoneRingEnabled: true
  },

  footer: {
    enabled: true,
    title: "Solar Mkononi",
    body: "Empowering Kenya with accessible renewable energy solutions",
    links: [
      { label: "About Us", href: "#about" },
      { label: "Services", href: "#services" },
      { label: "Contact", href: "#contact" }
    ],
    socialLinks: [],
    copyright: "© 2026 Solar Mkononi. All rights reserved.",
    backgroundColor: "#064e3b",
    backgroundPattern: "none",
    animationDelay: 100
  },

  registration: {
    enabled: true,
    title: "Register as a Stakeholder",
    description: "Join our network of renewable energy providers and partners",
    buttonText: "Register Now",
    link: "https://ussd.kerea.org",
    backgroundColor: "#15803d",
    backgroundPattern: "wave",
    animationDelay: 100
  },

  branding: {
    logoUrl: "",
    logoAlt: "Solar Mkononi logo",
    faviconUrl: "",
    heroBackgroundUrl: "",
    bannerUrls: []
  },

  theme: {
    palette: "emerald",
    primaryColor: "#059669",
    secondaryColor: "#10b981",
    accentColor: "#d1fae5",
    backgroundColor: "#f0fdf4",
    textColor: "#064e3b",
    mutedTextColor: "#475569",
    borderColor: "#a7f3d0",
    surfaceBackground: "#ffffff",
    surfaceMuted: "#f0fdf4",
    navOpacity: 0.85,
    navSlideDirection: "left",
    desktopHomepageSize: 0.9
  },

  sections: {
    hero: true,
    stats: true,
    services: true,
    registration: true,
    howItWorks: true,
    ussd: true,
    paygo: true,
    resourceLibrary: true,
    impact: true,
    partners: true,
    contact: true,
    footer: true
  },

  wri: {
    enabled: true,
    hero: {
      title: "Africa–China Renewable Energy Partnership",
      subtitle: "Connecting Kenya's Renewable Energy Sector with Chinese Technology, Investment and Business Opportunities.",
      introduction: "This dedicated hub facilitates B2B linkages, partnership enquiries, events, business opportunities, knowledge sharing, and stakeholder engagement between Kenya and China in the renewable energy sector.",
      primaryCta: "Make a Partnership Enquiry",
      secondaryCta: "Browse Business Database",
      backgroundImageUrl: "",
      overlayOpacity: 0.3
    },
    about: {
      title: "About the Partnership",
      description: "The Kenya–China Renewable Energy Partnership focuses on strengthening collaboration across key areas:",
      focusAreas: [
        "Kenya–China B2B linkages",
        "Technology transfer",
        "Investment opportunities",
        "Local manufacturing and assembly",
        "Skills development",
        "Standards and quality assurance",
        "Renewable energy collaboration"
      ]
    },
    technologyAreas: [
      { id: "solar", title: "Solar", description: "Solar PV systems, components, and manufacturing" },
      { id: "energy-storage", title: "Energy Storage", description: "Battery systems and energy storage solutions" },
      { id: "e-mobility", title: "E-Mobility", description: "Electric vehicles and charging infrastructure" },
      { id: "pure", title: "Productive Use of Renewable Energy (PURE)", description: "Solar-powered appliances and productive equipment" },
      { id: "green-manufacturing", title: "Green Manufacturing", description: "Sustainable manufacturing and assembly" },
      { id: "other", title: "Other Renewable Energy Technologies", description: "Wind, hydro, biomass, and other clean energy tech" }
    ],
    b2bOpportunities: [
      "Technology partnerships",
      "Suppliers/distributors",
      "Investment",
      "Financing",
      "Manufacturing/assembly",
      "Technical partnerships",
      "Market entry"
    ],
    enquiry: {
      title: "Partnership Enquiry",
      description: "Submit your enquiry to explore partnership opportunities with Chinese renewable energy companies and stakeholders.",
      organisationTypes: [
        "Company",
        "Government Agency",
        "Research Institution",
        "NGO/Non-profit",
        "Financial Institution",
        "Development Partner",
        "Industry Association",
        "Other"
      ],
      technologySectors: [
        "Solar PV",
        "Energy Storage",
        "E-Mobility",
        "PURE",
        "Green Manufacturing",
        "Wind",
        "Hydro",
        "Biomass",
        "Other"
      ],
      areasOfInterest: [
        "Technology Transfer",
        "Investment Opportunities",
        "Market Entry",
        "Manufacturing Partnership",
        "Distribution Partnership",
        "Technical Collaboration",
        "Skills Development",
        "Standards & Quality Assurance",
        "Policy & Regulation",
        "Other"
      ],
      enquiryTypes: [
        "General Enquiry",
        "Partnership Proposal",
        "Investment Inquiry",
        "Technology Inquiry",
        "Market Information",
        "Event Participation",
        "Other"
      ]
    },
    events: {
      title: "Events",
      description: "Stay updated on upcoming Kenya–China partnership events and activities."
    },
    partners: {
      title: "Partners & Stakeholders",
      description: "Approved organisations and partners participating in the Kenya–China Renewable Energy Partnership."
    },
    resources: {
      title: "Resources",
      description: "Access reports, policy briefs, research, publications, and event reports.",
      resourceTypes: [
        "Report",
        "Policy Brief",
        "Research",
        "Publication",
        "Event Report",
        "Other"
      ]
    },
    businessDatabase: {
      title: "Business Database",
      description: "Search the directory of participating businesses approved for public display."
    }
  }
};
