import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { getSolarMkononiSettings } from "../lib/api.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

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

const WriNav = ({ settings, overHero = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);
  const primaryColor = overHero ? "#ffffff" : "#059669";
  const textColor = overHero ? "#ffffff" : "#064e3b";
  const backgroundColor = "#f0fdf4";
  const borderColor = overHero ? "rgba(255,255,255,0.3)" : "#a7f3d0";
  const navOpacity = overHero ? 1 : 0.85;
  const slideDirection = "left";

  const navItems = [
    { label: "About", href: "#about", to: null },
    { label: "Areas", href: "#areas", to: null },
    { label: "B2B", href: "#opportunities", to: null },
    { label: "Enquiry", href: "#enquiry", to: null },
    { label: "Events", href: "#events", to: null },
    { label: "Partners", href: "#partners", to: null },
    { label: "Resources", href: "#resources", to: null },
    { label: "Database", href: "#business-database", to: null }
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
            <span className="text-lg md:text-xl font-bold whitespace-nowrap" style={{ color: primaryColor }}>
              Africa–China Partnership
            </span>

            <nav className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) =>
                item.to ? (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="rounded-full px-3 py-2 text-xs md:text-sm font-medium transition hover:opacity-80"
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
                    className="rounded-full px-3 py-2 text-xs md:text-sm font-medium transition hover:opacity-80"
                    style={{ color: textColor }}
                  >
                    {item.label}
                  </a>
                )
              )}
            </nav>

            <button
              type="button"
              className="rounded-xl border p-2 lg:hidden"
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
              className="fixed inset-0 z-40 lg:hidden"
              style={{ backgroundColor: "rgba(0,0,0,0.25)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", animation: "navFadeIn 0.2s ease-out" }}
              onClick={() => setMenuOpen(false)}
            />
            <nav
              className="fixed top-0 z-50 h-screen w-72 border-r shadow-2xl lg:hidden"
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

const technologyAreas = [
  { id: "solar", title: "Solar", description: "Solar PV systems, components, and manufacturing" },
  { id: "energy-storage", title: "Energy Storage", description: "Battery systems and energy storage solutions" },
  { id: "e-mobility", title: "E-Mobility", description: "Electric vehicles and charging infrastructure" },
  { id: "pure", title: "Productive Use of Renewable Energy (PURE)", description: "Solar-powered appliances and productive equipment" },
  { id: "green-manufacturing", title: "Green Manufacturing", description: "Sustainable manufacturing and assembly" },
  { id: "other", title: "Other Renewable Energy Technologies", description: "Wind, hydro, biomass, and other clean energy tech" }
];

const b2bOpportunities = [
  "Technology partnerships",
  "Suppliers/distributors",
  "Investment",
  "Financing",
  "Manufacturing/assembly",
  "Technical partnerships",
  "Market entry"
];

const organisationTypes = [
  "Company",
  "Government Agency",
  "Research Institution",
  "NGO/Non-profit",
  "Financial Institution",
  "Development Partner",
  "Industry Association",
  "Other"
];

const technologySectors = [
  "Solar PV",
  "Energy Storage",
  "E-Mobility",
  "PURE",
  "Green Manufacturing",
  "Wind",
  "Hydro",
  "Biomass",
  "Other"
];

const areasOfInterest = [
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
];

const enquiryTypes = [
  "General Enquiry",
  "Partnership Proposal",
  "Investment Inquiry",
  "Technology Inquiry",
  "Market Information",
  "Event Participation",
  "Other"
];

const resourceTypes = [
  "Report",
  "Policy Brief",
  "Research",
  "Publication",
  "Event Report",
  "Other"
];

