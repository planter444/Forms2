import { useEffect } from "react";
import MarketplaceVendorForm from "../components/MarketplaceVendorForm.jsx";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

const MarketplaceVendorPage = () => {
  const { palette } = useSiteSettings();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: palette.background || "#f8fafc" }}>
      <header className="relative overflow-hidden px-4 py-16 text-center sm:py-24" style={{ backgroundColor: palette.primary }}>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, ${palette.primarySoft} 0%, transparent 40%), radial-gradient(circle at 80% 80%, ${palette.primarySoft} 0%, transparent 40%)`
          }}
        />
        <div className="relative mx-auto max-w-4xl">
          <div className="mx-auto mb-4 max-w-fit rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-white/90" style={{ backgroundColor: "rgba(0,0,0,0.15)" }}>
            Vendor Onboarding
          </div>
          <h1 className="text-3xl font-semibold text-white sm:text-5xl">Marketplace Vendor Application</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/90 sm:text-lg">
            Join the KEREA Marketplace by completing the onboarding form below. We will review your submission and contact you once verified.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <MarketplaceVendorForm />
      </main>
    </div>
  );
};

export default MarketplaceVendorPage;
