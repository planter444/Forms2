import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const WriRealHeroAdmin = ({ token, palette, setNotice, setError }) => {
  const [realTitle, setRealTitle] = useState("Africa–China Renewable Energy Partnership");
  const [realSubtitle, setRealSubtitle] = useState("Connecting Kenya's Renewable Energy Sector with Chinese Technology, Investment and Business Opportunities.");
  const [realIntroduction, setRealIntroduction] = useState("This dedicated hub facilitates B2B linkages, partnership enquiries, events, business opportunities, knowledge sharing, and stakeholder engagement between Kenya and China in the renewable energy sector.");
  const [realPrimaryCta, setRealPrimaryCta] = useState("Make a Partnership Enquiry");
  const [realSecondaryCta, setRealSecondaryCta] = useState("Browse Business Database");
  const [realDesktopBackgroundImageUrl, setRealDesktopBackgroundImageUrl] = useState("");
  const [realMobileBackgroundImageUrl, setRealMobileBackgroundImageUrl] = useState("");
  const [realOverlayOpacity, setRealOverlayOpacity] = useState(0.3);
  const [realOverlayColor, setRealOverlayColor] = useState("#000000");
  const [realDesktopImageFile, setRealDesktopImageFile] = useState(null);
  const [realMobileImageFile, setRealMobileImageFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/wri/public/settings`);
        const data = await response.json();
        
        if (data.wri && data.wri.realHero) {
          const realHero = data.wri.realHero;
          setRealTitle(realHero.realTitle || realTitle);
          setRealSubtitle(realHero.realSubtitle || realSubtitle);
          setRealIntroduction(realHero.realIntroduction || realIntroduction);
          setRealPrimaryCta(realHero.realPrimaryCta || realPrimaryCta);
          setRealSecondaryCta(realHero.realSecondaryCta || realSecondaryCta);
          setRealDesktopBackgroundImageUrl(realHero.realDesktopBackgroundImageUrl || "");
          setRealMobileBackgroundImageUrl(realHero.realMobileBackgroundImageUrl || "");
          setRealOverlayOpacity(realHero.realOverlayOpacity ?? 0.3);
          setRealOverlayColor(realHero.realOverlayColor || "#000000");
        }
      } catch (error) {
        console.error("Error loading real hero settings:", error);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      let desktopImageUrl = realDesktopBackgroundImageUrl;
      let mobileImageUrl = realMobileBackgroundImageUrl;
      
      // Upload desktop image if file is selected
      if (realDesktopImageFile) {
        const formData = new FormData();
        formData.append("file", realDesktopImageFile);
        formData.append("type", "real-hero-desktop");
        
        const uploadResponse = await fetch(`${API_URL}/api/wri/admin/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          desktopImageUrl = uploadData.url;
        } else {
          setError("Failed to upload desktop image");
          setIsSaving(false);
          return;
        }
      }
      
      // Upload mobile image if file is selected
      if (realMobileImageFile) {
        const formData = new FormData();
        formData.append("file", realMobileImageFile);
        formData.append("type", "real-hero-mobile");
        
        const uploadResponse = await fetch(`${API_URL}/api/wri/admin/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          mobileImageUrl = uploadData.url;
        } else {
          setError("Failed to upload mobile image");
          setIsSaving(false);
          return;
        }
      }
      
      const payload = {
        wri: {
          realHero: {
            realTitle,
            realSubtitle,
            realIntroduction,
            realPrimaryCta,
            realSecondaryCta,
            realDesktopBackgroundImageUrl: desktopImageUrl,
            realMobileBackgroundImageUrl: mobileImageUrl,
            realOverlayOpacity,
            realOverlayColor
          }
        }
      };
      
      const response = await fetch(`${API_URL}/api/wri/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setNotice("Real Hero settings saved successfully!");
        setRealDesktopImageFile(null);
        setRealMobileImageFile(null);
      } else {
        setError("Failed to save Real Hero settings");
      }
    } catch (error) {
      console.error("Error saving real hero settings:", error);
      setError("Failed to save Real Hero settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: palette.textColor }}>Real Hero Section Settings</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Real Title</label>
          <input
            type="text"
            value={realTitle}
            onChange={(e) => setRealTitle(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Real Subtitle</label>
          <textarea
            value={realSubtitle}
            onChange={(e) => setRealSubtitle(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
            rows={2}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Real Introduction</label>
          <textarea
            value={realIntroduction}
            onChange={(e) => setRealIntroduction(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
            rows={3}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Real Primary CTA Button Text</label>
          <input
            type="text"
            value={realPrimaryCta}
            onChange={(e) => setRealPrimaryCta(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Real Secondary CTA Button Text</label>
          <input
            type="text"
            value={realSecondaryCta}
            onChange={(e) => setRealSecondaryCta(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Real Desktop Background Image</label>
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setRealDesktopImageFile(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
            <input
              type="url"
              value={realDesktopBackgroundImageUrl}
              onChange={(e) => setRealDesktopBackgroundImageUrl(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              placeholder="Or enter desktop background image URL"
            />
            {realDesktopBackgroundImageUrl && (
              <img src={realDesktopBackgroundImageUrl} alt="Desktop Preview" className="h-32 w-full object-cover rounded-lg mt-2" />
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Real Mobile Background Image</label>
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setRealMobileImageFile(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
            <input
              type="url"
              value={realMobileBackgroundImageUrl}
              onChange={(e) => setRealMobileBackgroundImageUrl(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              placeholder="Or enter mobile background image URL"
            />
            {realMobileBackgroundImageUrl && (
              <img src={realMobileBackgroundImageUrl} alt="Mobile Preview" className="h-32 w-full object-cover rounded-lg mt-2" />
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>
            Real Overlay Opacity ({Math.round(realOverlayOpacity * 100)}%)
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            className="w-full"
            value={realOverlayOpacity}
            onChange={(e) => setRealOverlayOpacity(Number(e.target.value))}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Real Overlay Color</label>
          <input
            type="color"
            value={realOverlayColor}
            onChange={(e) => setRealOverlayColor(e.target.value)}
            className="w-full h-10 rounded-lg border cursor-pointer"
            style={{ borderColor: palette.borderColor }}
          />
        </div>
        
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full rounded-lg py-2 text-sm font-semibold text-white disabled:bg-gray-400"
          style={{ backgroundColor: isSaving ? "#9ca3af" : palette.primary }}
        >
          {isSaving ? "Saving..." : "Save Real Hero Settings"}
        </button>
      </div>
    </div>
  );
};

export default WriRealHeroAdmin;