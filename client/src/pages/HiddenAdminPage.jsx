import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  adminLogin,
  exportSubmissions,
  getSubmissions,
  resetSiteSettings,
  updateSiteSettings
} from "../lib/api.js";
import { clearAdminAccess, getAdminAccess, grantAdminAccess } from "../lib/adminAccess.js";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";
import {
  backgroundOptions,
  defaultSiteSettings,
  paletteOptions,
  patternOptions
} from "../lib/siteTheme.js";

const storageKey = "kerea-admin-token";

const toMultiline = (items, fallback) => (items && items.length ? items : fallback).join("\n");

const createEditorState = (settings) => ({
  brandName: settings.brandName,
  supportLabel: settings.supportLabel,
  heroBadge: settings.heroBadge,
  heroTitle: settings.heroTitle,
  heroDescription: settings.heroDescription,
  heroPrimaryCta: settings.heroPrimaryCta,
  heroSecondaryCta: settings.heroSecondaryCta,
  formPageTitle: settings.formPageTitle,
  formPageDescription: settings.formPageDescription,
  formBanner: settings.formBanner,
  whyItMattersTitle: settings.whyItMattersTitle,
  whyItMattersBody: settings.whyItMattersBody,
  successTitle: settings.successTitle,
  successBodyConsented: settings.successBodyConsented,
  successBodyDeclined: settings.successBodyDeclined,
  statOneValue: settings.heroStats?.[0]?.value || defaultSiteSettings.heroStats[0].value,
  statOneLabel: settings.heroStats?.[0]?.label || defaultSiteSettings.heroStats[0].label,
  statTwoValue: settings.heroStats?.[1]?.value || defaultSiteSettings.heroStats[1].value,
  statTwoLabel: settings.heroStats?.[1]?.label || defaultSiteSettings.heroStats[1].label,
  statThreeValue: settings.heroStats?.[2]?.value || defaultSiteSettings.heroStats[2].value,
  statThreeLabel: settings.heroStats?.[2]?.label || defaultSiteSettings.heroStats[2].label,
  highlightsText: toMultiline(settings.landingHighlights, defaultSiteSettings.landingHighlights),
  tipsText: toMultiline(settings.formTips, defaultSiteSettings.formTips),
  stepOneTitle: settings.howItWorksSteps?.[0]?.title || defaultSiteSettings.howItWorksSteps[0].title,
  stepOneBody: settings.howItWorksSteps?.[0]?.body || defaultSiteSettings.howItWorksSteps[0].body,
  stepTwoTitle: settings.howItWorksSteps?.[1]?.title || defaultSiteSettings.howItWorksSteps[1].title,
  stepTwoBody: settings.howItWorksSteps?.[1]?.body || defaultSiteSettings.howItWorksSteps[1].body,
  stepThreeTitle: settings.howItWorksSteps?.[2]?.title || defaultSiteSettings.howItWorksSteps[2].title,
  stepThreeBody: settings.howItWorksSteps?.[2]?.body || defaultSiteSettings.howItWorksSteps[2].body,
  palette: settings.theme.palette,
  heroLayout: settings.theme.heroLayout,
  backgroundStyle: settings.theme.backgroundStyle,
  pattern: settings.theme.pattern,
  patternsEnabled: settings.theme.patternsEnabled,
  patternMotion: settings.theme.patternMotion,
  ctaPulse: settings.theme.ctaPulse,
  formTipsLayout: settings.theme.formTipsLayout
});

const normalizeLines = (value, fallback) => {
  const items = `${value || ""}`
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length ? items : fallback;
};

