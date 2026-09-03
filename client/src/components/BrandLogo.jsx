import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

const sizeMap = {
  sm: "h-10 w-10 rounded-2xl text-sm",
  md: "h-12 w-12 rounded-2xl text-base",
  lg: "h-16 w-16 rounded-3xl text-lg"
};

const wordmarkMap = {
  sm: {
    title: "text-[9px] sm:text-sm",
    subtitle: "text-[9px] sm:text-sm",
    tracking: "tracking-[0.16em] sm:tracking-[0.24em]"
  },
  md: {
    title: "text-xs sm:text-sm",
    subtitle: "text-[11px] sm:text-sm",
    tracking: "tracking-[0.18em] sm:tracking-[0.24em]"
  },
  lg: {
    title: "text-sm sm:text-base",
    subtitle: "text-xs sm:text-sm",
    tracking: "tracking-[0.2em] sm:tracking-[0.24em]"
  }
};

const BrandLogo = ({ size = "md", showWordmark = false, brandName, supportLabel, logoUrl: logoOverride, logoAlt: logoAltOverride }) => {
  const { palette, settings } = useSiteSettings();
  const resolvedBrandName = brandName || settings.brandName;
  const resolvedSupportLabel = supportLabel || settings.supportLabel;
  const logoUrl = logoOverride ?? settings.branding?.logoUrl ?? "";
  const logoAlt = logoAltOverride || settings.branding?.logoAlt || resolvedBrandName;
  const wordmarkSize = wordmarkMap[size] || wordmarkMap.md;
  const fallbackLabel = resolvedBrandName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={logoAlt}
          className={`${sizeMap[size] || sizeMap.md} border object-contain p-2`}
          style={{ backgroundColor: palette.surfaceBackground, borderColor: palette.borderColor }}
        />
      ) : (
        <div
          className={`${sizeMap[size] || sizeMap.md} flex items-center justify-center border font-bold`}
          style={{
            background: `linear-gradient(135deg, ${palette.primarySoft}, ${palette.accent})`,
            borderColor: palette.borderColor,
            color: palette.primaryDeep
          }}
        >
          {fallbackLabel}
        </div>
      )}
      {showWordmark ? (
        <div className="min-w-0">
          <div className={`${wordmarkSize.title} ${wordmarkSize.tracking} font-semibold uppercase leading-tight`} style={{ color: palette.primaryDeep }}>
            {resolvedBrandName}
          </div>
          <div className={`${wordmarkSize.subtitle} leading-tight`} style={{ color: palette.mutedTextColor }}>
            {resolvedSupportLabel}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BrandLogo;
