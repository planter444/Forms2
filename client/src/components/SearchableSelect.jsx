import { useEffect, useMemo, useRef, useState } from "react";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

const SearchableSelect = ({
  id,
  label,
  value,
  onChange,
  options,
  error,
  helper,
  placeholder = "Search and select",
  activeTrace = false
}) => {
  const { palette } = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
        setQuery(value || "");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [value]);

  const filteredOptions = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return options;
    }

    return options.filter((option) => option.toLowerCase().includes(search));
  }, [options, query]);

  return (
    <div className="space-y-2" ref={containerRef}>
      <label htmlFor={id} className="block text-sm font-medium" style={{ color: palette.textColor }}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={open ? query : value || query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          className={`${activeTrace ? "field-trace border-transparent" : "border"} w-full rounded-2xl px-4 py-4 text-base shadow-sm outline-none transition focus:ring-4 ${
            error ? "focus:ring-rose-100" : "focus:ring-slate-100"
          }`}
          style={{
            backgroundColor: palette.fieldBackground || palette.surfaceBackground,
            color: palette.textColor,
            borderColor: error ? "#f43f5e" : activeTrace ? "transparent" : palette.borderColor,
            "--trace-color": error ? "#f43f5e" : palette.primary,
            "--trace-accent": palette.primarySoft,
            "--trace-fill": palette.fieldBackground || palette.surfaceBackground
          }}
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
        />
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="absolute inset-y-2 right-2 rounded-xl px-3 transition"
          style={{ color: palette.mutedTextColor }}
          aria-label={`Toggle ${label} options`}
        >
          ▾
        </button>
        {open ? (
          <div
            className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border p-2 shadow-soft animate-fade-in"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setQuery(option);
                    setOpen(false);
                  }}
                  className="flex w-full items-center rounded-xl px-3 py-3 text-left text-sm transition"
                  style={{
                    backgroundColor: option === value ? palette.accent : "transparent",
                    color: option === value ? palette.primaryDeep : palette.textColor
                  }}
                >
                  {option}
                </button>
              ))
            ) : (
              <div className="rounded-xl px-3 py-4 text-sm" style={{ color: palette.mutedTextColor }}>
                No matches found.
              </div>
            )}
          </div>
        ) : null}
      </div>
      {helper ? (
        <p id={`${id}-helper`} className="text-sm" style={{ color: palette.mutedTextColor }}>
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default SearchableSelect;
