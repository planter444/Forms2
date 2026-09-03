import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSiteSettings } from "./context/SiteSettingsContext.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import FormPage from "./pages/FormPage.jsx";
import SuccessPage from "./pages/SuccessPage.jsx";
import AdminConsolePage from "./pages/AdminConsolePage.jsx";
import SolarMkononiPage from "./pages/SolarMkononiPage.jsx";
import SolarResourceLibraryPage from "./pages/SolarResourceLibraryPage.jsx";
import MarketplaceVendorLandingPage from "./pages/MarketplaceVendorLandingPage.jsx";
import MarketplaceVendorFormPage from "./pages/MarketplaceVendorFormPage.jsx";
import WriPartnershipPage from "./pages/WriPartnershipPage.jsx";

const isMobileViewport = () =>
  typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false;

const PageTransition = ({ children }) => {
  const location = useLocation();
  const { settings } = useSiteSettings();
  const [isMobile, setIsMobile] = useState(isMobileViewport);

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

  const enabled = isMobile ? settings.theme.mobilePageLoadEnabled : settings.theme.desktopPageLoadEnabled;
  const animation = isMobile ? settings.theme.mobilePageLoadAnimation : settings.theme.desktopPageLoadAnimation;
  const animationClass = enabled === false || !animation || animation === "none" ? "" : `page-load-${animation}`;

  return (
    <div key={location.pathname} className={animationClass}>
      {children}
    </div>
  );
};

const App = () => {
  return (
    <PageTransition>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/form" element={<FormPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/admin" element={<AdminConsolePage />} />
        <Route path="/solar-mkononi" element={<SolarMkononiPage />} />
        <Route path="/solar/resource-library" element={<SolarResourceLibraryPage />} />
        <Route path="/marketplace" element={<MarketplaceVendorLandingPage />} />
        <Route path="/marketplace/apply" element={<MarketplaceVendorFormPage />} />
        <Route path="/wri" element={<WriPartnershipPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageTransition>
  );
};

export default App;
