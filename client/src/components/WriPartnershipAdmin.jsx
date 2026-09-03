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

  const [leadStatus, setLeadStatus] = useState([]);
  const [leadActivities, setLeadActivities] = useState([]);
  const [leadScores, setLeadScores] = useState([]);
  const [matchRecommendations, setMatchRecommendations] = useState([]);
  const [leadStatusForm, setLeadStatusForm] = useState({
    business_id: null,
    status: "new",
    last_contact_date: "",
    next_follow_up_date: "",
    notes: "",
    assigned_to: ""
  });
  const [activityForm, setActivityForm] = useState({
    business_id: null,
    activity_type: "call",
    description: "",
    performed_by: "",
    outcome: ""
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
          question_order: surveyQuestions.length + 1,
          question_text: "",
          question_type: "text",
          options: [],
          required: false
        });
        setEditingItem(null);
        await fetchSurveyQuestions();
        
        // Trigger settings update to refresh public page
        await fetchWriSettings();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save survey question");
      }
    } catch (error) {
      console.error("Error saving survey question:", error);
      setError("Failed to save survey question");
    } finally {
      setLoading(false);
    }
  };

  const handleMoveQuestionUp = async (question) => {
    const currentIndex = surveyQuestions.findIndex(q => q.id === question.id);
    if (currentIndex === 0) return; // Already at top

    const previousQuestion = surveyQuestions[currentIndex - 1];
    
    // Swap question_order values
    const newOrder = previousQuestion.question_order;
    const previousOrder = question.question_order;

    try {
      await fetch(`${API_URL}/api/wri/admin/survey-questions/${question.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...question,
          question_order: newOrder
        })
      });

      await fetch(`${API_URL}/api/wri/admin/survey-questions/${previousQuestion.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...previousQuestion,
          question_order: previousOrder
        })
      });

      fetchSurveyQuestions();
      setNotice("Question moved up");
    } catch (error) {
      setError("Failed to move question");
    }
  };

  const handleMoveQuestionDown = async (question) => {
    const currentIndex = surveyQuestions.findIndex(q => q.id === question.id);
    if (currentIndex === surveyQuestions.length - 1) return; // Already at bottom

    const nextQuestion = surveyQuestions[currentIndex + 1];
    
    // Swap question_order values
    const newOrder = nextQuestion.question_order;
    const nextOrder = question.question_order;

    try {
      await fetch(`${API_URL}/api/wri/admin/survey-questions/${question.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...question,
          question_order: newOrder
        })
      });

      await fetch(`${API_URL}/api/wri/admin/survey-questions/${nextQuestion.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...nextQuestion,
          question_order: nextOrder
        })
      });

      fetchSurveyQuestions();
      setNotice("Question moved down");
    } catch (error) {
      setError("Failed to move question");
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

  const fetchLeadStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/lead-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setLeadStatus(data);
    } catch (error) {
      console.error("Error fetching lead status:", error);
    }
  };

  const fetchLeadActivities = async (businessId) => {
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/lead-activities/${businessId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setLeadActivities(data);
    } catch (error) {
      console.error("Error fetching lead activities:", error);
    }
  };

  const fetchLeadScores = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/lead-scores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setLeadScores(data);
    } catch (error) {
      console.error("Error fetching lead scores:", error);
    }
  };

  const fetchMatchRecommendations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/match-recommendations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setMatchRecommendations(data);
    } catch (error) {
      console.error("Error fetching match recommendations:", error);
    }
  };

  const handleSaveLeadStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/lead-status/${leadStatusForm.business_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(leadStatusForm)
      });
      if (response.ok) {
        setNotice("Lead status updated");
        setLeadStatusForm({
          business_id: null,
          status: "new",
          last_contact_date: "",
          next_follow_up_date: "",
          notes: "",
          assigned_to: ""
        });
        fetchLeadStatus();
      }
    } catch (error) {
      setError("Failed to save lead status");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveActivity = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/lead-activities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(activityForm)
      });
      if (response.ok) {
        setNotice("Activity logged");
        setActivityForm({
          business_id: null,
          activity_type: "call",
          description: "",
          performed_by: "",
          outcome: ""
        });
        if (activityForm.business_id) {
          fetchLeadActivities(activityForm.business_id);
        }
      }
    } catch (error) {
      setError("Failed to save activity");
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateScore = async (businessId) => {
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/lead-scores/recalculate/${businessId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setNotice("Lead score recalculated");
        fetchLeadScores();
      }
    } catch (error) {
      setError("Failed to recalculate lead score");
    }
  };

  const handleGenerateMatches = async (businessId) => {
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/match-recommendations/generate/${businessId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setNotice("Match recommendations generated");
        fetchMatchRecommendations();
      }
    } catch (error) {
      setError("Failed to generate match recommendations");
    }
  };

  const handleUpdateMatchStatus = async (id, status) => {
    try {
      const response = await fetch(`${API_URL}/api/wri/admin/match-recommendations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        setNotice("Match status updated");
        fetchMatchRecommendations();
      }
    } catch (error) {
      setError("Failed to update match status");
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
    fetchLeadStatus();
    fetchLeadScores();
    fetchMatchRecommendations();
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

      <div className="flex flex-wrap gap-2 border-b pb-2" style={{ borderColor: palette.borderColor }}>
        {[
          { id: "real-hero", label: "Real Hero", icon: "⭐" },
          { id: "animation", label: "Animation", icon: "🎬" },
          { id: "support", label: "Support", icon: "❓" },
          { id: "quick-links", label: "Quick Links", icon: "🔗" },
          { id: "footer", label: "Footer", icon: "📋" },
          { id: "enquiries", label: "Enquiries", icon: "📧" },
          { id: "businesses", label: "Businesses", icon: "🏢" },
          { id: "lead-status", label: "Lead Status", icon: "📊" },
          { id: "lead-activities", label: "Lead Activities", icon: "📝" },
          { id: "lead-scores", label: "Lead Scores", icon: "📈" },
          { id: "match-recommendations", label: "Match Recommendations", icon: "🎯" },
          { id: "events", label: "Events", icon: "📅" },
          { id: "partners", label: "Partners", icon: "🤝" },
          { id: "resources", label: "Resources", icon: "📚" },
          { id: "survey", label: "Survey Responses", icon: "📋" },
          { id: "survey-questions", label: "Survey Questions", icon: "❓" }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveSubTab(tab.id);
              setEditingItem(null);
            }}
            className="px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1"
            style={{
              color: activeSubTab === tab.id ? palette.primary : palette.mutedTextColor,
              borderBottom: activeSubTab === tab.id ? `2px solid ${palette.primary}` : "2px solid transparent"
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

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
              <h4 className="text-md font-semibold mb-3" style={{ color: palette.textColor }}>Card Animation Delay (About & B2B sections)</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Card Stagger Delay (ms)</label>
                  <input
                    type="number"
                    value={wriSettings.animation?.cardStaggerDelay || 500}
                    onChange={(e) => setWriSettings({
                      ...wriSettings,
                      animation: {
                        ...wriSettings.animation,
                        cardStaggerDelay: parseInt(e.target.value) || 500
                      }
                    })}
                    className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                    style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                  />
                  <p className="text-xs mt-1" style={{ color: palette.textColor }}>Delay between card appearances in About Partnership and B2B Opportunities sections (default: 500ms)</p>
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

            <div className="border-t pt-4" style={{ borderColor: palette.borderColor }}>
              <h4 className="text-md font-semibold mb-3" style={{ color: palette.textColor }}>Particle Animation</h4>
              <div className="space-y-3">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={wriSettings.patterns?.enabled !== false}
                      onChange={(e) => setWriSettings({
                        ...wriSettings,
                        patterns: {
                          ...wriSettings.patterns,
                          enabled: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium" style={{ color: palette.textColor }}>Enable Particle Animation</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Particle Color</label>
                  <input
                    type="color"
                    value={wriSettings.patterns?.color || "#059669"}
                    onChange={(e) => setWriSettings({
                      ...wriSettings,
                      patterns: {
                        ...wriSettings.patterns,
                        color: e.target.value
                      }
                    })}
                    className="w-full h-10 rounded-xl border px-3 focus:outline-none focus:ring-2"
                    style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Particle Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={wriSettings.patterns?.opacity || 30}
                    onChange={(e) => setWriSettings({
                      ...wriSettings,
                      patterns: {
                        ...wriSettings.patterns,
                        opacity: parseInt(e.target.value)
                      }
                    })}
                    className="w-full"
                  />
                  <div className="text-xs mt-1" style={{ color: palette.textColor }}>Opacity: {wriSettings.patterns?.opacity || 30}%</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: palette.textColor }}>Particle & Line Thickness</label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={wriSettings.patterns?.thickness || 1}
                    onChange={(e) => setWriSettings({
                      ...wriSettings,
                      patterns: {
                        ...wriSettings.patterns,
                        thickness: parseFloat(e.target.value)
                      }
                    })}
                    className="w-full"
                  />
                  <div className="text-xs mt-1" style={{ color: palette.textColor }}>Thickness: {wriSettings.patterns?.thickness || 1}x</div>
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
              {businesses && Array.isArray(businesses) && businesses.map((business) => (
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

      {activeSubTab === "lead-status" && (
        <div className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: palette.textColor }}>Lead Status Tracking</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <select
                value={leadStatusForm.business_id || ""}
                onChange={(e) => setLeadStatusForm({ ...leadStatusForm, business_id: parseInt(e.target.value) })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              >
                <option value="">Select Business</option>
                {businesses && Array.isArray(businesses) && businesses.map(business => (
                  <option key={business.id} value={business.id}>{business.name}</option>
                ))}
              </select>
              <select
                value={leadStatusForm.status}
                onChange={(e) => setLeadStatusForm({ ...leadStatusForm, status: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="negotiating">Negotiating</option>
                <option value="closed">Closed</option>
              </select>
              <input
                type="date"
                placeholder="Last Contact Date"
                value={leadStatusForm.last_contact_date}
                onChange={(e) => setLeadStatusForm({ ...leadStatusForm, last_contact_date: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <input
                type="date"
                placeholder="Next Follow-up Date"
                value={leadStatusForm.next_follow_up_date}
                onChange={(e) => setLeadStatusForm({ ...leadStatusForm, next_follow_up_date: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <input
                type="text"
                placeholder="Assigned To"
                value={leadStatusForm.assigned_to}
                onChange={(e) => setLeadStatusForm({ ...leadStatusForm, assigned_to: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <textarea
                placeholder="Notes"
                value={leadStatusForm.notes}
                onChange={(e) => setLeadStatusForm({ ...leadStatusForm, notes: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                rows={3}
              />
              <button
                onClick={handleSaveLeadStatus}
                disabled={loading}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: palette.primary }}
              >
                {loading ? "Saving..." : "Update Status"}
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {leadStatus && Array.isArray(leadStatus) && leadStatus.map((status) => (
                <div key={status.id} className="rounded-lg border p-3" style={{ borderColor: palette.borderColor }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium" style={{ color: palette.textColor }}>{status.business_name}</p>
                      <p className="text-xs" style={{ color: palette.mutedTextColor }}>Status: {status.status}</p>
                      {status.next_follow_up_date && (
                        <p className="text-xs" style={{ color: palette.mutedTextColor }}>Follow-up: {formatDate(status.next_follow_up_date)}</p>
                      )}
                    </div>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                      status.status === 'new' ? 'bg-blue-100 text-blue-800' :
                      status.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                      status.status === 'qualified' ? 'bg-green-100 text-green-800' :
                      status.status === 'negotiating' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {status.status}
                    </span>
                  </div>
                </div>
              ))}
              {(!leadStatus || leadStatus.length === 0) && (
                <p className="py-4 text-center" style={{ color: palette.mutedTextColor }}>No lead status records yet. Select a business to update its status.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "lead-activities" && (
        <div className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: palette.textColor }}>Lead Activities</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <select
                value={activityForm.business_id || ""}
                onChange={(e) => setActivityForm({ ...activityForm, business_id: parseInt(e.target.value) })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              >
                <option value="">Select Business</option>
                {businesses && Array.isArray(businesses) && businesses.map(business => (
                  <option key={business.id} value={business.id}>{business.name}</option>
                ))}
              </select>
              <select
                value={activityForm.activity_type}
                onChange={(e) => setActivityForm({ ...activityForm, activity_type: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              >
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
                <option value="visit">Site Visit</option>
                <option value="event">Event</option>
                <option value="other">Other</option>
              </select>
              <input
                type="text"
                placeholder="Description"
                value={activityForm.description}
                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <input
                type="text"
                placeholder="Performed By"
                value={activityForm.performed_by}
                onChange={(e) => setActivityForm({ ...activityForm, performed_by: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <input
                type="text"
                placeholder="Outcome"
                value={activityForm.outcome}
                onChange={(e) => setActivityForm({ ...activityForm, outcome: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              />
              <button
                onClick={handleSaveActivity}
                disabled={loading}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: palette.primary }}
              >
                {loading ? "Saving..." : "Log Activity"}
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {leadActivities && Array.isArray(leadActivities) && leadActivities.map((activity) => (
                <div key={activity.id} className="rounded-lg border p-3" style={{ borderColor: palette.borderColor }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium" style={{ color: palette.textColor }}>{activity.activity_type}</p>
                      <p className="text-xs" style={{ color: palette.mutedTextColor }}>{activity.description}</p>
                      {activity.performed_by && (
                        <p className="text-xs" style={{ color: palette.mutedTextColor }}>By: {activity.performed_by}</p>
                      )}
                      {activity.outcome && (
                        <p className="text-xs" style={{ color: palette.mutedTextColor }}>Outcome: {activity.outcome}</p>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: palette.mutedTextColor }}>{formatDate(activity.created_at)}</p>
                  </div>
                </div>
              ))}
              {(!leadActivities || leadActivities.length === 0) && (
                <p className="py-4 text-center" style={{ color: palette.mutedTextColor }}>No activities logged yet. Select a business and log an activity.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "lead-scores" && (
        <div className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: palette.textColor }}>Lead Scores</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm" style={{ color: palette.mutedTextColor }}>Click "Recalculate" on any business to generate or update lead scores.</p>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {leadScores && Array.isArray(leadScores) && leadScores.map((score) => (
                <div key={score.id} className="rounded-lg border p-3" style={{ borderColor: palette.borderColor }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium" style={{ color: palette.textColor }}>{score.business_name}</p>
                      <p className="text-sm" style={{ color: palette.mutedTextColor }}>Total Score: {score.total_score}/100</p>
                      <div className="text-xs mt-1" style={{ color: palette.mutedTextColor }}>
                        <div>Partnership Interest: {score.partnership_interest_score}/25</div>
                        <div>Company Size: {score.company_size_score}/25</div>
                        <div>Readiness: {score.readiness_score}/25</div>
                        <div>Budget: {score.budget_score}/25</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleRecalculateScore(score.business_id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Recalculate
                      </button>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                        score.total_score >= 75 ? 'bg-green-100 text-green-800' :
                        score.total_score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {score.total_score >= 75 ? 'High' : score.total_score >= 50 ? 'Medium' : 'Low'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {(!leadScores || leadScores.length === 0) && (
                <p className="py-4 text-center" style={{ color: palette.mutedTextColor }}>No lead scores yet. Click "Recalculate" on any business to generate scores.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "match-recommendations" && (
        <div className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: palette.textColor }}>Match Recommendations</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleGenerateMatches(parseInt(e.target.value));
                  }
                }}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              >
                <option value="">Select Business to Generate Matches</option>
                {businesses && Array.isArray(businesses) && businesses.map(business => (
                  <option key={business.id} value={business.id}>{business.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {matchRecommendations && Array.isArray(matchRecommendations) && matchRecommendations.map((match) => (
                <div key={match.id} className="rounded-lg border p-3" style={{ borderColor: palette.borderColor }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium" style={{ color: palette.textColor }}>
                        {match.business_name_1} ↔ {match.business_name_2}
                      </p>
                      <p className="text-sm" style={{ color: palette.mutedTextColor }}>Match Score: {match.match_score}/100</p>
                      <div className="text-xs mt-1" style={{ color: palette.mutedTextColor }}>
                        {Array.isArray(match.match_reasons) ? match.match_reasons.join(', ') : match.match_reasons}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <select
                        value={match.status}
                        onChange={(e) => handleUpdateMatchStatus(match.id, e.target.value)}
                        className="text-xs rounded border px-2 py-1"
                        style={{ borderColor: palette.borderColor }}
                      >
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                        match.match_score >= 70 ? 'bg-green-100 text-green-800' :
                        match.match_score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {match.match_score >= 70 ? 'High Match' : match.match_score >= 50 ? 'Medium Match' : 'Low Match'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {(!matchRecommendations || matchRecommendations.length === 0) && (
                <p className="py-4 text-center" style={{ color: palette.mutedTextColor }}>No match recommendations yet. Select a business and click "Generate Matches".</p>
              )}
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
              
              {surveyQuestions && surveyQuestions.length > 0 ? (() => {
                const groupedQuestions = {};
                surveyQuestions.forEach(q => {
                  if (!groupedQuestions[q.section_order]) {
                    groupedQuestions[q.section_order] = [];
                  }
                  groupedQuestions[q.section_order].push(q);
                });

                return Object.entries(groupedQuestions).map(([sectionNum, questions]) => (
                  <div key={`section-${sectionNum}`} className="border-b pb-4 mb-4" style={{ borderColor: palette.borderColor }}>
                    <h5 className="text-sm font-semibold mb-2" style={{ color: palette.textColor }}>Section {sectionNum}</h5>
                    {questions.map((question) => (
                      <div key={question.id} className="mb-3">
                        <label className="block text-sm mb-1" style={{ color: palette.textColor }}>
                          {question.question_text} {question.required && "*"}
                        </label>
                        {question.question_type === "text" && (
                          <input
                            type="text"
                            value={surveyForm[`question_${question.id}`] || ""}
                            disabled
                            className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-50"
                            style={{ borderColor: palette.borderColor }}
                          />
                        )}
                        {question.question_type === "email" && (
                          <input
                            type="email"
                            value={surveyForm[`question_${question.id}`] || ""}
                            disabled
                            className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-50"
                            style={{ borderColor: palette.borderColor }}
                          />
                        )}
                        {question.question_type === "tel" && (
                          <input
                            type="tel"
                            value={surveyForm[`question_${question.id}`] || ""}
                            disabled
                            className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-50"
                            style={{ borderColor: palette.borderColor }}
                          />
                        )}
                        {question.question_type === "textarea" && (
                          <textarea
                            value={surveyForm[`question_${question.id}`] || ""}
                            disabled
                            className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-50"
                            style={{ borderColor: palette.borderColor }}
                            rows={3}
                          />
                        )}
                        {question.question_type === "radio" && (
                          <div className="space-y-1">
                            {question.options.map((option) => (
                              <label key={option} className="flex items-center gap-2 text-sm">
                                <input
                                  type="radio"
                                  name={`question_${question.id}`}
                                  checked={surveyForm[`question_${question.id}`] === option}
                                  disabled
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        )}
                        {question.question_type === "checkbox" && (
                          <div className="grid grid-cols-2 gap-1">
                            {question.options.map((option) => (
                              <label key={option} className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={Array.isArray(surveyForm[`question_${question.id}`]) ? surveyForm[`question_${question.id}`].includes(option) : false}
                                  disabled
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        )}
                        {question.question_type === "checkbox" && Array.isArray(surveyForm[`question_${question.id}`]) && surveyForm[`question_${question.id}`].includes("Other") && (
                          <div className="mt-2 p-2 rounded bg-gray-50 text-sm">
                            <span className="font-medium">Other:</span> {surveyForm[`question_${question.id}_other`] || "Not specified"}
                          </div>
                        )}
                        {question.question_type === "radio" && surveyForm[`question_${question.id}`] === "Other" && (
                          <div className="mt-2 p-2 rounded bg-gray-50 text-sm">
                            <span className="font-medium">Other:</span> {surveyForm[`question_${question.id}_other`] || "Not specified"}
                          </div>
                        )}
                        {question.question_type === "scale" && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-4">
                              <span className="text-sm">1 (Lowest)</span>
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={surveyForm[`question_${question.id}`] || 5}
                                onChange={(e) => setSurveyForm({ ...surveyForm, [`question_${question.id}`]: parseInt(e.target.value) })}
                                className="flex-1"
                              />
                              <span className="text-sm">10 (Highest)</span>
                            </div>
                            <div className="text-center font-bold" style={{ color: palette.textColor }}>
                              {surveyForm[`question_${question.id}`] || 5}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ));
              })() : (
                <p className="text-sm" style={{ color: palette.mutedTextColor }}>No survey questions configured.</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setSurveyForm({});
                  }}
                  className="w-full rounded-lg border py-2 text-sm font-semibold"
                  style={{ borderColor: palette.borderColor, color: palette.textColor }}
                >
                  Close
                </button>
              </div>
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
                    <th className="px-4 py-2 text-left font-medium" style={{ color: palette.textColor }}>Dynamic Responses</th>
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
                      <td className="px-4 py-2" style={{ color: palette.textColor }}>
                        {response.responses_jsonb ? (
                          <div className="text-xs truncate max-w-xs">
                            {Object.keys(response.responses_jsonb).length} responses
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-2" style={{ color: palette.textColor }}>{new Date(response.submitted_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(response);
                              // For dynamic survey, use responses_jsonb data
                              const dynamicForm = {};
                              if (response.responses_jsonb) {
                                Object.entries(response.responses_jsonb).forEach(([key, value]) => {
                                  dynamicForm[key] = value;
                                });
                              }
                              setSurveyForm(dynamicForm);
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
                    const nextOrder = surveyQuestions.length > 0 ? Math.max(...surveyQuestions.map(q => q.question_order)) + 1 : 1;
                    setSurveyQuestionForm({
                      section_order: 1,
                      question_order: nextOrder,
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
                    const nextOrder = surveyQuestions.length > 0 ? Math.max(...surveyQuestions.map(q => q.question_order)) + 1 : 1;
                    setSurveyQuestionForm({
                      section_order: 1,
                      question_order: nextOrder,
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
                        onClick={() => handleMoveQuestionUp(question)}
                        disabled={surveyQuestions.findIndex(q => q.id === question.id) === 0}
                        className="rounded px-2 py-1 text-xs font-semibold"
                        style={{ backgroundColor: palette.surfaceMuted, color: palette.textColor }}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveQuestionDown(question)}
                        disabled={surveyQuestions.findIndex(q => q.id === question.id) === surveyQuestions.length - 1}
                        className="rounded px-2 py-1 text-xs font-semibold"
                        style={{ backgroundColor: palette.surfaceMuted, color: palette.textColor }}
                      >
                        ↓
                      </button>
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
