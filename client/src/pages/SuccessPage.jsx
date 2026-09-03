import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import AnimatedPatternBackground from "../components/AnimatedPatternBackground.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

const SuccessPage = () => {
  const location = useLocation();
  const { palette, settings } = useSiteSettings();
  const state = location.state || {};
  const consent = state.consent;
  const email = state.email;

  const successTitle = state.title || settings.successTitle;
  const successBody = state.body || (consent ? settings.successBodyConsented : settings.successBodyDeclined);
  const homePath = state.homePath || "/";
  const anotherPath = state.anotherPath || "/form";

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden" style={{ backgroundColor: palette.pageBackground }}>
      <AnimatedPatternBackground />
      <div className="relative z-10 mx-auto my-8 w-full max-w-xl px-4 sm:my-12">
        <div className="rounded-[32px] border p-6 text-center shadow-soft backdrop-blur-xl sm:p-10" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
          <div className="relative mx-auto h-24 w-24">
            <div
              className="success-pop absolute inset-0 rounded-full opacity-20"
              style={{ backgroundColor: palette.primary }}
            />
            <div
              className="success-pop relative flex h-24 w-24 items-center justify-center rounded-full text-4xl text-white"
              style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryDeep})` }}
            >
              ✓
            </div>
          </div>

          <div className="success-pop-delay mt-6 text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: palette.primary }}>
            {consent ? "Submission received" : "Response recorded"}
          </div>

          <h1 className="success-pop-delay mt-3 text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: palette.textColor }}>
            {successTitle}
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 sm:text-base" style={{ color: palette.mutedTextColor }}>
            {successBody}
          </p>

          {email ? (
            <div className="mx-auto mt-5 max-w-sm rounded-2xl border p-4" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
              <div className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: palette.mutedTextColor }}>
                Reference email
              </div>
              <div className="mt-1 text-sm font-medium" style={{ color: palette.textColor }}>
                {email}
              </div>
            </div>
          ) : null}

          {consent ? (
            <div className="mx-auto mt-6 grid max-w-sm gap-3 text-left sm:grid-cols-2">
              <div className="rounded-2xl border p-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.accent }}>
                <div className="text-xs font-bold" style={{ color: palette.primaryDeep }}>What happens next?</div>
                <div className="mt-1 text-xs leading-5" style={{ color: palette.mutedTextColor }}>Our team reviews your details before publishing.</div>
              </div>
              <div className="rounded-2xl border p-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.accent }}>
                <div className="text-xs font-bold" style={{ color: palette.primaryDeep }}>Need to update info?</div>
                <div className="mt-1 text-xs leading-5" style={{ color: palette.mutedTextColor }}>Submit again with the same email to request changes.</div>
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-row items-center justify-center gap-3">
            <Link
              to={homePath}
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
              style={{ backgroundColor: palette.primary }}
            >
              Return home
            </Link>
            <Link
              to={anotherPath}
              className="inline-flex items-center justify-center rounded-2xl border-2 px-5 py-3 text-sm font-semibold transition hover:bg-slate-50"
              style={{ borderColor: palette.borderColor, color: palette.textColor }}
            >
              Submit another
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
};

export default SuccessPage;
