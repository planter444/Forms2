import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const WriHeroAdminSimple = ({ token, palette, setNotice, setError }) => {
  const [title, setTitle] = useState("Africa–China Renewable Energy Partnership");
  const [subtitle, setSubtitle] = useState("Connecting Kenya's Renewable Energy Sector with Chinese Technology, Investment and Business Opportunities.");
  const [introduction, setIntroduction] = useState("This dedicated hub facilitates B2B linkages, partnership enquiries, events, business opportunities, knowledge sharing, and stakeholder engagement between Kenya and China in the renewable energy sector.");
  const [primaryCta, setPrimaryCta] = useState("Make a Partnership Enquiry");
  const [secondaryCta, setSecondaryCta] = useState("Browse Business Database");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [overlayOpacity, setOverlayOpacity] = useState(0.3);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/wri/public/settings`);
        const data = await response.json();
        
        if (data.wri && data.wri.hero) {
          const hero = data.wri.hero;
          setTitle(hero.title || title);
          setSubtitle(hero.subtitle || subtitle);
          setIntroduction(hero.introduction || introduction);
          setPrimaryCta(hero.primaryCta || primaryCta);
          setSecondaryCta(hero.secondaryCta || secondaryCta);
          setBackgroundImageUrl(hero.backgroundImageUrl || "");
          setOverlayOpacity(hero.overlayOpacity ?? 0.3);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const payload = {
        wri: {
          hero: {
            title,
            subtitle,
            introduction,
            primaryCta,
            secondaryCta,
            backgroundImageUrl,
            overlayOpacity
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
        setNotice("Hero settings saved successfully!");
      } else {
        setError("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving:", error);
      setError("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: palette.textColor }}>Hero Section Settings</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Subtitle</label>
          <textarea
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
            rows={2}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Introduction</label>
          <textarea
            value={introduction}
            onChange={(e) => setIntroduction(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
            rows={3}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Primary CTA Button Text</label>
          <input
            type="text"
            value={primaryCta}
            onChange={(e) => setPrimaryCta(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Secondary CTA Button Text</label>
          <input
            type="text"
            value={secondaryCta}
            onChange={(e) => setSecondaryCta(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Background Image URL</label>
          <input
            type="url"
            value={backgroundImageUrl}
            onChange={(e) => setBackgroundImageUrl(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
            placeholder="Enter image URL"
          />
          {backgroundImageUrl && (
            <img src={backgroundImageUrl} alt="Preview" className="h-32 w-full object-cover rounded-lg mt-2" />
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>
            Overlay Opacity ({Math.round(overlayOpacity * 100)}%)
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            className="w-full"
            value={overlayOpacity}
            onChange={(e) => setOverlayOpacity(Number(e.target.value))}
          />
        </div>
        
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full rounded-lg py-2 text-sm font-semibold text-white disabled:bg-gray-400"
          style={{ backgroundColor: isSaving ? "#9ca3af" : palette.primary }}
        >
          {isSaving ? "Saving..." : "Save Hero Settings"}
        </button>
      </div>
    </div>
  );
};

export default WriHeroAdminSimple;