const HiddenAdminPage = () => {
  const location = useLocation();
  const { palette, refreshSettings, setSettings, settings } = useSiteSettings();
  const [token, setToken] = useState(() => localStorage.getItem(storageKey) || "");
  const [password, setPassword] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState("");
  const [editorState, setEditorState] = useState(() => createEditorState(settings));

  const gatedEmail = useMemo(() => {
    const fromState = location.state?.prefillEmail || "";
    const fromSession = getAdminAccess()?.email || "";
    return fromState || fromSession;
  }, [location.state]);

  const hasHiddenGate = Boolean(location.state?.gate === "hidden" || getAdminAccess()?.email || token);

  const loadSubmissions = async (authToken) => {
    setLoading(true);
    setError("");

    try {
      const data = await getSubmissions(authToken);
      setSubmissions(data.submissions || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load submissions.");
      if (requestError.status === 401) {
        localStorage.removeItem(storageKey);
        setToken("");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setEditorState(createEditorState(settings));
  }, [settings]);

  useEffect(() => {
    if (token) {
      loadSubmissions(token);
    }
  }, [token]);

  const stats = useMemo(() => {
    const listed = submissions.filter((item) => item.consent).length;
    const declined = submissions.length - listed;

    return [
      { label: "Total submissions", value: submissions.length },
      { label: "Consented", value: listed },
      { label: "Declined", value: declined }
    ];
  }, [submissions]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthenticating(true);
    setError("");

    try {
      const data = await adminLogin({ email: gatedEmail, password });
      grantAdminAccess(gatedEmail);
      localStorage.setItem(storageKey, data.token);
      setToken(data.token);
      setPassword("");
    } catch (requestError) {
      setError(requestError.message || "Login failed.");
    } finally {
      setAuthenticating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(storageKey);
    clearAdminAccess();
    setToken("");
    setSubmissions([]);
    setPassword("");
  };

  const handleExport = async () => {
    try {
      const blob = await exportSubmissions(token);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "submissions.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.message || "Export failed.");
    }
  };

  const applyEditorChange = (field, value) => {
    setEditorState((current) => ({ ...current, [field]: value }));
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setError("");

    const payload = {
      brandName: editorState.brandName.trim(),
      supportLabel: editorState.supportLabel.trim(),
      heroBadge: editorState.heroBadge.trim(),
      heroTitle: editorState.heroTitle.trim(),
      heroDescription: editorState.heroDescription.trim(),
      heroPrimaryCta: editorState.heroPrimaryCta.trim(),
      heroSecondaryCta: editorState.heroSecondaryCta.trim(),
      formPageTitle: editorState.formPageTitle.trim(),
      formPageDescription: editorState.formPageDescription.trim(),
      formBanner: editorState.formBanner.trim(),
      whyItMattersTitle: editorState.whyItMattersTitle.trim(),
      whyItMattersBody: editorState.whyItMattersBody.trim(),
      successTitle: editorState.successTitle.trim(),
      successBodyConsented: editorState.successBodyConsented.trim(),
      successBodyDeclined: editorState.successBodyDeclined.trim(),
      heroStats: [
        { value: editorState.statOneValue.trim(), label: editorState.statOneLabel.trim() },
        { value: editorState.statTwoValue.trim(), label: editorState.statTwoLabel.trim() },
        { value: editorState.statThreeValue.trim(), label: editorState.statThreeLabel.trim() }
      ],
      landingHighlights: normalizeLines(editorState.highlightsText, defaultSiteSettings.landingHighlights),
      formTips: normalizeLines(editorState.tipsText, defaultSiteSettings.formTips),
      howItWorksSteps: [
        { title: editorState.stepOneTitle.trim(), body: editorState.stepOneBody.trim() },
        { title: editorState.stepTwoTitle.trim(), body: editorState.stepTwoBody.trim() },
        { title: editorState.stepThreeTitle.trim(), body: editorState.stepThreeBody.trim() }
      ],
      theme: {
        palette: editorState.palette,
        heroLayout: editorState.heroLayout,
        backgroundStyle: editorState.backgroundStyle,
        pattern: editorState.pattern,
        patternsEnabled: editorState.patternsEnabled,
        patternMotion: editorState.patternMotion,
        ctaPulse: editorState.ctaPulse,
        formTipsLayout: editorState.formTipsLayout
      }
    };

    try {
      const data = await updateSiteSettings(token, payload);
      setSettings(data.settings);
      await refreshSettings();
    } catch (requestError) {
      setError(requestError.message || "Unable to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetSettings = async () => {
    setSavingSettings(true);
    setError("");

    try {
      const data = await resetSiteSettings(token);
      setSettings(data.settings);
      await refreshSettings();
    } catch (requestError) {
      setError(requestError.message || "Unable to reset settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  if (!token && !hasHiddenGate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-white/90 p-8 shadow-soft backdrop-blur-xl">
          <div className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: palette.primary }}>
            Hidden admin access
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Access path is not public</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            To open the admin panel, start from the listing form, enter the admin email, choose “No, I prefer not to be listed”, and continue.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              to="/form"
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: palette.primary }}
            >
              Go to form
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/90 p-8 shadow-soft backdrop-blur-xl">
          <div className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: palette.primary }}>
            Hidden admin access
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Enter password</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Hidden access was detected from the form. Continue with your admin password.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleLogin}>
            <input
              type="email"
              value={gatedEmail}
              readOnly
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Admin password"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:ring-4"
              style={{ boxShadow: `0 0 0 0 ${palette.primaryGlow}` }}
              autoComplete="current-password"
            />
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={authenticating}
              className="w-full rounded-2xl px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-300"
              style={{ backgroundColor: authenticating ? "#cbd5e1" : palette.primary }}
            >
              {authenticating ? "Signing in..." : "Open admin panel"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-12">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-white/10 bg-white/90 p-6 shadow-soft backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: palette.primary }}>
                Site control center
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                Hidden admin dashboard
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Update copy, layout, colors, CTA emphasis, animated patterns, and monitor submissions.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => loadSubmissions(token)}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Refresh submissions
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="rounded-2xl px-5 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: palette.primary }}
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {stats.map((item) => (
            <div key={item.label} className="rounded-[28px] border border-white/10 bg-white/85 p-5 shadow-soft backdrop-blur">
              <div className="text-sm text-slate-500">{item.label}</div>
              <div className="mt-2 text-3xl font-bold text-slate-950">{item.value}</div>
            </div>
          ))}
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[32px] border border-white/10 bg-white/90 p-6 shadow-soft backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: palette.primary }}>
                  Appearance and content
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Edit the public pages</h2>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleResetSettings}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Reset defaults
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="rounded-2xl px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
                  style={{ backgroundColor: savingSettings ? "#cbd5e1" : palette.primary }}
                >
                  {savingSettings ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-slate-900">Brand and hero</h3>
                {[
                  ["brandName", "Brand name"],
                  ["supportLabel", "Support label"],
                  ["heroBadge", "Hero badge"],
                  ["heroTitle", "Hero title"],
                  ["heroDescription", "Hero description"],
                  ["heroPrimaryCta", "Primary CTA"],
                  ["heroSecondaryCta", "Secondary CTA"]
                ].map(([field, label]) => (
                  <label key={field} className="block text-sm font-medium text-slate-700">
                    {label}
                    <input
                      type="text"
                      value={editorState[field]}
                      onChange={(event) => applyEditorChange(field, event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                    />
                  </label>
                ))}
              </div>

              <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-slate-900">Theme controls</h3>
                <label className="block text-sm font-medium text-slate-700">
                  Color palette
                  <select
                    value={editorState.palette}
                    onChange={(event) => applyEditorChange("palette", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                  >
                    {paletteOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Hero layout
                  <select
                    value={editorState.heroLayout}
                    onChange={(event) => applyEditorChange("heroLayout", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                  >
                    <option value="split">Split</option>
                    <option value="stacked">Stacked</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Background style
                  <select
                    value={editorState.backgroundStyle}
                    onChange={(event) => applyEditorChange("backgroundStyle", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                  >
                    {backgroundOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Pattern
                  <select
                    value={editorState.pattern}
                    onChange={(event) => applyEditorChange("pattern", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                  >
                    {patternOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  Enable background patterns
                  <input
                    type="checkbox"
                    checked={editorState.patternsEnabled}
                    onChange={(event) => applyEditorChange("patternsEnabled", event.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  Animate patterns
                  <input
                    type="checkbox"
                    checked={editorState.patternMotion}
                    onChange={(event) => applyEditorChange("patternMotion", event.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  Pulse the start-form CTA
                  <input
                    type="checkbox"
                    checked={editorState.ctaPulse}
                    onChange={(event) => applyEditorChange("ctaPulse", event.target.checked)}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Form tips layout
                  <select
                    value={editorState.formTipsLayout}
                    onChange={(event) => applyEditorChange("formTipsLayout", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                  >
                    <option value="row">Row</option>
                    <option value="stack">Stack</option>
                  </select>
                </label>
              </div>

              <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-slate-900">Form and success copy</h3>
                {[
                  ["formPageTitle", "Form page title"],
                  ["formPageDescription", "Form page description"],
                  ["formBanner", "Form banner"],
                  ["whyItMattersTitle", "Why it matters title"],
                  ["whyItMattersBody", "Why it matters body"],
                  ["successTitle", "Success title"],
                  ["successBodyConsented", "Success body for consented"],
                  ["successBodyDeclined", "Success body for declined"]
                ].map(([field, label]) => (
                  <label key={field} className="block text-sm font-medium text-slate-700">
                    {label}
                    <textarea
                      value={editorState[field]}
                      onChange={(event) => applyEditorChange(field, event.target.value)}
                      rows={field.includes("Title") ? 2 : 4}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                    />
                  </label>
                ))}
              </div>

              <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-slate-900">Cards and steps</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["statOneValue", "Stat 1 value"],
                    ["statOneLabel", "Stat 1 label"],
                    ["statTwoValue", "Stat 2 value"],
                    ["statTwoLabel", "Stat 2 label"],
                    ["statThreeValue", "Stat 3 value"],
                    ["statThreeLabel", "Stat 3 label"]
                  ].map(([field, label]) => (
                    <label key={field} className="block text-sm font-medium text-slate-700">
                      {label}
                      <input
                        type="text"
                        value={editorState[field]}
                        onChange={(event) => applyEditorChange(field, event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                      />
                    </label>
                  ))}
                </div>
                <label className="block text-sm font-medium text-slate-700">
                  Highlights
                  <textarea
                    rows={6}
                    value={editorState.highlightsText}
                    onChange={(event) => applyEditorChange("highlightsText", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Form tips
                  <textarea
                    rows={5}
                    value={editorState.tipsText}
                    onChange={(event) => applyEditorChange("tipsText", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                  />
                </label>
                {[
                  ["stepOneTitle", "Step 1 title"],
                  ["stepOneBody", "Step 1 body"],
                  ["stepTwoTitle", "Step 2 title"],
                  ["stepTwoBody", "Step 2 body"],
                  ["stepThreeTitle", "Step 3 title"],
                  ["stepThreeBody", "Step 3 body"]
                ].map(([field, label]) => (
                  <label key={field} className="block text-sm font-medium text-slate-700">
                    {label}
                    <textarea
                      rows={field.includes("Title") ? 2 : 3}
                      value={editorState[field]}
                      onChange={(event) => applyEditorChange(field, event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                    />
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-white/90 p-6 shadow-soft backdrop-blur-xl">
            <div className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: palette.primary }}>
              Submission records
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Latest responses</h2>
            <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      {["Email", "Consent", "Name", "Phone", "Category / reason", "County", "Submitted"].map((header) => (
                        <th
                          key={header}
                          className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {loading ? (
                      <tr>
                        <td className="px-4 py-8 text-sm text-slate-500" colSpan={7}>
                          Loading submissions...
                        </td>
                      </tr>
                    ) : submissions.length > 0 ? (
                      submissions.map((submission) => (
                        <tr key={submission.id} className="align-top">
                          <td className="px-4 py-4 text-sm text-slate-700">{submission.email}</td>
                          <td className="px-4 py-4 text-sm text-slate-700">{submission.consent ? "Yes" : "No"}</td>
                          <td className="px-4 py-4 text-sm text-slate-700">{submission.full_name || "-"}</td>
                          <td className="px-4 py-4 text-sm text-slate-700">{submission.phone_number || "-"}</td>
                          <td className="px-4 py-4 text-sm text-slate-700">
                            {submission.category || submission.decline_reason || "-"}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">{submission.county || "-"}</td>
                          <td className="px-4 py-4 text-sm text-slate-700">
                            {new Date(submission.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-8 text-sm text-slate-500" colSpan={7}>
                          No submissions yet or the database is currently unavailable.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HiddenAdminPage;