const WriPartnershipPage = () => {
  const [settings, setSettings] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [events, setEvents] = useState([]);
  const [partners, setPartners] = useState([]);
  const [resources, setResources] = useState([]);
  const [enquiryForm, setEnquiryForm] = useState({
    name: "",
    organisation: "",
    country: "",
    email: "",
    phone: "",
    organisation_type: "",
    technology_sector: "",
    area_of_interest: "",
    enquiry_type: "",
    message: ""
  });
  const [enquiryAttachment, setEnquiryAttachment] = useState(null);
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState(false);
  const [surveyForm, setSurveyForm] = useState({
    company_name: "",
    contact_person: "",
    position: "",
    email: "",
    phone: "",
    nature_of_business: [],
    technologies: [],
    engages_chinese_partners: "",
    collaboration_types: [],
    engagement_duration: "",
    challenges: [],
    support_needed: [],
    future_interest: "",
    interested_activities: [],
    additional_comments: ""
  });
  const [surveySubmitting, setSurveySubmitting] = useState(false);
  const [surveySuccess, setSurveySuccess] = useState(false);
  const [businessFilters, setBusinessFilters] = useState({
    country: "",
    technology: "",
    organisation_type: "",
    nature_of_business: "",
    partnership_interest: ""
  });
  useEffect(() => {
    window.scrollTo(0, 0);
    const loadSettings = async () => {
      try {
        const data = await getSolarMkononiSettings();
        setSettings(data);
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
    fetchBusinesses();
    fetchEvents();
    fetchPartners();
    fetchResources();
  }, []);

  useEffect(() => {
    fetchBusinesses(businessFilters);
  }, [businessFilters]);

  const fetchBusinesses = async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${API_URL}/api/wri/public/businesses?${params}`);
      const data = await response.json();
      setBusinesses(data);
    } catch (error) {
      console.error("Error fetching businesses:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wri/public/events`);
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchPartners = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wri/public/partners`);
      const data = await response.json();
      setPartners(data);
    } catch (error) {
      console.error("Error fetching partners:", error);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wri/public/resources`);
      const data = await response.json();
      setResources(data);
    } catch (error) {
      console.error("Error fetching resources:", error);
    }
  };

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    setEnquirySubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(enquiryForm).forEach(([key, value]) => {
        formData.append(key, value);
      });
      if (enquiryAttachment) {
        formData.append("attachment", enquiryAttachment);
      }

      const response = await fetch(`${API_URL}/api/wri/enquiries`, {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        setEnquirySuccess(true);
        setEnquiryForm({
          name: "",
          organisation: "",
          country: "",
          email: "",
          phone: "",
          organisation_type: "",
          technology_sector: "",
          area_of_interest: "",
          enquiry_type: "",
          message: ""
        });
        setEnquiryAttachment(null);
      }
    } catch (error) {
      console.error("Error submitting enquiry:", error);
    } finally {
      setEnquirySubmitting(false);
    }
  };

  const handleSurveySubmit = async (e) => {
    e.preventDefault();
    setSurveySubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/wri/survey`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(surveyForm)
      });

      if (response.ok) {
        setSurveySuccess(true);
        setSurveyForm({
          company_name: "",
          contact_person: "",
          position: "",
          email: "",
          phone: "",
          nature_of_business: [],
          technologies: [],
          engages_chinese_partners: "",
          collaboration_types: [],
          engagement_duration: "",
          challenges: [],
          support_needed: [],
          future_interest: "",
          interested_activities: [],
          additional_comments: ""
        });
      }
    } catch (error) {
      console.error("Error submitting survey:", error);
    } finally {
      setSurveySubmitting(false);
    }
  };

  const handleCheckboxChange = (field, value) => {
    setSurveyForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <div style={{ backgroundColor: "#f0fdf4", color: "#064e3b" }}>
      <WriNav settings={settings} overHero />

      <section id="hero" className="relative min-h-screen flex flex-col justify-center px-4 overflow-hidden pt-20" style={{ backgroundImage: settings?.wri?.hero?.backgroundImageUrl ? `url(${settings?.wri?.hero?.backgroundImageUrl})` : "linear-gradient(135deg, #059669 0%, #10b981 50%, #065f46 100%)", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0, 0, 0, ${settings?.wri?.hero?.overlayOpacity ?? 0.3})` }} />
        <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 drop-shadow-lg">
            {settings?.wri?.hero?.title || "Africa–China Renewable Energy Partnership"}
          </h1>
          <p className="text-lg md:text-xl mb-6 max-w-3xl mx-auto drop-shadow-md">
            {settings?.wri?.hero?.subtitle || "Connecting Kenya's Renewable Energy Sector with Chinese Technology, Investment and Business Opportunities."}
          </p>
          <p className="text-base md:text-lg mb-10 max-w-3xl mx-auto drop-shadow-md opacity-90">
            {settings?.wri?.hero?.introduction || "A dedicated hub facilitating B2B linkages, partnership enquiries, events, business opportunities, knowledge sharing, and stakeholder engagement between Kenya and China in the renewable energy sector."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => scrollToSection("enquiry")}
              className="px-6 py-3 md:px-8 md:py-4 rounded-full font-bold text-white transition hover:scale-105 shadow-xl"
              style={{ backgroundColor: "#ffffff", color: "#059669" }}
            >
              {settings?.wri?.hero?.primaryCta || "Make a Partnership Enquiry"}
            </button>
            <button
              onClick={() => scrollToSection("business-database")}
              className="px-6 py-3 md:px-8 md:py-4 rounded-full font-bold border-2 border-white text-white transition hover:scale-105 backdrop-blur-sm"
            >
              {settings?.wri?.hero?.secondaryCta || "Browse Business Database"}
            </button>
          </div>
        </div>
      </section>

      <section id="about" className="py-16 md:py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#064e3b" }}>About the Partnership</h2>
            <p className="mt-4 text-lg max-w-3xl mx-auto" style={{ color: "#065f46" }}>
              The Kenya–China Renewable Energy Partnership focuses on strengthening collaboration across key areas:
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Kenya–China B2B linkages",
              "Technology transfer",
              "Investment opportunities",
              "Local manufacturing and assembly",
              "Skills development",
              "Standards and quality assurance",
              "Renewable energy collaboration"
            ].map((item, index) => {
              const colors = [
                { bg: "#f0fdf4", border: "#a7f3d0", text: "#065f46" },
                { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
                { bg: "#ffffff", border: "#e5e7eb", text: "#15803d" },
                { bg: "#f7fee7", border: "#d9f99d", text: "#3f6212" },
                { bg: "#f0f9ff", border: "#bae6fd", text: "#0c4a6e" },
                { bg: "#fafaf9", border: "#e7e5e4", text: "#15803d" },
                { bg: "#ecfdf5", border: "#6ee7b7", text: "#047857" }
              ];
              const color = colors[index % colors.length];
              return (
                <div key={index} className="flex items-start space-x-3 rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: color.bg, borderColor: color.border }}>
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: color.border }}>
                    <svg className="h-4 w-4" style={{ color: color.text }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm md:text-base" style={{ color: color.text }}>{item}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="areas" className="py-16 md:py-24 px-4" style={{ backgroundColor: "#ffffff" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#064e3b" }}>Technology & Business Areas</h2>
            <p className="mt-4 text-lg max-w-3xl mx-auto" style={{ color: "#065f46" }}>
              Explore the key technology sectors and business areas where Kenya and China can collaborate.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {technologyAreas.map((area, index) => {
              const colors = [
                { bg: "#f0fdf4", border: "#a7f3d0", text: "#065f46" },
                { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
                { bg: "#ffffff", border: "#e5e7eb", text: "#15803d" },
                { bg: "#f7fee7", border: "#d9f99d", text: "#3f6212" },
                { bg: "#f0f9ff", border: "#bae6fd", text: "#0c4a6e" },
                { bg: "#fafaf9", border: "#e7e5e4", text: "#15803d" }
              ];
              const color = colors[index % colors.length];
              return (
                <div key={area.id} className="rounded-2xl border p-6 shadow-sm hover:shadow-lg transition-all hover:scale-105" style={{ backgroundColor: color.bg, borderColor: color.border }}>
                  <h3 className="text-xl font-semibold" style={{ color: color.text }}>{area.title}</h3>
                  <p className="mt-2 text-sm md:text-base" style={{ color: "#065f46" }}>{area.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="opportunities" className="py-16 md:py-24 px-4" style={{ backgroundColor: "#ecfdf5" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#064e3b" }}>B2B Opportunities</h2>
            <p className="mt-4 text-lg max-w-3xl mx-auto" style={{ color: "#065f46" }}>
              Discover the types of partnership and business opportunities available through this platform.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {b2bOpportunities.map((opportunity, index) => (
              <div key={index} className="flex items-center space-x-3 rounded-2xl bg-white p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-lg" style={{ backgroundColor: "#059669" }}>
                  {index + 1}
                </div>
                <span className="text-sm md:text-base font-medium" style={{ color: "#064e3b" }}>{opportunity}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="enquiry" className="py-16 md:py-24 px-4" style={{ backgroundColor: "#ffffff" }}>
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#064e3b" }}>Partnership Enquiry</h2>
            <p className="mt-4 text-lg max-w-3xl mx-auto" style={{ color: "#065f46" }}>
              Submit your enquiry to explore partnership opportunities with Chinese renewable energy companies and stakeholders.
            </p>
          </div>
          {enquirySuccess && (
            <div className="mb-8 rounded-2xl border p-4" style={{ backgroundColor: "#f0fdf4", borderColor: "#86efac" }}>
              <p className="text-center font-medium" style={{ color: "#065f46" }}>Thank you! Your enquiry has been submitted successfully. We will get back to you soon.</p>
            </div>
          )}
          <form onSubmit={handleEnquirySubmit} className="rounded-2xl border p-6 md:p-8 shadow-lg" style={{ backgroundColor: "#f0fdf4", borderColor: "#a7f3d0" }}>
            <div className="grid gap-4 md:gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>Name *</label>
                <input
                  type="text"
                  required
                  value={enquiryForm.name}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                  className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ borderColor: "#a7f3d0", backgroundColor: "#ffffff", focusRingColor: "#059669" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>Organisation/Company *</label>
                <input
                  type="text"
                  required
                  value={enquiryForm.organisation}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, organisation: e.target.value })}
                  className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ borderColor: "#a7f3d0", backgroundColor: "#ffffff" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>Country *</label>
                <input
                  type="text"
                  required
                  value={enquiryForm.country}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, country: e.target.value })}
                  className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ borderColor: "#a7f3d0", backgroundColor: "#ffffff" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>Email *</label>
                <input
                  type="email"
                  required
                  value={enquiryForm.email}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                  className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ borderColor: "#a7f3d0", backgroundColor: "#ffffff" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>Phone</label>
                <input
                  type="tel"
                  value={enquiryForm.phone}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                  className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ borderColor: "#a7f3d0", backgroundColor: "#ffffff" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>Organisation Type *</label>
                <select
                  required
                  value={enquiryForm.organisation_type}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, organisation_type: e.target.value })}
                  className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ borderColor: "#a7f3d0", backgroundColor: "#ffffff" }}
                >
                  <option value="">Select organisation type</option>
                  {organisationTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>Technology/Sector *</label>
                <select
                  required
                  value={enquiryForm.technology_sector}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, technology_sector: e.target.value })}
                  className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ borderColor: "#a7f3d0", backgroundColor: "#ffffff" }}
                >
                  <option value="">Select technology/sector</option>
                  {technologySectors.map((sector) => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>Area of Interest *</label>
                <select
                  required
                  value={enquiryForm.area_of_interest}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, area_of_interest: e.target.value })}
                  className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ borderColor: "#a7f3d0", backgroundColor: "#ffffff" }}
                >
                  <option value="">Select area of interest</option>
                  {areasOfInterest.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>Type of Enquiry *</label>
                <select
                  required
                  value={enquiryForm.enquiry_type}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, enquiry_type: e.target.value })}
                  className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ borderColor: "#a7f3d0", backgroundColor: "#ffffff" }}
                >
                  <option value="">Select enquiry type</option>
                  {enquiryTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>Message *</label>
              <textarea
                required
                rows={4}
                value={enquiryForm.message}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                style={{ borderColor: "#a7f3d0", backgroundColor: "#ffffff" }}
              />
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>Attachment (Optional)</label>
              <input
                type="file"
                onChange={(e) => setEnquiryAttachment(e.target.files?.[0] || null)}
                className="w-full text-sm"
                style={{ color: "#065f46" }}
              />
            </div>
            <button
              type="submit"
              disabled={enquirySubmitting}
              className="mt-8 w-full rounded-full px-8 py-4 text-white font-bold text-lg transition hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#059669" }}
            >
              {enquirySubmitting ? "Submitting..." : "Submit Enquiry"}
            </button>
          </form>
        </div>
      </section>

      <section id="events" className="py-16 md:py-24 px-4" style={{ backgroundColor: "#f0fdf4" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#064e3b" }}>Events</h2>
            <p className="mt-4 text-lg max-w-3xl mx-auto" style={{ color: "#065f46" }}>
              Stay updated on upcoming Kenya–China partnership events and activities.
            </p>
          </div>
          {events.length === 0 ? (
            <p className="text-center py-8" style={{ color: "#065f46" }}>No events scheduled at this time.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {events.map((event) => (
                <div key={event.id} className="rounded-2xl border bg-white shadow-sm hover:shadow-lg transition-all overflow-hidden" style={{ borderColor: "#a7f3d0" }}>
                  <div className="h-48 flex items-center justify-center" style={{ backgroundColor: "#f0fdf4" }}>
                    {event.image_url ? (
                      <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-center" style={{ color: "#065f46" }}>
                        <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm opacity-50">Event Image</p>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold" style={{ color: "#064e3b" }}>{event.title}</h3>
                    <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: "#065f46" }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(event.event_date)}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm" style={{ color: "#065f46" }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location}
                    </div>
                    <p className="mt-3 text-sm" style={{ color: "#064e3b" }}>{event.description}</p>
                    {event.registration_link && (
                      <a
                        href={event.registration_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block rounded-full px-6 py-2 text-sm font-semibold text-white transition hover:scale-105"
                        style={{ backgroundColor: "#059669" }}
                      >
                        Register Now
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="survey" className="py-16 md:py-24 px-4" style={{ backgroundColor: "#ffffff" }}>
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#064e3b" }}>KEREA Member Survey</h2>
            <p className="mt-4 text-lg" style={{ color: "#065f46" }}>
              Kenya Renewable Energy Association Survey on Kenya–China Business & Partnership Engagement
            </p>
            <p className="mt-2 text-sm" style={{ color: "#065f46" }}>
              Estimated completion time: 5–7 minutes
            </p>
          </div>

          {surveySuccess ? (
            <div className="rounded-2xl border p-8 text-center" style={{ backgroundColor: "#f0fdf4", borderColor: "#a7f3d0" }}>
              <svg className="w-16 h-16 mx-auto mb-4" style={{ color: "#059669" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-2xl font-semibold" style={{ color: "#064e3b" }}>Thank You!</h3>
              <p className="mt-2" style={{ color: "#065f46" }}>Your survey response has been submitted successfully.</p>
            </div>
          ) : (
            <form onSubmit={handleSurveySubmit} className="space-y-8">
              <div className="rounded-2xl border p-6" style={{ backgroundColor: "#f0fdf4", borderColor: "#a7f3d0" }}>
                <h3 className="text-xl font-semibold mb-4" style={{ color: "#064e3b" }}>Section 1: Company Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>1. Company Name *</label>
                    <input
                      type="text"
                      required
                      value={surveyForm.company_name}
                      onChange={(e) => setSurveyForm({ ...surveyForm, company_name: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2"
                      style={{ borderColor: "#a7f3d0", backgroundColor: "#ffffff" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>2. Contact Person Name *</label>
                    <input
                      type="text"
                      required
                      value={surveyForm.contact_person}
                      onChange={(e) => setSurveyForm({ ...surveyForm, contact_person: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2"
                      style={{ borderColor: "#a7f3d0", backgroundColor: "#ffffff" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>3. Position/Title *</label>
                    <input
                      type="text"
                      required
                      value={surveyForm.position}
                      onChange={(e) => setSurveyForm({ ...surveyForm, position: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2"
                      style={{ borderColor: "#a7f3d0", backgroundColor: "#ffffff" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>4. Email Address *</label>
                    <input
                      type="email"
                      required
                      value={surveyForm.email}
                      onChange={(e) => setSurveyForm({ ...surveyForm, email: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2"
                      style={{ borderColor: "#a7f3d0", backgroundColor: "#ffffff" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>5. Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={surveyForm.phone}
                      onChange={(e) => setSurveyForm({ ...surveyForm, phone: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2"
                      style={{ borderColor: "#a7f3d0", backgroundColor: "#ffffff" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>6. Nature of Business (Select all that apply) *</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {["Manufacturing", "Distribution / Supply", "Installation / EPC", "Financing / Investment", "Consultancy", "Research & Innovation", "Product Development", "Importation", "Other"].map((option) => (
                        <label key={option} className="flex items-center gap-2 text-sm" style={{ color: "#065f46" }}>
                          <input
                            type="checkbox"
                            checked={surveyForm.nature_of_business.includes(option)}
                            onChange={() => handleCheckboxChange("nature_of_business", option)}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>7. Renewable Energy Technologies (Select all that apply) *</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {["Solar PV", "Solar Water Heating", "Clean Cooking", "Biogas", "Mini-grids", "Energy Storage (Battery Systems)", "E-mobility", "Productive Use of Renewable Energy (PURE)", "Energy Efficiency", "Cross-cutting / Multiple Technologies", "Other"].map((option) => (
                        <label key={option} className="flex items-center gap-2 text-sm" style={{ color: "#065f46" }}>
                          <input
                            type="checkbox"
                            checked={surveyForm.technologies.includes(option)}
                            onChange={() => handleCheckboxChange("technologies", option)}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border p-6" style={{ backgroundColor: "#f0fdf4", borderColor: "#a7f3d0" }}>
                <h3 className="text-xl font-semibold mb-4" style={{ color: "#064e3b" }}>Section 2: Current Engagement with Chinese Partners</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>8. Does your organization currently engage with Chinese companies or institutions? *</label>
                    <div className="space-x-4 mt-2">
                      {["Yes", "No", "Planning to engage"].map((option) => (
                        <label key={option} className="inline-flex items-center gap-2 text-sm" style={{ color: "#065f46" }}>
                          <input
                            type="radio"
                            name="engages_chinese_partners"
                            value={option}
                            checked={surveyForm.engages_chinese_partners === option}
                            onChange={(e) => setSurveyForm({ ...surveyForm, engages_chinese_partners: e.target.value })}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>9. What type of collaboration or support would your organization seek from Chinese partners? (Select all that apply) *</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {["Technology transfer", "Manufacturing partnerships", "Financing", "Capacity building", "Distribution partnerships", "Research & Development", "Market access", "Investment", "Other"].map((option) => (
                        <label key={option} className="flex items-center gap-2 text-sm" style={{ color: "#065f46" }}>
                          <input
                            type="checkbox"
                            checked={surveyForm.collaboration_types.includes(option)}
                            onChange={() => handleCheckboxChange("collaboration_types", option)}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>10. How long has your organization been engaging with Chinese partners? *</label>
                    <div className="space-x-4 mt-2">
                      {["Less than 1 year", "1–3 years", "4–7 years", "Over 7 years"].map((option) => (
                        <label key={option} className="inline-flex items-center gap-2 text-sm" style={{ color: "#065f46" }}>
                          <input
                            type="radio"
                            name="engagement_duration"
                            value={option}
                            checked={surveyForm.engagement_duration === option}
                            onChange={(e) => setSurveyForm({ ...surveyForm, engagement_duration: e.target.value })}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border p-6" style={{ backgroundColor: "#f0fdf4", borderColor: "#a7f3d0" }}>
                <h3 className="text-xl font-semibold mb-4" style={{ color: "#064e3b" }}>Section 3: Challenges and Support Needs</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>11. What are the key challenges your organization faces when engaging with Chinese partners? (Select all that apply) *</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {["Language barriers", "Limited access to trusted partners", "Financing constraints", "Import/logistics challenges", "Regulatory barriers", "Quality assurance concerns", "Limited market information", "Cultural/business practice differences", "Communication delays", "Other"].map((option) => (
                        <label key={option} className="flex items-center gap-2 text-sm" style={{ color: "#065f46" }}>
                          <input
                            type="checkbox"
                            checked={surveyForm.challenges.includes(option)}
                            onChange={() => handleCheckboxChange("challenges", option)}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>12. What support would you like KEREA to provide? (Select all that apply) *</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {["B2B matchmaking", "Trade mission coordination", "Business networking events", "Investment linkages", "Policy advocacy", "Technical training", "Market intelligence", "Supplier verification", "Translation/interpreter support", "Regulatory guidance", "Access to financing opportunities", "Other"].map((option) => (
                        <label key={option} className="flex items-center gap-2 text-sm" style={{ color: "#065f46" }}>
                          <input
                            type="checkbox"
                            checked={surveyForm.support_needed.includes(option)}
                            onChange={() => handleCheckboxChange("support_needed", option)}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border p-6" style={{ backgroundColor: "#f0fdf4", borderColor: "#a7f3d0" }}>
                <h3 className="text-xl font-semibold mb-4" style={{ color: "#064e3b" }}>Section 4: Future Collaboration Opportunities</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>13. Would your organization be interested in participating in future Kenya–China B2B engagements organized by KEREA? *</label>
                    <div className="space-x-4 mt-2">
                      {["Yes", "No", "Maybe"].map((option) => (
                        <label key={option} className="inline-flex items-center gap-2 text-sm" style={{ color: "#065f46" }}>
                          <input
                            type="radio"
                            name="future_interest"
                            value={option}
                            checked={surveyForm.future_interest === option}
                            onChange={(e) => setSurveyForm({ ...surveyForm, future_interest: e.target.value })}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>14. Which of the following Kenya–China business engagement activities would your organization be interested in participating in? (Select all that apply) *</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {["Trade fairs", "Virtual B2B meetings", "Investor forums", "Site visits", "Product exhibitions", "Technical workshops", "Joint pilot projects", "None of the above"].map((option) => (
                        <label key={option} className="flex items-center gap-2 text-sm" style={{ color: "#065f46" }}>
                          <input
                            type="checkbox"
                            checked={surveyForm.interested_activities.includes(option)}
                            onChange={() => handleCheckboxChange("interested_activities", option)}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>15. Please share any additional comments, recommendations, or partnership interests *</label>
                    <textarea
                      required
                      value={surveyForm.additional_comments}
                      onChange={(e) => setSurveyForm({ ...surveyForm, additional_comments: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2"
                      style={{ borderColor: "#a7f3d0", backgroundColor: "#ffffff" }}
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={surveySubmitting}
                className="w-full rounded-full py-3 text-lg font-semibold text-white disabled:opacity-50 transition hover:scale-105"
                style={{ backgroundColor: "#059669" }}
              >
                {surveySubmitting ? "Submitting..." : "Submit Survey"}
              </button>
            </form>
          )}
        </div>
      </section>

      <section id="partners" className="py-16 md:py-24 px-4" style={{ backgroundColor: "#f0fdf4" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#064e3b" }}>Partners & Stakeholders</h2>
            <p className="mt-4 text-lg max-w-3xl mx-auto" style={{ color: "#065f46" }}>
              Approved organisations and partners participating in the Kenya–China Renewable Energy Partnership.
            </p>
          </div>
          {partners.length === 0 ? (
            <p className="text-center py-8" style={{ color: "#065f46" }}>No partners listed at this time.</p>
          ) : (
            <div className="relative overflow-hidden">
              <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {partners.map((partner) => (
                  <div key={partner.id} className="flex-shrink-0 w-64 snap-center rounded-2xl border p-6 shadow-sm hover:shadow-lg transition-all flex flex-col items-center justify-center text-center" style={{ backgroundColor: "#ffffff", borderColor: "#a7f3d0" }}>
                    <div className="h-24 w-24 flex items-center justify-center rounded-full" style={{ backgroundColor: "#f0fdf4" }}>
                      {partner.logo_url ? (
                        <img src={partner.logo_url} alt={partner.name} className="h-20 w-20 object-contain" />
                      ) : (
                        <svg className="w-12 h-12" style={{ color: "#065f46", opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      )}
                    </div>
                    <h3 className="mt-4 font-semibold" style={{ color: "#064e3b" }}>{partner.name}</h3>
                    {partner.website_url && (
                      <a
                        href={partner.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block rounded-full px-4 py-2 text-sm font-medium text-white transition hover:scale-105"
                        style={{ backgroundColor: "#059669" }}
                      >
                        Visit Website
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="resources" className="py-16 md:py-24 px-4" style={{ backgroundColor: "#ecfdf5" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#064e3b" }}>Resources</h2>
            <p className="mt-4 text-lg max-w-3xl mx-auto" style={{ color: "#065f46" }}>
              Access reports, policy briefs, research, publications, and event reports.
            </p>
          </div>
          {resources.length === 0 ? (
            <p className="text-center py-8" style={{ color: "#065f46" }}>No resources available at this time.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {resources.map((resource) => (
                <div key={resource.id} className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-lg transition-all" style={{ borderColor: "#a7f3d0" }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: "#f0fdf4", color: "#065f46" }}>
                        {resource.resource_type}
                      </span>
                      <h3 className="mt-3 text-lg font-semibold" style={{ color: "#064e3b" }}>{resource.title}</h3>
                      <p className="mt-2 text-sm" style={{ color: "#065f46" }}>{resource.description}</p>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      {resource.file_url && (
                        <a
                          href={resource.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:scale-105"
                          style={{ backgroundColor: "#059669" }}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </a>
                      )}
                      {resource.external_url && (
                        <a
                          href={resource.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:scale-105"
                          style={{ backgroundColor: "#6b7280" }}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="business-database" className="py-16 md:py-24 px-4" style={{ backgroundColor: "#ffffff" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#064e3b" }}>Business Database</h2>
            <p className="mt-4 text-lg max-w-3xl mx-auto" style={{ color: "#065f46" }}>
              Search the directory of participating businesses approved for public display.
            </p>
          </div>
          <div className="rounded-2xl border p-6 mb-8" style={{ backgroundColor: "#f0fdf4", borderColor: "#a7f3d0" }}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>Country</label>
                <input
                  type="text"
                  value={businessFilters.country}
                  onChange={(e) => setBusinessFilters({ ...businessFilters, country: e.target.value })}
                  placeholder="Filter by country"
                  className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ borderColor: "#a7f3d0", backgroundColor: "#ffffff" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>Technology</label>
                <select
                  value={businessFilters.technology}
                  onChange={(e) => setBusinessFilters({ ...businessFilters, technology: e.target.value })}
                  className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ borderColor: "#a7f3d0", backgroundColor: "#ffffff" }}
                >
                  <option value="">All technologies</option>
                  {technologySectors.map((sector) => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>Organisation Type</label>
                <select
                  value={businessFilters.organisation_type}
                  onChange={(e) => setBusinessFilters({ ...businessFilters, organisation_type: e.target.value })}
                  className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ borderColor: "#a7f3d0", backgroundColor: "#ffffff" }}
                >
                  <option value="">All types</option>
                  {organisationTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>Nature of Business</label>
                <input
                  type="text"
                  value={businessFilters.nature_of_business}
                  onChange={(e) => setBusinessFilters({ ...businessFilters, nature_of_business: e.target.value })}
                  placeholder="Filter by business nature"
                  className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ borderColor: "#a7f3d0", backgroundColor: "#ffffff" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#064e3b" }}>Partnership Interest</label>
                <input
                  type="text"
                  value={businessFilters.partnership_interest}
                  onChange={(e) => setBusinessFilters({ ...businessFilters, partnership_interest: e.target.value })}
                  placeholder="Filter by interest"
                  className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ borderColor: "#a7f3d0", backgroundColor: "#ffffff" }}
                />
              </div>
            </div>
          </div>
          {businesses.length === 0 ? (
            <p className="text-center py-8" style={{ color: "#065f46" }}>No businesses found matching your filters.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {businesses.map((business) => (
                <div key={business.id} className="rounded-2xl border p-6 shadow-sm hover:shadow-lg transition-all" style={{ backgroundColor: "#f0fdf4", borderColor: "#a7f3d0" }}>
                  {business.logo_url && (
                    <img src={business.logo_url} alt={business.name} className="h-20 w-20 object-contain" />
                  )}
                  <h3 className="mt-4 text-lg font-semibold" style={{ color: "#064e3b" }}>{business.name}</h3>
                  <p className="mt-1 text-sm" style={{ color: "#065f46" }}>{business.country}</p>
                  <p className="mt-1 text-sm" style={{ color: "#065f46" }}>{business.technology}</p>
                  <p className="mt-1 text-sm" style={{ color: "#065f46" }}>{business.organisation_type}</p>
                  <p className="mt-2" style={{ color: "#064e3b" }}>{business.description}</p>
                  {business.website_url && (
                    <a
                      href={business.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block rounded-full px-6 py-2 text-sm font-semibold text-white transition hover:scale-105"
                      style={{ backgroundColor: "#059669" }}
                    >
                      Visit Website
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="py-12 px-4" style={{ backgroundColor: "#064e3b", color: "#ffffff" }}>
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="text-lg font-semibold">Africa–China Renewable Energy Partnership</h3>
              <p className="mt-2" style={{ color: "#a7f3d0" }}>
                A dedicated platform connecting Kenya's renewable energy sector with Chinese technology, investment, and business opportunities.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Quick Links</h3>
              <ul className="mt-2 space-y-2">
                <li><Link to="/solar-mkononi" className="transition hover:opacity-80" style={{ color: "#a7f3d0" }}>Solar Mkononi</Link></li>
                <li><button onClick={() => scrollToSection("enquiry")} className="transition hover:opacity-80" style={{ color: "#a7f3d0" }}>Submit Enquiry</button></li>
                <li><button onClick={() => scrollToSection("business-database")} className="transition hover:opacity-80" style={{ color: "#a7f3d0" }}>Business Database</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Contact</h3>
              <p className="mt-2" style={{ color: "#a7f3d0" }}>
                For partnership enquiries and information, please use the enquiry form above.
              </p>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center" style={{ borderColor: "#a7f3d0", color: "#a7f3d0" }}>
            <p>© 2026 Kenya Renewable Energy Association (KEREA). All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WriPartnershipPage;
