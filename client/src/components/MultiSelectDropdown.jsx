import { useEffect, useMemo, useRef, useState } from "react";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

const compareText = (left, right) => `${left}`.localeCompare(`${right}`);

const MultiSelectDropdown = ({
  id,
  label,
  options,
  values,
  onChange,
  helper,
  placeholder = "Select options",
  error,
  disabled = false,
  activeTrace = false,
  selectAllLabel = "Select all",
  clearLabel = "Clear all",
  doneLabel = "Done",
  enableSelectAll = false,
  showSelectedChips = true
}) => {
  const { palette } = useSiteSettings();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const summary = useMemo(() => {
    if (!values.length) {
      return "";
    }

    if (values.length <= 2) {
      return values.join(", ");
    }

    return `${values.slice(0, 2).join(", ")} +${values.length - 2} more`;
  }, [values]);

  const orderedValues = useMemo(() => [...values].sort(compareText), [values]);
  const allSelected = options.length > 0 && values.length === options.length;

  const toggleOption = (option, checked) => {
    if (checked) {
      onChange([...values, option].sort(compareText));
      return;
    }

    onChange(values.filter((value) => value !== option));
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <label htmlFor={id} className="block text-sm font-medium" style={{ color: palette.textColor }}>
        {label}
      </label>
      <div className="relative">
        <button
          id={id}
          type="button"
          onClick={() => !disabled && setOpen((current) => !current)}
          disabled={disabled}
          className={`${activeTrace ? "field-trace border-transparent" : "border"} flex min-h-[58px] w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-base shadow-sm outline-none transition ${
            disabled ? "cursor-not-allowed opacity-60" : ""
          }`}
          style={{
            backgroundColor: palette.fieldBackground || palette.surfaceBackground,
            color: summary ? palette.textColor : palette.mutedTextColor,
            borderColor: error ? "#f43f5e" : activeTrace ? "transparent" : palette.borderColor,
            "--trace-color": error ? "#f43f5e" : palette.primary,
            "--trace-accent": palette.primarySoft,
            "--trace-fill": palette.fieldBackground || palette.surfaceBackground
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
        >
          <span className="flex-1">{summary || placeholder}</span>
          <span className="shrink-0" style={{ color: palette.mutedTextColor }}>{open ? "▴" : "▾"}</span>
        </button>
        {open ? (
          <div
            className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border shadow-soft"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
          >
            <div className="max-h-64 overflow-auto p-2">
              {enableSelectAll ? (
                <button
                  type="button"
                  onClick={() => onChange(allSelected ? [] : [...options].sort(compareText))}
                  className="mb-2 flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold transition"
                  style={{
                    backgroundColor: allSelected ? palette.accent : palette.surfaceMuted,
                    color: allSelected ? palette.primaryDeep : palette.textColor
                  }}
                >
                  <span>{selectAllLabel}</span>
                  <span>{allSelected ? "✓" : "+"}</span>
                </button>
              ) : null}
              {options.map((option) => {
                const selected = values.includes(option);
                return (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm transition"
                    style={{
                      backgroundColor: selected ? palette.accent : "transparent",
                      color: palette.textColor
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(event) => toggleOption(option, event.target.checked)}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
              {!options.length ? (
                <div className="rounded-xl px-3 py-4 text-sm" style={{ color: palette.mutedTextColor }}>
                  No options available.
                </div>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-3 border-t px-3 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
              <button
                type="button"
                onClick={() => onChange([])}
                className="rounded-xl px-3 py-2 text-sm font-semibold transition"
                style={{ color: values.length ? palette.primaryDeep : palette.mutedTextColor }}
                disabled={!values.length}
              >
                {clearLabel}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: palette.primary }}
              >
                {doneLabel}
              </button>
            </div>
          </div>
        ) : null}
      </div>
      {showSelectedChips && orderedValues.length ? (
        <div className="flex flex-wrap gap-2">
          {orderedValues.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange(values.filter((item) => item !== value))}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
              style={{ borderColor: palette.borderColor, backgroundColor: palette.accent, color: palette.primaryDeep }}
            >
              <span>{value}</span>
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      ) : null}
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

export default MultiSelectDropdown;
