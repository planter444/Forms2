import { useEffect, useState } from "react";
import WriHeroAdminSimple from "./WriHeroAdminSimple.jsx";
import WriRealHeroAdmin from "./WriRealHeroAdmin.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const WriPartnershipAdmin = ({ token, palette, setNotice, setError }) => {
  const [activeSubTab, setActiveSubTab] = useState("hero");
  const [surveyResponses, setSurveyResponses] = useState([]);
  const [surveyQuestions, setSurveyQuestions] = useState([]);
  const [wriSettings, setWriSettings] = useState({
    hero: {
      title: "Africa–China Renewable Energy Partnership",
      subtitle: "Connecting Kenya's Renewable Energy Sector with Chinese Technology, Investment and Business Opportunities.",
      introduction: "This dedicated hub facilitates B2B linkages, partnership enquiries, events, business opportunities, knowledge sharing, and stakeholder engagement between Kenya and China in the renewable energy sector.",
      primaryCta: "KEREA Survey",
      primaryCtaLink: "#survey",
      secondaryCta: "Browse Business Database",
      secondaryCtaLink: "#business-database",
      backgroundImageUrl: "",
      overlayOpacity: 0.3
    },
    support: {
      email: "info@kerea.org",
      enabled: true
    },
    quickLinks: [
      { label: "KEREA", url: "https://kerea.org" }
    ],
    footer: {
      description: "The Africa–China Renewable Energy Partnership is an initiative by the Kenya Renewable Energy Association (KEREA) to strengthen collaboration between Kenya and China in the renewable energy sector.",
      contactEmail: "info@kerea.org",
      socialLinks: []
    },
    animation: {
      enabled: true,
      desktop: {
        style: "fade-up",
        duration: 600,
        stagger: 100
      },
      mobile: {
        style: "fade-up",
        duration: 500,
        stagger: 50
      }
    }
  });
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [events, setEvents] = useState([]);
  const [partners, setPartners] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const [businessForm, setBusinessForm] = useState({
    name: "",
    country: "",
    technology: "",
    organisation_type: "",
    nature_of_business: "",
    partnership_interest: "",
    description: "",
    website_url: "",
    logo_url: "",
    contact_email: "",
    contact_phone: "",
    is_approved: false
  });
  const [businessLogoFile, setBusinessLogoFile] = useState(null);

  const [eventForm, setEventForm] = useState({
    title: "",
    event_date: "",
    location: "",
    description: "",
    registration_link: "",
    image_url: ""
  });
  const [eventImageFile, setEventImageFile] = useState(null);

  const [partnerForm, setPartnerForm] = useState({
    name: "",
    website_url: "",
    logo_url: "",
    description: "",
    is_approved: false,
    display_order: 0
  });
  const [partnerLogoFile, setPartnerLogoFile] = useState(null);

  const [resourceForm, setResourceForm] = useState({
    title: "",
    description: "",
    resource_type: "Report",
    file_url: "",
    file_name: "",
    external_url: "",
    is_published: true
  });
  const [resourceFile, setResourceFile] = useState(null);

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
    additional_comments: "",
    nature_of_business_other: "",
    technologies_other: "",
    collaboration_types_other: "",
    challenges_other: "",
    support_needed_other: "",
    interested_activities_other: ""
  });

  const [surveyQuestionForm, setSurveyQuestionForm] = useState({
    section_order: 1,
    question_order: 1,
    question_text: "",
    question_type: "text",
    options: [],
    required: false
  });

  const [editingItem, setEditingItem] = useState(null);

  const fetchSurveyResponses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/survey-responses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setSurveyResponses(data);
    } catch (error) {
      console.error("Error fetching survey responses:", error);
    }
  };

  const handleDownloadSurveyExcel = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/survey-responses/excel`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wri-survey-responses-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setNotice("Excel downloaded successfully");
      }
    } catch (error) {
      setError("Failed to download Excel");
    }
  };

  const handleSaveSurvey = async () => {
    if (!editingItem) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/survey-responses/${editingItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(surveyForm)
      });
      if (response.ok) {
        setNotice("Survey response updated");
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
          additional_comments: "",
          nature_of_business_other: "",
          technologies_other: "",
          collaboration_types_other: "",
          challenges_other: "",
          support_needed_other: "",
          interested_activities_other: ""
        });
        setEditingItem(null);
        fetchSurveyResponses();
      }
    } catch (error) {
      setError("Failed to save survey response");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSurvey = async (id) => {
    if (!confirm("Are you sure you want to delete this survey response?")) return;
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/survey-responses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setNotice("Survey response deleted");
        fetchSurveyResponses();
      }
    } catch (error) {
      setError("Failed to delete survey response");
    }
  };

  const fetchSurveyQuestions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/survey-questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setSurveyQuestions(data);
    } catch (error) {
      console.error("Error fetching survey questions:", error);
    }
  };

  const handleSaveSurveyQuestion = async () => {
    setLoading(true);
    try {
      const url = editingItem
        ? `${API_URL}/api/wri/admin/survey-questions/${editingItem.id}`
        : `${API_URL}/api/wri/admin/survey-questions`;
      const method = editingItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(surveyQuestionForm)
      });

      if (response.ok) {
        setNotice(editingItem ? "Survey question updated" : "Survey question created");
        setSurveyQuestionForm({
          section_order: 1,
          question_order: 1,
          question_text: "",
          question_type: "text",
          options: [],
          required: false
        });
        setEditingItem(null);
        fetchSurveyQuestions();
      }
    } catch (error) {
      setError("Failed to save survey question");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSurveyQuestion = async (id) => {
    if (!confirm("Are you sure you want to delete this survey question?")) return;
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/survey-questions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setNotice("Survey question deleted");
        fetchSurveyQuestions();
      }
    } catch (error) {
      setError("Failed to delete survey question");
    }
  };

  useEffect(() => {
    fetchWriSettings();
    fetchEnquiries();
    fetchBusinesses();
    fetchEvents();
    fetchPartners();
    fetchResources();
    fetchSurveyResponses();
    fetchSurveyQuestions();
  }, []);

  const fetchWriSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wri/public/settings`);
      const data = await response.json();
      console.log("Fetched WRI settings:", data.wri);
      if (data.wri) {
        // Force a complete state update
        setWriSettings(JSON.parse(JSON.stringify(data.wri)));
      }
    } catch (error) {
      console.error("Error fetching WRI settings:", error);
    }
  };

  const handleSaveWriSettings = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    try {
      console.log("Saving WRI settings:", wriSettings);
      let imageUrl = wriSettings.hero?.backgroundImageUrl || "";
      
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
          console.error("Upload failed:", uploadResponse.status);
          setError("Failed to upload image");
          return;
        }
      }
      
      const payload = { wri: { ...wriSettings, hero: { ...wriSettings.hero, backgroundImageUrl: imageUrl } } };
      console.log("Saving payload:", payload);
      
      const response = await fetch(`${API_URL}/api/wri/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      console.log("Save response status:", response.status);
      const responseData = await response.json();
      console.log("Save response data:", responseData);
      
      if (response.ok) {
        setNotice("Hero settings saved successfully!");
        setHeroImageFile(null);
        // Reload the entire component state
        await fetchWriSettings();
      } else {
        const errorData = await response.json();
        console.error("Save failed:", errorData);
        setError(errorData.error || "Failed to save WRI settings");
      }
    } catch (error) {
      console.error("Error saving WRI settings:", error);
      setError("Failed to save WRI settings");
    }
  };

  const fetchEnquiries = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/enquiries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setEnquiries(data);
    } catch (error) {
      console.error("Error fetching enquiries:", error);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/businesses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setBusinesses(data);
    } catch (error) {
      console.error("Error fetching businesses:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchPartners = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/partners`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setPartners(data);
    } catch (error) {
      console.error("Error fetching partners:", error);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/resources`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setResources(data);
    } catch (error) {
      console.error("Error fetching resources:", error);
    }
  };

  const handleUpdateEnquiryStatus = async (id, status) => {
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/enquiries/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        setNotice("Enquiry status updated");
        fetchEnquiries();
      }
    } catch (error) {
      setError("Failed to update enquiry status");
    }
  };

  const handleDeleteEnquiry = async (id) => {
    if (!confirm("Are you sure you want to delete this enquiry?")) return;
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/enquiries/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setNotice("Enquiry deleted");
        fetchEnquiries();
      }
    } catch (error) {
      setError("Failed to delete enquiry");
    }
  };

  const handleDownloadEnquiriesExcel = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/enquiries/excel`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wri-enquiries-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setNotice("Excel downloaded successfully");
      }
    } catch (error) {
      setError("Failed to download Excel");
    }
  };

  const handleSaveBusiness = async () => {
    setLoading(true);
    try {
      let logoUrl = businessForm.logo_url;
      
      if (businessLogoFile) {
        const formData = new FormData();
        formData.append("file", businessLogoFile);
        formData.append("type", "business");
        
        const uploadResponse = await fetch(`${API_URL}/api/wri/admin/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          logoUrl = uploadData.url;
        }
      }
      
      const url = editingItem
        ? `${API_URL}/api/wri/admin/businesses/${editingItem.id}`
        : `${API_URL}/api/wri/admin/businesses`;
      const method = editingItem ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...businessForm, logo_url: logoUrl })
      });
      if (response.ok) {
        setNotice(editingItem ? "Business updated" : "Business created");
        setBusinessForm({
          name: "",
          country: "",
          technology: "",
          organisation_type: "",
          nature_of_business: "",
          partnership_interest: "",
          description: "",
          logo_url: "",
          website_url: "",
          contact_email: "",
          contact_phone: "",
          is_approved: false
        });
        setBusinessLogoFile(null);
        setEditingItem(null);
        fetchBusinesses();
      }
    } catch (error) {
      setError("Failed to save business");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBusiness = async (id) => {
    if (!confirm("Are you sure you want to delete this business?")) return;
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/businesses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setNotice("Business deleted");
        fetchBusinesses();
      }
    } catch (error) {
      setError("Failed to delete business");
    }
  };

  const handleSaveEvent = async () => {
    setLoading(true);
    try {
      let imageUrl = eventForm.image_url;
      
      if (eventImageFile) {
        const formData = new FormData();
        formData.append("file", eventImageFile);
        formData.append("type", "event");
        
        const uploadResponse = await fetch(`${API_URL}/api/wri/admin/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.url;
        }
      }
      
      const url = editingItem
        ? `${API_URL}/api/wri/admin/events/${editingItem.id}`
        : `${API_URL}/api/wri/admin/events`;
      const method = editingItem ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...eventForm, image_url: imageUrl })
      });
      if (response.ok) {
        setNotice(editingItem ? "Event updated" : "Event created");
        setEventForm({ title: "", event_date: "", location: "", description: "", registration_link: "", image_url: "" });
        setEventImageFile(null);
        setEditingItem(null);
        fetchEvents();
      }
    } catch (error) {
      setError("Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setNotice("Event deleted");
        fetchEvents();
      }
    } catch (error) {
      setError("Failed to delete event");
    }
  };

  const handleSavePartner = async () => {
    setLoading(true);
    try {
      let logoUrl = partnerForm.logo_url;
      
      if (partnerLogoFile) {
        const formData = new FormData();
        formData.append("file", partnerLogoFile);
        formData.append("type", "partner");
        
        const uploadResponse = await fetch(`${API_URL}/api/wri/admin/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          logoUrl = uploadData.url;
        }
      }
      
      const url = editingItem
        ? `${API_URL}/api/wri/admin/partners/${editingItem.id}`
        : `${API_URL}/api/wri/admin/partners`;
      const method = editingItem ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...partnerForm, logo_url: logoUrl })
      });
      if (response.ok) {
        setNotice(editingItem ? "Partner updated" : "Partner created");
        setPartnerForm({ name: "", website_url: "", logo_url: "" });
        setPartnerLogoFile(null);
        setEditingItem(null);
        fetchPartners();
      }
    } catch (error) {
      setError("Failed to save partner");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePartner = async (id) => {
    if (!confirm("Are you sure you want to delete this partner?")) return;
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/partners/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setNotice("Partner deleted");
        fetchPartners();
      }
    } catch (error) {
      setError("Failed to delete partner");
    }
  };

  const handleSaveResource = async () => {
    setLoading(true);
    try {
      let fileUrl = resourceForm.file_url;
      let fileName = resourceForm.file_name;
      
      if (resourceFile) {
        const formData = new FormData();
        formData.append("file", resourceFile);
        formData.append("type", "resource");
        
        const uploadResponse = await fetch(`${API_URL}/api/wri/admin/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          fileUrl = uploadData.url;
          fileName = resourceFile.name;
        }
      }
      
      const url = editingItem
        ? `${API_URL}/api/wri/admin/resources/${editingItem.id}`
        : `${API_URL}/api/wri/admin/resources`;
      const method = editingItem ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...resourceForm, file_url: fileUrl, file_name: fileName })
      });
      if (response.ok) {
        setNotice(editingItem ? "Resource updated" : "Resource created");
        setResourceForm({ title: "", description: "", resource_type: "Report", file_url: "", file_name: "", external_url: "", is_published: true });
        setResourceFile(null);
        setEditingItem(null);
        fetchResources();
      }
    } catch (error) {
      setError("Failed to save resource");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async (id) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/resources/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setNotice("Resource deleted");
        fetchResources();
      }
    } catch (error) {
      setError("Failed to delete resource");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6" onClick={(e) => {
      if (e && e.target) {
        e.stopPropagation();
      }
    }}>
      <div className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
        <h2 className="text-2xl font-semibold" style={{ color: palette.textColor }}>Africa–China Renewable Energy Partnership Admin</h2>
        <p className="mt-2 text-sm" style={{ color: palette.mutedTextColor }}>Manage hero content, enquiries, businesses, events, partners, and resources.</p>
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor: palette.borderColor }}>
        {[
          { id: "hero", label: "Hero" },
          { id: "real-hero", label: "Real Hero" },
          { id: "animation", label: "Animation" },
          { id: "support", label: "Support" },
          { id: "quick-links", label: "Quick Links" },
          { id: "footer", label: "Footer" },
          { id: "enquiries", label: "Enquiries" },
          { id: "businesses", label: "Businesses" },
          { id: "events", label: "Events" },
          { id: "partners", label: "Partners" },
          { id: "resources", label: "Resources" },
          { id: "survey", label: "Survey Responses" },
          { id: "survey-questions", label: "Survey Questions" }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveSubTab(tab.id);
              setEditingItem(null);
            }}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color: activeSubTab === tab.id ? palette.primary : palette.mutedTextColor,
              borderBottom: activeSubTab === tab.id ? `2px solid ${palette.primary}` : "2px solid transparent"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === "hero" && (
        <WriHeroAdminSimple token={token} palette={palette} setNotice={setNotice} setError={setError} />
      )}

      {activeSubTab === "real-hero" && (
        <WriRealHeroAdmin token={token} palette={palette} setNotice={setNotice} setError={setError} />
      )}

      {activeSubTab === "animation" && (
        <div className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: palette.textColor }}>Animation Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Enable Animations</label>
              <select
                value={wriSettings.animation?.enabled ? "true" : "false"}
                onChange={(e) => setWriSettings({
                  ...wriSettings,
                  animation: { ...wriSettings.animation, enabled: e.target.value === "true" }
                })}
                className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            
            <div className="border-t pt-4" style={{ borderColor: palette.borderColor }}>
              <h4 className="text-md font-semibold mb-3" style={{ color: palette.textColor }}>Desktop Animations</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Animation Style</label>
                  <select
                    value={wriSettings.animation?.desktop?.style || "fade-up"}
                    onChange={(e) => setWriSettings({
                      ...wriSettings,
                      animation: { 
                        ...wriSettings.animation, 
                        desktop: { ...wriSettings.animation?.desktop, style: e.target.value }
                      }
                    })}
                    className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                    style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                  >
                    <option value="fade-up">Fade Up</option>
                    <option value="fade-in">Fade In</option>
                    <option value="slide-left">Slide Left</option>
                    <option value="slide-right">Slide Right</option>
                    <option value="zoom-in">Zoom In</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Duration (ms)</label>
                  <input
                    type="number"
                    value={wriSettings.animation?.desktop?.duration || 600}
                    onChange={(e) => setWriSettings({
                      ...wriSettings,
                      animation: { 
                        ...wriSettings.animation, 
                        desktop: { ...wriSettings.animation?.desktop, duration: parseInt(e.target.value) || 600 }
                      }
                    })}
                    className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                    style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Stagger Delay (ms)</label>
                  <input
                    type="number"
                    value={wriSettings.animation?.desktop?.stagger || 100}
                    onChange={(e) => setWriSettings({
                      ...wriSettings,
                      animation: { 
                        ...wriSettings.animation, 
                        desktop: { ...wriSettings.animation?.desktop, stagger: parseInt(e.target.value) || 100 }
                      }
                    })}
                    className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                    style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4" style={{ borderColor: palette.borderColor }}>
              <h4 className="text-md font-semibold mb-3" style={{ color: palette.textColor }}>Mobile Animations</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Animation Style</label>
                  <select
                    value={wriSettings.animation?.mobile?.style || "fade-up"}
                    onChange={(e) => setWriSettings({
                      ...wriSettings,
                      animation: { 
                        ...wriSettings.animation, 
                        mobile: { ...wriSettings.animation?.mobile, style: e.target.value }
                      }
                    })}
                    className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                    style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                  >
                    <option value="fade-up">Fade Up</option>
                    <option value="fade-in">Fade In</option>
                    <option value="slide-left">Slide Left</option>
                    <option value="slide-right">Slide Right</option>
                    <option value="zoom-in">Zoom In</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Duration (ms)</label>
                  <input
                    type="number"
                    value={wriSettings.animation?.mobile?.duration || 500}
                    onChange={(e) => setWriSettings({
                      ...wriSettings,
                      animation: { 
                        ...wriSettings.animation, 
                        mobile: { ...wriSettings.animation?.mobile, duration: parseInt(e.target.value) || 500 }
                      }
                    })}
                    className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                    style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Stagger Delay (ms)</label>
                  <input
                    type="number"
                    value={wriSettings.animation?.mobile?.stagger || 50}
                    onChange={(e) => setWriSettings({
                      ...wriSettings,
                      animation: { 
                        ...wriSettings.animation, 
                        mobile: { ...wriSettings.animation?.mobile, stagger: parseInt(e.target.value) || 50 }
                      }
                    })}
                    className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                    style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveWriSettings}
              className="px-6 py-3 rounded-full font-medium text-white transition hover:scale-105"
              style={{ backgroundColor: palette.primary }}
            >
              Save Animation Settings
            </button>
          </div>
        </div>
      )}

      {activeSubTab === "support" && (
        <div className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: palette.textColor }}>Support & Contact Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Enable Support Section</label>
              <select
                value={wriSettings.support?.enabled ? "true" : "false"}
                onChange={(e) => setWriSettings({
                  ...wriSettings,
                  support: { ...wriSettings.support, enabled: e.target.value === "true" }
                })}
                className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Support Email</label>
              <input
                type="email"
                value={wriSettings.support?.email || ""}
                onChange={(e) => setWriSettings({
                  ...wriSettings,
                  support: { ...wriSettings.support, email: e.target.value }
                })}
                className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                placeholder="support@example.com"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveWriSettings}
              className="px-6 py-3 rounded-full font-medium text-white transition hover:scale-105"
              style={{ backgroundColor: palette.primary }}
            >
              Save Support Settings
            </button>
          </div>
        </div>
      )}

      {activeSubTab === "quick-links" && (
        <div className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: palette.textColor }}>Quick Links</h3>
          <div className="space-y-4">
            {wriSettings.quickLinks?.map((link, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => {
                      const newLinks = [...wriSettings.quickLinks];
                      newLinks[index].label = e.target.value;
                      setWriSettings({ ...wriSettings, quickLinks: newLinks });
                    }}
                    className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                    style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                    placeholder="Link Label"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...wriSettings.quickLinks];
                      newLinks[index].url = e.target.value;
                      setWriSettings({ ...wriSettings, quickLinks: newLinks });
                    }}
                    className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                    style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                    placeholder="https://example.com"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newLinks = wriSettings.quickLinks.filter((_, i) => i !== index);
                    setWriSettings({ ...wriSettings, quickLinks: newLinks });
                  }}
                  className="mt-6 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50"
                  style={{ borderColor: palette.borderColor }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setWriSettings({
                ...wriSettings,
                quickLinks: [...(wriSettings.quickLinks || []), { label: "", url: "" }]
              })}
              className="px-4 py-2 rounded-lg border-2 border-dashed"
              style={{ borderColor: palette.borderColor, color: palette.textColor }}
            >
              + Add Link
            </button>
            <button
              type="button"
              onClick={handleSaveWriSettings}
              className="px-6 py-3 rounded-full font-medium text-white transition hover:scale-105"
              style={{ backgroundColor: palette.primary }}
            >
              Save Quick Links
            </button>
          </div>
        </div>
      )}

      {activeSubTab === "footer" && (
        <div className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: palette.textColor }}>Footer Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Description</label>
              <textarea
                value={wriSettings.footer?.description || ""}
                onChange={(e) => setWriSettings({
                  ...wriSettings,
                  footer: { ...wriSettings.footer, description: e.target.value }
                })}
                className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                rows={3}
                placeholder="Footer description text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Contact Email</label>
              <input
                type="email"
                value={wriSettings.footer?.contactEmail || ""}
                onChange={(e) => setWriSettings({
                  ...wriSettings,
                  footer: { ...wriSettings.footer, contactEmail: e.target.value }
                })}
                className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                placeholder="contact@example.com"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveWriSettings}
              className="px-6 py-3 rounded-full font-medium text-white transition hover:scale-105"
              style={{ backgroundColor: palette.primary }}
            >
              Save Footer Settings
            </button>
          </div>
        </div>
      )}

      {activeSubTab === "enquiries" && (
        <div className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: palette.textColor }}>Partnership Enquiries</h3>
            <button
              type="button"
              onClick={handleDownloadEnquiriesExcel}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: palette.primary }}
            >
              Download Excel
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: palette.borderColor }}>
                  <th className="px-4 py-2 text-left font-medium" style={{ color: palette.textColor }}>Name</th>
                  <th className="px-4 py-2 text-left font-medium" style={{ color: palette.textColor }}>Organisation</th>
                  <th className="px-4 py-2 text-left font-medium" style={{ color: palette.textColor }}>Country</th>
                  <th className="px-4 py-2 text-left font-medium" style={{ color: palette.textColor }}>Email</th>
                  <th className="px-4 py-2 text-left font-medium" style={{ color: palette.textColor }}>Status</th>
                  <th className="px-4 py-2 text-left font-medium" style={{ color: palette.textColor }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((enquiry) => (
                  <tr key={enquiry.id} className="border-b" style={{ borderColor: palette.borderColor }}>
                    <td className="px-4 py-3" style={{ color: palette.textColor }}>{enquiry.name}</td>
                    <td className="px-4 py-3" style={{ color: palette.textColor }}>{enquiry.organisation}</td>
                    <td className="px-4 py-3" style={{ color: palette.textColor }}>{enquiry.country}</td>
                    <td className="px-4 py-3" style={{ color: palette.textColor }}>{enquiry.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={enquiry.status}
                        onChange={(e) => handleUpdateEnquiryStatus(enquiry.id, e.target.value)}
                        className="rounded-lg border px-2 py-1 text-xs"
                        style={{ borderColor: palette.borderColor }}
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="contacted">Contacted</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteEnquiry(enquiry.id)}
                        className="rounded-lg px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {enquiries.length === 0 && (
              <p className="py-4 text-center" style={{ color: palette.mutedTextColor }}>No enquiries yet.</p>
            )}
          </div>
        </div>
      )}

      {activeSubTab === "businesses" && (
        <div className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
          <h3 className="text-lg font-semibold" style={{ color: palette.textColor }}>Business Directory</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Name"
                value={businessForm.name}
                onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <input
                type="text"
                placeholder="Country"
                value={businessForm.country}
                onChange={(e) => setBusinessForm({ ...businessForm, country: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <input
                type="text"
                placeholder="Technology"
                value={businessForm.technology}
                onChange={(e) => setBusinessForm({ ...businessForm, technology: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <input
                type="text"
                placeholder="Organisation Type"
                value={businessForm.organisation_type}
                onChange={(e) => setBusinessForm({ ...businessForm, organisation_type: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <input
                type="text"
                placeholder="Nature of Business"
                value={businessForm.nature_of_business}
                onChange={(e) => setBusinessForm({ ...businessForm, nature_of_business: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <input
                type="text"
                placeholder="Partnership Interest"
                value={businessForm.partnership_interest}
                onChange={(e) => setBusinessForm({ ...businessForm, partnership_interest: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <textarea
                placeholder="Description"
                value={businessForm.description}
                onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                rows={2}
              />
              <div>
                <label className="block text-sm mb-1" style={{ color: palette.textColor }}>Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBusinessLogoFile(e.target.files?.[0] || null)}
                  className="w-full text-sm mb-2"
                />
                <input
                  type="url"
                  placeholder="Or enter Logo URL"
                  value={businessForm.logo_url}
                  onChange={(e) => setBusinessForm({ ...businessForm, logo_url: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                />
              </div>
              <input
                type="url"
                placeholder="Website URL"
                value={businessForm.website_url}
                onChange={(e) => setBusinessForm({ ...businessForm, website_url: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <label className="flex items-center gap-2 text-sm" style={{ color: palette.textColor }}>
                <input
                  type="checkbox"
                  checked={businessForm.is_approved}
                  onChange={(e) => setBusinessForm({ ...businessForm, is_approved: e.target.checked })}
                />
                Approved for public display
              </label>
              <button
                type="button"
                onClick={handleSaveBusiness}
                disabled={loading}
                className="w-full rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: palette.primary }}
              >
                {loading ? "Saving..." : editingItem ? "Update Business" : "Add Business"}
              </button>
              {editingItem && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setBusinessForm({
                      name: "",
                      country: "",
                      technology: "",
                      organisation_type: "",
                      nature_of_business: "",
                      partnership_interest: "",
                      description: "",
                      logo_url: "",
                      website_url: "",
                      contact_email: "",
                      contact_phone: "",
                      is_approved: false
                    });
                  }}
                  className="w-full rounded-lg border py-2 text-sm font-semibold"
                  style={{ borderColor: palette.borderColor, color: palette.textColor }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {businesses.map((business) => (
                <div key={business.id} className="rounded-lg border p-3" style={{ borderColor: palette.borderColor }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium" style={{ color: palette.textColor }}>{business.name}</p>
                      <p className="text-xs" style={{ color: palette.mutedTextColor }}>{business.country} • {business.technology}</p>
                      <p className="text-xs" style={{ color: palette.mutedTextColor }}>{business.organisation_type}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(business);
                          setBusinessForm(business);
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBusiness(business.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <span className={`inline-block mt-2 rounded-full px-2 py-0.5 text-xs ${business.is_approved ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {business.is_approved ? "Approved" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "events" && (
        <div className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
          <h3 className="text-lg font-semibold" style={{ color: palette.textColor }}>Events</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Event Title"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <input
                type="date"
                value={eventForm.event_date}
                onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <input
                type="text"
                placeholder="Location"
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <textarea
                placeholder="Description"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                rows={2}
              />
              <div>
                <label className="block text-sm mb-1" style={{ color: palette.textColor }}>Event Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEventImageFile(e.target.files?.[0] || null)}
                  className="w-full text-sm mb-2"
                />
                <input
                  type="url"
                  placeholder="Or enter Image URL"
                  value={eventForm.image_url}
                  onChange={(e) => setEventForm({ ...eventForm, image_url: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                />
              </div>
              <input
                type="url"
                placeholder="Registration Link"
                value={eventForm.registration_link}
                onChange={(e) => setEventForm({ ...eventForm, registration_link: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <select
                value={eventForm.status}
                onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              >
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
              <button
                type="button"
                onClick={handleSaveEvent}
                disabled={loading}
                className="w-full rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: palette.primary }}
              >
                {loading ? "Saving..." : editingItem ? "Update Event" : "Add Event"}
              </button>
              {editingItem && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setEventForm({
                      title: "",
                      event_date: "",
                      location: "",
                      description: "",
                      image_url: "",
                      registration_link: "",
                      status: "upcoming"
                    });
                  }}
                  className="w-full rounded-lg border py-2 text-sm font-semibold"
                  style={{ borderColor: palette.borderColor, color: palette.textColor }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.map((event) => (
                <div key={event.id} className="rounded-lg border p-3" style={{ borderColor: palette.borderColor }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium" style={{ color: palette.textColor }}>{event.title}</p>
                      <p className="text-xs" style={{ color: palette.mutedTextColor }}>{formatDate(event.event_date)} • {event.location}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(event);
                          setEventForm(event);
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <span className={`inline-block mt-2 rounded-full px-2 py-0.5 text-xs ${event.status === "upcoming" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>
                    {event.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "partners" && (
        <div className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
          <h3 className="text-lg font-semibold" style={{ color: palette.textColor }}>Partners & Stakeholders</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Partner Name"
                value={partnerForm.name}
                onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <div>
                <label className="block text-sm mb-1" style={{ color: palette.textColor }}>Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPartnerLogoFile(e.target.files?.[0] || null)}
                  className="w-full text-sm mb-2"
                />
                <input
                  type="url"
                  placeholder="Or enter Logo URL"
                  value={partnerForm.logo_url}
                  onChange={(e) => setPartnerForm({ ...partnerForm, logo_url: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                />
              </div>
              <input
                type="url"
                placeholder="Website URL"
                value={partnerForm.website_url}
                onChange={(e) => setPartnerForm({ ...partnerForm, website_url: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <textarea
                placeholder="Description"
                value={partnerForm.description}
                onChange={(e) => setPartnerForm({ ...partnerForm, description: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                rows={2}
              />
              <input
                type="number"
                placeholder="Display Order"
                value={partnerForm.display_order}
                onChange={(e) => setPartnerForm({ ...partnerForm, display_order: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <label className="flex items-center gap-2 text-sm" style={{ color: palette.textColor }}>
                <input
                  type="checkbox"
                  checked={partnerForm.is_approved}
                  onChange={(e) => setPartnerForm({ ...partnerForm, is_approved: e.target.checked })}
                />
                Approved for public display
              </label>
              <button
                type="button"
                onClick={handleSavePartner}
                disabled={loading}
                className="w-full rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: palette.primary }}
              >
                {loading ? "Saving..." : editingItem ? "Update Partner" : "Add Partner"}
              </button>
              {editingItem && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setPartnerForm({
                      name: "",
                      logo_url: "",
                      website_url: "",
                      description: "",
                      is_approved: false,
                      display_order: 0
                    });
                  }}
                  className="w-full rounded-lg border py-2 text-sm font-semibold"
                  style={{ borderColor: palette.borderColor, color: palette.textColor }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {partners.map((partner) => (
                <div key={partner.id} className="rounded-lg border p-3" style={{ borderColor: palette.borderColor }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium" style={{ color: palette.textColor }}>{partner.name}</p>
                      {partner.logo_url && <img src={partner.logo_url} alt="" className="mt-1 h-8 w-8 object-contain" />}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(partner);
                          setPartnerForm(partner);
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePartner(partner.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <span className={`inline-block mt-2 rounded-full px-2 py-0.5 text-xs ${partner.is_approved ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {partner.is_approved ? "Approved" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "survey" && (
        <div className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: palette.textColor }}>Survey Responses</h3>
            <button
              type="button"
              onClick={handleDownloadSurveyExcel}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: palette.primary }}
            >
              Download Excel
            </button>
          </div>
          {editingItem ? (
            <div className="mt-4 space-y-3">
              <h4 className="text-md font-medium" style={{ color: palette.textColor }}>Edit Survey Response</h4>
              
              <div className="border-b pb-4 mb-4" style={{ borderColor: palette.borderColor }}>
                <h5 className="text-sm font-semibold mb-2" style={{ color: palette.textColor }}>Section 1: Company Information</h5>
                <input
                  type="text"
                  placeholder="Company Name"
                  value={surveyForm.company_name}
                  onChange={(e) => setSurveyForm({ ...surveyForm, company_name: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                />
                <input
                  type="text"
                  placeholder="Contact Person"
                  value={surveyForm.contact_person}
                  onChange={(e) => setSurveyForm({ ...surveyForm, contact_person: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                />
                <input
                  type="text"
                  placeholder="Position"
                  value={surveyForm.position}
                  onChange={(e) => setSurveyForm({ ...surveyForm, position: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={surveyForm.email}
                  onChange={(e) => setSurveyForm({ ...surveyForm, email: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={surveyForm.phone}
                  onChange={(e) => setSurveyForm({ ...surveyForm, phone: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                />
                <div>
                  <label className="block text-sm mb-1" style={{ color: palette.textColor }}>Nature of Business</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Manufacturing", "Distribution / Supply", "Installation / EPC", "Financing / Investment", "Consultancy", "Research & Innovation", "Product Development", "Importation", "Other"].map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={surveyForm.nature_of_business.includes(option)}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...surveyForm.nature_of_business, option]
                              : surveyForm.nature_of_business.filter(item => item !== option);
                            setSurveyForm({ ...surveyForm, nature_of_business: newValue });
                          }}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {surveyForm.nature_of_business.includes("Other") && (
                    <input
                      type="text"
                      placeholder="Please specify"
                      value={surveyForm.nature_of_business_other}
                      onChange={(e) => setSurveyForm({ ...surveyForm, nature_of_business_other: e.target.value })}
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: palette.textColor }}>Renewable Energy Technologies</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Solar PV", "Solar Water Heating", "Clean Cooking", "Biogas", "Mini-grids", "Energy Storage (Battery Systems)", "E-mobility", "Productive Use of Renewable Energy (PURE)", "Energy Efficiency", "Cross-cutting / Multiple Technologies", "Other"].map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={surveyForm.technologies.includes(option)}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...surveyForm.technologies, option]
                              : surveyForm.technologies.filter(item => item !== option);
                            setSurveyForm({ ...surveyForm, technologies: newValue });
                          }}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {surveyForm.technologies.includes("Other") && (
                    <input
                      type="text"
                      placeholder="Please specify"
                      value={surveyForm.technologies_other}
                      onChange={(e) => setSurveyForm({ ...surveyForm, technologies_other: e.target.value })}
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                    />
                  )}
                </div>
              </div>

              <div className="border-b pb-4 mb-4" style={{ borderColor: palette.borderColor }}>
                <h5 className="text-sm font-semibold mb-2" style={{ color: palette.textColor }}>Section 2: Current Engagement with Chinese Partners</h5>
                <select
                  value={surveyForm.engages_chinese_partners}
                  onChange={(e) => setSurveyForm({ ...surveyForm, engages_chinese_partners: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                >
                  <option value="">Select option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Planning to">Planning to</option>
                </select>
                <div>
                  <label className="block text-sm mb-1" style={{ color: palette.textColor }}>Collaboration Types</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Trade and Import", "Technology Transfer", "Joint Ventures", "Investment Partnerships", "R&D Collaboration", "Training and Skills Development", "Market Expansion", "Other"].map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={surveyForm.collaboration_types.includes(option)}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...surveyForm.collaboration_types, option]
                              : surveyForm.collaboration_types.filter(item => item !== option);
                            setSurveyForm({ ...surveyForm, collaboration_types: newValue });
                          }}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {surveyForm.collaboration_types.includes("Other") && (
                    <input
                      type="text"
                      placeholder="Please specify"
                      value={surveyForm.collaboration_types_other}
                      onChange={(e) => setSurveyForm({ ...surveyForm, collaboration_types_other: e.target.value })}
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                    />
                  )}
                </div>
                <select
                  value={surveyForm.engagement_duration}
                  onChange={(e) => setSurveyForm({ ...surveyForm, engagement_duration: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                >
                  <option value="">Select duration</option>
                  <option value="Less than 1 year">Less than 1 year</option>
                  <option value="1-3 years">1-3 years</option>
                  <option value="4-7 years">4-7 years</option>
                  <option value="Over 7 years">Over 7 years</option>
                </select>
              </div>

              <div className="border-b pb-4 mb-4" style={{ borderColor: palette.borderColor }}>
                <h5 className="text-sm font-semibold mb-2" style={{ color: palette.textColor }}>Section 3: Challenges and Support Needs</h5>
                <div>
                  <label className="block text-sm mb-1" style={{ color: palette.textColor }}>Challenges</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Language barriers", "Limited access to trusted partners", "Financing constraints", "Import/logistics challenges", "Regulatory barriers", "Quality assurance concerns", "Limited market information", "Cultural/business practice differences", "Communication delays", "Other"].map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={surveyForm.challenges.includes(option)}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...surveyForm.challenges, option]
                              : surveyForm.challenges.filter(item => item !== option);
                            setSurveyForm({ ...surveyForm, challenges: newValue });
                          }}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {surveyForm.challenges.includes("Other") && (
                    <input
                      type="text"
                      placeholder="Please specify"
                      value={surveyForm.challenges_other}
                      onChange={(e) => setSurveyForm({ ...surveyForm, challenges_other: e.target.value })}
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: palette.textColor }}>Support Needed</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["B2B matchmaking", "Trade mission coordination", "Business networking events", "Investment linkages", "Policy advocacy", "Technical training", "Market intelligence", "Supplier verification", "Translation/interpreter support", "Regulatory guidance", "Access to financing opportunities", "Other"].map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={surveyForm.support_needed.includes(option)}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...surveyForm.support_needed, option]
                              : surveyForm.support_needed.filter(item => item !== option);
                            setSurveyForm({ ...surveyForm, support_needed: newValue });
                          }}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {surveyForm.support_needed.includes("Other") && (
                    <input
                      type="text"
                      placeholder="Please specify"
                      value={surveyForm.support_needed_other}
                      onChange={(e) => setSurveyForm({ ...surveyForm, support_needed_other: e.target.value })}
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                    />
                  )}
                </div>
              </div>

              <div className="border-b pb-4 mb-4" style={{ borderColor: palette.borderColor }}>
                <h5 className="text-sm font-semibold mb-2" style={{ color: palette.textColor }}>Section 4: Future Collaboration Opportunities</h5>
                <select
                  value={surveyForm.future_interest}
                  onChange={(e) => setSurveyForm({ ...surveyForm, future_interest: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                >
                  <option value="">Select interest level</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Maybe">Maybe</option>
                </select>
                <div>
                  <label className="block text-sm mb-1" style={{ color: palette.textColor }}>Interested Activities</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Trade fairs", "Virtual B2B meetings", "Investor forums", "Site visits", "Product exhibitions", "Technical workshops", "Joint pilot projects", "Other"].map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={surveyForm.interested_activities.includes(option)}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...surveyForm.interested_activities, option]
                              : surveyForm.interested_activities.filter(item => item !== option);
                            setSurveyForm({ ...surveyForm, interested_activities: newValue });
                          }}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {surveyForm.interested_activities.includes("Other") && (
                    <input
                      type="text"
                      placeholder="Please specify"
                      value={surveyForm.interested_activities_other}
                      onChange={(e) => setSurveyForm({ ...surveyForm, interested_activities_other: e.target.value })}
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                    />
                  )}
                </div>
                <textarea
                  placeholder="Additional Comments"
                  value={surveyForm.additional_comments}
                  onChange={(e) => setSurveyForm({ ...surveyForm, additional_comments: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                  rows={3}
                />
              </div>
              <button
                type="button"
                onClick={handleSaveSurvey}
                disabled={loading}
                className="w-full rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: palette.primary }}
              >
                {loading ? "Saving..." : "Update Survey Response"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
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
                }}
                className="w-full rounded-lg border py-2 text-sm font-semibold"
                style={{ borderColor: palette.borderColor, color: palette.textColor }}
              >
                Cancel Edit
              </button>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: palette.borderColor }}>
                    <th className="px-4 py-2 text-left font-medium" style={{ color: palette.textColor }}>#</th>
                    <th className="px-4 py-2 text-left font-medium" style={{ color: palette.textColor }}>Company</th>
                    <th className="px-4 py-2 text-left font-medium" style={{ color: palette.textColor }}>Contact</th>
                    <th className="px-4 py-2 text-left font-medium" style={{ color: palette.textColor }}>Email</th>
                    <th className="px-4 py-2 text-left font-medium" style={{ color: palette.textColor }}>Engages Chinese Partners</th>
                    <th className="px-4 py-2 text-left font-medium" style={{ color: palette.textColor }}>Submitted At</th>
                    <th className="px-4 py-2 text-left font-medium" style={{ color: palette.textColor }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {surveyResponses.map((response, index) => (
                    <tr key={response.id} className="border-b" style={{ borderColor: palette.borderColor }}>
                      <td className="px-4 py-2" style={{ color: palette.textColor }}>{index + 1}</td>
                      <td className="px-4 py-2" style={{ color: palette.textColor }}>{response.company_name}</td>
                      <td className="px-4 py-2" style={{ color: palette.textColor }}>{response.contact_person}</td>
                      <td className="px-4 py-2" style={{ color: palette.textColor }}>{response.email}</td>
                      <td className="px-4 py-2" style={{ color: palette.textColor }}>{response.engages_chinese_partners}</td>
                      <td className="px-4 py-2" style={{ color: palette.textColor }}>{new Date(response.submitted_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(response);
                              setSurveyForm({
                                company_name: response.company_name || "",
                                contact_person: response.contact_person || "",
                                position: response.position || "",
                                email: response.email || "",
                                phone: response.phone || "",
                                nature_of_business: response.nature_of_business || [],
                                technologies: response.technologies || [],
                                engages_chinese_partners: response.engages_chinese_partners || "",
                                collaboration_types: response.collaboration_types || [],
                                engagement_duration: response.engagement_duration || "",
                                challenges: response.challenges || [],
                                support_needed: response.support_needed || [],
                                future_interest: response.future_interest || "",
                                interested_activities: response.interested_activities || [],
                                additional_comments: response.additional_comments || "",
                                nature_of_business_other: response.nature_of_business_other || "",
                                technologies_other: response.technologies_other || "",
                                collaboration_types_other: response.collaboration_types_other || "",
                                challenges_other: response.challenges_other || "",
                                support_needed_other: response.support_needed_other || "",
                                interested_activities_other: response.interested_activities_other || ""
                              });
                            }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSurvey(response.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {surveyResponses.length === 0 && (
                <p className="py-4 text-center" style={{ color: palette.mutedTextColor }}>No survey responses yet.</p>
              )}
            </div>
          )}
        </div>
      )}

      {activeSubTab === "survey-questions" && (
        <div className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: palette.textColor }}>Survey Questions</h3>
          <div className="space-y-4">
            <div className="border-b pb-4 mb-4" style={{ borderColor: palette.borderColor }}>
              <h4 className="text-md font-medium mb-3" style={{ color: palette.textColor }}>
                {editingItem ? "Edit Question" : "Add New Question"}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <input
                type="number"
                placeholder="Section Order"
                value={surveyQuestionForm.section_order}
                onChange={(e) => setSurveyQuestionForm({ ...surveyQuestionForm, section_order: parseInt(e.target.value) || 1 })}
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <input
                type="number"
                placeholder="Question Order"
                value={surveyQuestionForm.question_order}
                onChange={(e) => setSurveyQuestionForm({ ...surveyQuestionForm, question_order: parseInt(e.target.value) || 1 })}
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              </div>
              <input
                type="text"
                placeholder="Question Text"
                value={surveyQuestionForm.question_text}
                onChange={(e) => setSurveyQuestionForm({ ...surveyQuestionForm, question_text: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <select
                value={surveyQuestionForm.question_type}
                onChange={(e) => setSurveyQuestionForm({ ...surveyQuestionForm, question_type: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="tel">Phone</option>
                <option value="radio">Radio (Single Choice)</option>
                <option value="checkbox">Checkbox (Multiple Choice)</option>
                <option value="textarea">Textarea</option>
                <option value="scale">Scale (1-10)</option>
              </select>
              {(surveyQuestionForm.question_type === "radio" || surveyQuestionForm.question_type === "checkbox") && (
                <div>
                  <label className="block text-sm mb-1" style={{ color: palette.textColor }}>Options (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Option 1, Option 2, Option 3"
                    value={surveyQuestionForm.options.join(", ")}
                    onChange={(e) => setSurveyQuestionForm({ ...surveyQuestionForm, options: e.target.value.split(",").map(o => o.trim()) })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                  />
                </div>
              )}
              {surveyQuestionForm.question_type === "scale" && (
                <div>
                  <label className="block text-sm mb-1" style={{ color: palette.textColor }}>Scale Range</label>
                  <p className="text-xs" style={{ color: palette.mutedTextColor }}>1 (Lowest) to 10 (Highest)</p>
                </div>
              )}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={surveyQuestionForm.required}
                  onChange={(e) => setSurveyQuestionForm({ ...surveyQuestionForm, required: e.target.checked })}
                />
                <span className="text-sm" style={{ color: palette.textColor }}>Required</span>
              </label>
              <button
                onClick={handleSaveSurveyQuestion}
                disabled={loading}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: palette.primary }}
              >
                {loading ? "Saving..." : (editingItem ? "Update Question" : "Add Question")}
              </button>
              {editingItem && (
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setSurveyQuestionForm({
                      section_order: 1,
                      question_order: 1,
                      question_text: "",
                      question_type: "text",
                      options: [],
                      required: false
                    });
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold"
                  style={{ backgroundColor: palette.surfaceMuted, color: palette.textColor }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-medium" style={{ color: palette.textColor }}>Existing Questions</h4>
              {!editingItem && (
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setSurveyQuestionForm({
                      section_order: 1,
                      question_order: 1,
                      question_text: "",
                      question_type: "text",
                      options: [],
                      required: false
                    });
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: palette.primary }}
                >
                  Add New Question
                </button>
              )}
            </div>
            <div className="space-y-2">
              {surveyQuestions.map((question, index) => {
                // Calculate real question number (1-15)
                const sectionQuestions = surveyQuestions.filter(q => q.section_order === question.section_order);
                const sectionQuestionIndex = sectionQuestions.findIndex(q => q.id === question.id);
                const sectionStartNumber = surveyQuestions.filter(q => q.section_order < question.section_order).length;
                const realNumber = sectionStartNumber + sectionQuestionIndex + 1;

                return (
                  <div key={question.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                    <div>
                      <div className="text-sm font-medium" style={{ color: palette.textColor }}>
                        {realNumber}. {question.question_text}
                      </div>
                      <div className="text-xs" style={{ color: palette.mutedTextColor }}>
                        Section {question.section_order} | Type: {question.question_type} | Required: {question.required ? "Yes" : "No"}
                        {question.options.length > 0 && ` | Options: ${question.options.join(", ")}`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingItem(question);
                          setSurveyQuestionForm({
                            section_order: question.section_order,
                            question_order: question.question_order,
                            question_text: question.question_text,
                            question_type: question.question_type,
                            options: question.options,
                            required: question.required
                          });
                        }}
                        className="rounded px-3 py-1 text-xs font-semibold"
                        style={{ backgroundColor: palette.primary, color: "white" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSurveyQuestion(question.id)}
                        className="rounded px-3 py-1 text-xs font-semibold"
                        style={{ backgroundColor: "#ef4444", color: "white" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {surveyQuestions.length === 0 && (
              <p className="py-4 text-center" style={{ color: palette.mutedTextColor }}>No survey questions yet.</p>
            )}
          </div>
        </div>
      )}

      {activeSubTab === "resources" && (
        <div className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
          <h3 className="text-lg font-semibold" style={{ color: palette.textColor }}>Resources</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Resource Title"
                value={resourceForm.title}
                onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <select
                value={resourceForm.resource_type}
                onChange={(e) => setResourceForm({ ...resourceForm, resource_type: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              >
                <option value="">Select resource type</option>
                <option value="Report">Report</option>
                <option value="Policy Brief">Policy Brief</option>
                <option value="Research">Research</option>
                <option value="Publication">Publication</option>
                <option value="Event Report">Event Report</option>
                <option value="Other">Other</option>
              </select>
              <textarea
                placeholder="Description"
                value={resourceForm.description}
                onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                rows={2}
              />
              <div>
                <label className="block text-sm mb-1" style={{ color: palette.textColor }}>File Upload</label>
                <input
                  type="file"
                  accept="*/*"
                  onChange={(e) => setResourceFile(e.target.files?.[0] || null)}
                  className="w-full text-sm mb-2"
                />
                <input
                  type="url"
                  placeholder="Or enter File URL"
                  value={resourceForm.file_url}
                  onChange={(e) => setResourceForm({ ...resourceForm, file_url: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                />
              </div>
              <input
                type="text"
                placeholder="File Name"
                value={resourceForm.file_name}
                onChange={(e) => setResourceForm({ ...resourceForm, file_name: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <input
                type="url"
                placeholder="External URL"
                value={resourceForm.external_url}
                onChange={(e) => setResourceForm({ ...resourceForm, external_url: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <label className="flex items-center gap-2 text-sm" style={{ color: palette.textColor }}>
                <input
                  type="checkbox"
                  checked={resourceForm.is_published}
                  onChange={(e) => setResourceForm({ ...resourceForm, is_published: e.target.checked })}
                />
                Published
              </label>
              <button
                type="button"
                onClick={handleSaveResource}
                disabled={loading}
                className="w-full rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: palette.primary }}
              >
                {loading ? "Saving..." : editingItem ? "Update Resource" : "Add Resource"}
              </button>
              {editingItem && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setResourceForm({
                      title: "",
                      resource_type: "",
                      description: "",
                      file_url: "",
                      file_name: "",
                      external_url: "",
                      is_published: true
                    });
                  }}
                  className="w-full rounded-lg border py-2 text-sm font-semibold"
                  style={{ borderColor: palette.borderColor, color: palette.textColor }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {resources.map((resource) => (
                <div key={resource.id} className="rounded-lg border p-3" style={{ borderColor: palette.borderColor }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium" style={{ color: palette.textColor }}>{resource.title}</p>
                      <p className="text-xs" style={{ color: palette.mutedTextColor }}>{resource.resource_type}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(resource);
                          setResourceForm(resource);
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteResource(resource.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <span className={`inline-block mt-2 rounded-full px-2 py-0.5 text-xs ${resource.is_published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {resource.is_published ? "Published" : "Draft"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WriPartnershipAdmin;
