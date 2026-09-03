import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const WriHeroPublic = ({ settings, onScrollToSection }) => {
  const [heroSettings, setHeroSettings] = useState({
    title: "Africa–China Renewable Energy Partnership",
    subtitle: "Connecting Kenya's Renewable Energy Sector with Chinese Technology, Investment and Business Opportunities.",
    introduction: "This dedicated hub facilitates B2B linkages, partnership enquiries, events, business opportunities, knowledge sharing, and stakeholder engagement between Kenya and China in the renewable energy sector.",
    primaryCta: "Make a Partnership Enquiry",
    secondaryCta: "Browse Business Database",
    backgroundImageUrl: "",
    overlayOpacity: 0.3
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log("Fetching WRI settings from:", `${API_URL}/api/wri/public/settings`);
        const response = await fetch(`${API_URL}/api/wri/public/settings`);
        const data = await response.json();
        console.log("Fetched data:", data);
        
        // Handle different response formats
        let wriData = null;
        if (data.wri) {
          wriData = data.wri;
        } else if (data.hero) {
          wriData = data;
        }
        
        if (wriData && wriData.hero) {
          console.log("Setting hero settings:", wriData.hero);
          setHeroSettings(wriData.hero);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };
    loadSettings();
  }, []);

  const scrollToSection = (id) => {
    if (onScrollToSection) {
      onScrollToSection(id);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section 
      id="hero" 
      className="relative min-h-screen flex flex-col justify-center px-4 overflow-hidden pt-20"
      style={{
        backgroundImage: heroSettings.backgroundImageUrl 
          ? `url(${heroSettings.backgroundImageUrl})` 
          : "linear-gradient(135deg, #059669 0%, #10b981 50%, #065f46 100%)",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <div 
        className="absolute inset-0" 
        style={{ backgroundColor: `rgba(0, 0, 0, ${heroSettings.overlayOpacity})` }} 
      />
      
      <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 drop-shadow-lg">
          {heroSettings.title}
        </h1>
        
        <p className="text-lg md:text-xl mb-6 max-w-3xl mx-auto drop-shadow-md">
          {heroSettings.subtitle}
        </p>
        
        <p className="text-base md:text-lg mb-10 max-w-3xl mx-auto drop-shadow-md opacity-90">
          {heroSettings.introduction}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => scrollToSection("enquiry")}
            className="px-6 py-3 md:px-8 md:py-4 rounded-full font-bold text-white transition hover:scale-105 shadow-xl"
            style={{ backgroundColor: "#ffffff", color: "#059669" }}
          >
            {heroSettings.primaryCta}
          </button>
          
          <button
            onClick={() => scrollToSection("business-database")}
            className="px-6 py-3 md:px-8 md:py-4 rounded-full font-bold border-2 border-white text-white transition hover:scale-105 backdrop-blur-sm"
          >
            {heroSettings.secondaryCta}
          </button>
        </div>
      </div>
    </section>
  );
};

export default WriHeroPublic;