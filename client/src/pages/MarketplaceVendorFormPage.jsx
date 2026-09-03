import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AnimatedPatternBackground from "../components/AnimatedPatternBackground.jsx";
import MarketplaceVendorForm from "../components/MarketplaceVendorFormV2.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";
import { getMarketplaceSettings } from "../lib/api.js";

const defaultHeadingByStep = {
  company: "Company details",
  verification: "Business verification",
  coverage: "Coverage information",
  products: "Products & declaration",
  review: "Review before submitting"
};

const defaultFormTips = {
  company: [
    "Provide your registered company name as it appears on official documents.",
    "Use a valid email and phone number that buyers can reach you on.",
    "Briefly describe what your company does and the products you supply."
  ],
  verification: [
    "Enter your business registration number.",
    "Upload your KRA PIN certificate for verification.",
    "Relevant certifications are optional but help build buyer trust."
  ],
  coverage: [
    "Choose countrywide delivery or select the counties you serve.",
    "Add sub-counties and wards if you deliver to specific locations.",
    "Accurate coverage helps buyers find the right supplier."
  ],
  products: [
    "Select the renewable energy product categories you supply.",
    "List the brands your business officially represents.",
    "Social media links are optional but help with credibility."
  ],
  review: [
    "Check all the details before submitting.",
    "Click the edit icon on any section to make changes.",
    "Your progress is saved automatically, so you can resume later."
  ]
};

const MarketplaceVendorFormPage = () => {
  const { palette } = useSiteSettings();
  const [activeStep, setActiveStep] = useState("company");
  const [content, setContent] = useState({ headingByStep: defaultHeadingByStep, tips: defaultFormTips });

  useEffect(() => {
    getMarketplaceSettings()
      .then((data) => {
        const loadedContent = data.fieldConfig?.content?.form;
        if (loadedContent) {
          setContent({
            headingByStep: { ...defaultHeadingByStep, ...(loadedContent.headingByStep || {}) },
            tips: { ...defaultFormTips, ...(loadedContent.tips || {}) }
          });
        }
      })
      .catch(() => {});
  }, []);

  const headingByStep = content.headingByStep;
  const formTips = content.tips;
  const activeTips = formTips[activeStep] || formTips.company;

  const guidanceStyle = {
    borderColor: palette.guidanceBorderColor || palette.borderColor,
    background: `linear-gradient(135deg, ${palette.guidanceBackground || palette.surfaceMuted}, ${palette.surfaceBackground})`
  };
  const guidanceCardStyle = {
    borderColor: palette.guidanceBorderColor || palette.borderColor,
    backgroundColor: palette.guidanceCardBackground || palette.surfaceMuted,
    color: palette.textColor
  };

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: palette.pageBackground }}>
      <AnimatedPatternBackground />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/marketplace" className="text-sm font-semibold" style={{ color: palette.primaryDeep }}>
              ← Back to home
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight" style={{ color: palette.textColor }}>
              Marketplace Vendor Application
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 sm:text-base" style={{ color: palette.mutedTextColor }}>
              Complete the consent-based onboarding form below to apply for listing on the KEREA Marketplace.
              Your progress is saved automatically, so you can return and finish later.
            </p>
          </div>
          <div
            className="rounded-3xl border px-5 py-4 text-sm shadow-sm"
            style={{ borderColor: palette.primaryGlow, backgroundColor: palette.accent, color: palette.primaryDeep }}
          >
            Consent-based onboarding for distributors and suppliers
          </div>
        </div>

        <section className="mb-6 rounded-[30px] border p-4 shadow-soft backdrop-blur-md sm:p-5" style={guidanceStyle}>
          <div className="mb-3 text-sm font-bold uppercase tracking-[0.2em]" style={{ color: palette.primary }}>
            {headingByStep[activeStep] || "Before you begin"}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {activeTips.map((tip) => (
              <div key={tip} className="rounded-2xl border p-4 text-sm leading-6 shadow-sm" style={guidanceCardStyle}>
                {tip}
              </div>
            ))}
          </div>
        </section>

        <section>
          <MarketplaceVendorForm onStepChange={setActiveStep} />
        </section>
      </div>
      <SiteFooter />
    </div>
  );
};

export default MarketplaceVendorFormPage;
