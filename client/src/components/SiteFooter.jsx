import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

const isInternalLink = (href = "") => href.startsWith("/") || href.startsWith("#");
const isHashLink = (href = "") => href.startsWith("#") || href.startsWith("/#");
const defaultDraftKey = "kerea-form-draft-v1";
const desktopHomepageFooterClasses = {
  normal: {
    wrapper: "lg:gap-4 lg:py-6",
    title: "lg:text-base",
    body: "lg:text-xs lg:leading-5",
    note: "lg:mt-2 lg:text-[11px]",
    nav: "lg:gap-2",
    button: "lg:px-3 lg:py-1.5 lg:text-xs"
  },
  large: {
    wrapper: "lg:gap-5 lg:py-8",
    title: "lg:text-lg",
    body: "lg:text-sm lg:leading-6",
    note: "lg:mt-3 lg:text-xs",
    nav: "lg:gap-3",
    button: "lg:px-4 lg:py-2 lg:text-sm"
  },
  xl: {
    wrapper: "lg:gap-6 lg:py-10",
    title: "lg:text-xl",
    body: "lg:text-base lg:leading-7",
    note: "lg:mt-4 lg:text-sm",
    nav: "lg:gap-4",
    button: "lg:px-5 lg:py-2.5 lg:text-base"
  }
};

const hasFormDraft = (draftKey = defaultDraftKey) => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const rawDraft = window.localStorage.getItem(draftKey);
    const parsedDraft = rawDraft ? JSON.parse(rawDraft) : null;
    const formValues = parsedDraft?.formValues || {};

    return Boolean(
      formValues.email ||
        formValues.consent !== null ||
        formValues.fullName ||
        formValues.phoneNumber ||
        formValues.category?.length ||
        formValues.declineReason ||
        formValues.countyCoverageEntries?.some((entry) => entry.county) ||
        formValues.companyName ||
        formValues.businessRegNumber
    );
  } catch {
    return false;
  }
};

const SiteFooter = ({ desktopHomepageSize = "", desktopScaleStyle, draftKey = defaultDraftKey, resumeHref = "/form", footer: footerProp, basePath = "/" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { palette, settings } = useSiteSettings();
  const footer = footerProp || settings.footer || {};

  if (!footer.enabled) {
    return null;
  }

  const legacyLinks = [
    { label: footer.primaryLinkLabel, href: footer.primaryLinkHref },
    { label: footer.secondaryLinkLabel, href: footer.secondaryLinkHref }
  ].filter((item) => item.label && item.href);
  const links = Array.isArray(footer.links) && footer.links.length
    ? footer.links.filter((item) => item.label && item.href)
    : legacyLinks;
  const draftExists = hasFormDraft(draftKey);
  const resolvedLinks = links.map((link) =>
    draftExists && link.href === resumeHref && link.label.toLowerCase().includes("start")
      ? { ...link, label: link.label.replace(/start form/i, "Resume form").replace(/start/i, "Resume") }
      : link
  );
  const body = footer.body || footer.description || "";
  const note = footer.note || footer.copyright || "";
  const supportTitle = footer.supportTitle || "Need help?";
  const supportPhone = footer.supportPhone || "";
  const supportEmail = footer.supportEmail || "";
  const hasSupportContacts = Boolean(supportPhone || supportEmail);
  const stacked = footer.layout === "stacked";
  const homepageFooterClasses = desktopHomepageFooterClasses[desktopHomepageSize] || desktopHomepageFooterClasses.normal;
  const footerButtonStyle = {
    borderColor: palette.borderColor,
    color: palette.footerButtonTextColor || palette.footerTextColor || palette.textColor,
    backgroundColor: palette.footerButtonBackground || palette.surfaceBackground
  };
  const scrollToHashTarget = (hash) => {
    const target = document.getElementById(hash.replace("#", ""));

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  const handleHashLinkClick = (href, event) => {
    event.preventDefault();

    const hash = href.includes("#") ? `#${href.split("#").pop()}` : href;

    if (location.pathname !== basePath) {
      navigate({ pathname: basePath, hash });
      window.setTimeout(() => scrollToHashTarget(hash), 100);
      return;
    }

    window.history.replaceState(null, "", hash);
    scrollToHashTarget(hash);
  };

  return (
    <footer className="relative z-10 border-t" style={{ borderColor: palette.borderColor, backgroundColor: palette.footerBackground || palette.headerBackground }}>
      <div className={`mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:px-8 ${homepageFooterClasses.wrapper} ${stacked ? "text-center" : "md:grid-cols-[1fr_auto] md:items-center"}`} style={desktopScaleStyle}>
        <div className={stacked ? "mx-auto max-w-2xl" : "max-w-2xl"}>
          <div className={`text-lg font-bold ${homepageFooterClasses.title}`} style={{ color: palette.footerTextColor || palette.textColor }}>
            {footer.title || settings.brandName}
          </div>
          {body ? (
            <p className={`mt-2 text-sm leading-6 ${homepageFooterClasses.body}`} style={{ color: palette.footerMutedTextColor || palette.mutedTextColor }}>
              {body}
            </p>
          ) : null}
          {note ? (
            <div className={`mt-3 text-xs ${homepageFooterClasses.note}`} style={{ color: palette.footerMutedTextColor || palette.mutedTextColor }}>
              {note}
            </div>
          ) : null}
        </div>
        {resolvedLinks.length || hasSupportContacts ? (
          <div className={`flex flex-col gap-4 ${stacked ? "items-center" : "md:items-end"}`}>
            {hasSupportContacts ? (
              <div className={`${stacked ? "text-center" : "md:text-right"}`}>
                <div className={`text-sm font-bold ${homepageFooterClasses.title}`} style={{ color: palette.footerTextColor || palette.textColor }}>
                  {supportTitle}
                </div>
                <div className={`mt-2 flex flex-wrap gap-2 text-sm ${stacked ? "justify-center" : "md:justify-end"}`} style={{ color: palette.footerMutedTextColor || palette.mutedTextColor }}>
                  {supportPhone ? <a href={`tel:${supportPhone.replace(/\s+/g, "")}`} className="font-semibold transition hover:underline">{supportPhone}</a> : null}
                  {supportEmail ? <a href={`mailto:${supportEmail}`} className="font-semibold transition hover:underline">{supportEmail}</a> : null}
                </div>
              </div>
            ) : null}
            {resolvedLinks.length ? (
              <nav className={`flex flex-wrap gap-3 ${homepageFooterClasses.nav} ${stacked ? "justify-center" : "md:justify-end"}`}>
                {resolvedLinks.map((link) =>
                  isHashLink(link.href) ? (
                    <a key={`${link.label}-${link.href}`} href={link.href.startsWith("#") ? `/${link.href}` : link.href} onClick={(event) => handleHashLinkClick(link.href, event)} className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${homepageFooterClasses.button}`} style={footerButtonStyle}>
                      {link.label}
                    </a>
                  ) : isInternalLink(link.href) ? (
                    <Link key={`${link.label}-${link.href}`} to={link.href} className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${homepageFooterClasses.button}`} style={footerButtonStyle}>
                      {link.label}
                    </Link>
                  ) : (
                    <a key={`${link.label}-${link.href}`} href={link.href} className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${homepageFooterClasses.button}`} style={footerButtonStyle}>
                      {link.label}
                    </a>
                  )
                )}
              </nav>
            ) : null}
          </div>
        ) : null}
      </div>
    </footer>
  );
};

export default SiteFooter;
