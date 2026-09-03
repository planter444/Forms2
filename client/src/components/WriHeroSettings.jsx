import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const WriHeroSettings = ({ token, palette, setNotice, setError }) => {
  const [heroSettings, setHeroSettings] = useState({
    title: "Africa–China Renewable Energy Partnership",
    subtitle: "Connecting Kenya's Renewable Energy Sector with Chinese Technology, Investment and Business Opportunities.",
    introduction: "This dedicated hub facilitates B2B linkages, partnership enquiries, events, business opportunities, knowledge sharing, and stakeholder engagement between Kenya and China in the renewable energy sector.",
    primaryCta: "Make a Partnership Enquiry",
    secondaryCta: "Browse Business Database",
    backgroundImageUrl: "",
    overlayOpacity: 0.3
  });
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/wri/public/settings`);
        const data = await response.json();
        console.log("Loaded WRI settings:", data);
        
        if (data.wri && data.wri.hero) {
          setHeroSettings(data.wri.hero);
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
      console.log("Saving hero settings:", heroSettings);
      
      let imageUrl = heroSettings.backgroundImageUrl;
      
      // Upload image if file is selected
      if (heroImageFile) {
        const formData = new FormData();
        formData.append("file", heroImageFile);
        formData.append("type", "hero");
        
        const uploadResponse = await fetch(`${API_URL}/api/wri/admin/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.url;
        } else {
          setError("Failed to upload image");
          setIsSaving(false);
          return;
        }
      }
      
      // Save settings
      const payload = {
        wri: {
          hero: {
            ...heroSettings,
            backgroundImageUrl: imageUrl
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
        setHeroImageFile(null);
        
        // Reload settings
        const reloadResponse = await fetch(`${API_URL}/api/wri/public/settings`);
        const reloadData = await reloadResponse.json();
        if (reloadData.wri && reloadData.wri.hero) {
          setHeroSettings(reloadData.wri.hero);
        }
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

  const handleChange = (field, value) => {
    setHeroSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: palette.textColor }}>Hero Section Settings</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Title</label>
          <input
            type="text"
            value={heroSettings.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Subtitle</label>
          <textarea
            value={heroSettings.subtitle}
            onChange={(e) => handleChange("subtitle", e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
            rows={2}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Introduction</label>
          <textarea
            value={heroSettings.introduction}
            onChange={(e) => handleChange("introduction", e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
            rows={3}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Primary CTA Button Text</label>
          <input
            type="text"
            value={heroSettings.primaryCta}
            onChange={(e) => handleChange("primaryCta", e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Secondary CTA Button Text</label>
          <input
            type="text"
            value={heroSettings.secondaryCta}
            onChange={(e) => handleChange("secondaryCta", e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Background Image</label>
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setHeroImageFile(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
            <input
              type="url"
              value={heroSettings.backgroundImageUrl}
              onChange={(e) => handleChange("backgroundImageUrl", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              placeholder="Or enter image URL"
            />
            {heroSettings.backgroundImageUrl && (
              <img src={heroSettings.backgroundImageUrl} alt="Preview" className="h-32 w-full object-cover rounded-lg" />
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>
            Overlay Opacity ({Math.round(heroSettings.overlayOpacity * 100)}%)
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            className="w-full"
            value={heroSettings.overlayOpacity}
            onChange={(e) => handleChange("overlayOpacity", Number(e.target.value))}
          />
        </div>
        
        <button
          type="submit"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full rounded-lg py-2 text-sm font-semibold text-white disabled:bg-gray-400"
          style={{ backgroundColor: isSaving ? "#9ca3af" : palette.primary }}
        >
          {isSaving ? "Saving..." : "Save Hero Settings"}
        </button>
      </div>
    </form>
  );
};

export default WriHeroSettings;