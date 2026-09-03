import SearchableSelect from "./SearchableSelect.jsx";
import MultiSelectDropdown from "./MultiSelectDropdown.jsx";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";
import {
  buildCoverageSummary,
  createCountyCoverageEntry,
  formatCountyCoverageEntry,
  getCountyOptions,
  hasCountyCoverageEntryStarted,
  getSubCountyOptions,
  getWardOptions,
  isCountyCoverageEntryComplete
} from "../lib/locationCoverage.js";

const focusElement = (id) => {
  const element = document.getElementById(id);

  if (!element) {
    return;
  }

  element.focus();
  element.scrollIntoView({ behavior: "smooth", block: "center" });
};

const getSelectClasses = (activeTrace, error) =>
  `${activeTrace ? "field-trace border-transparent" : "border"} mt-2 w-full rounded-2xl px-4 py-3 outline-none transition focus:ring-4 ${
    error ? "focus:ring-rose-100" : "focus:ring-slate-100"
  }`;

const CountyCoverageSelector = ({ entries, onChange, errors = {} }) => {
  const { palette } = useSiteSettings();

  const updateEntry = (entryId, updates) => {
    onChange(
      entries.map((entry) => {
        if (entry.id !== entryId) {
          return entry;
        }

        return { ...entry, ...updates };
      })
    );
  };

  const removeEntry = (entryId) => {
    onChange(entries.filter((entry) => entry.id !== entryId));
  };

  const addCounty = () => {
    onChange([...entries, createCountyCoverageEntry("")]);
  };

   const countyOptions = getCountyOptions();
  const completeEntries = entries.filter((entry) => isCountyCoverageEntryComplete(entry));
  const canAddCounty =
    entries.every((entry) => !hasCountyCoverageEntryStarted(entry) || isCountyCoverageEntryComplete(entry)) &&
    entries.length < countyOptions.length;
  const errorMessage = errors.county || errors.coverageMode || errors.coverageDetails || "";

  return (
    <div className="space-y-5">
      {entries.map((entry, index) => {
        const selectedByOthers = entries
          .filter((item) => item.id !== entry.id)
          .map((item) => item.county)
          .filter(Boolean);
        const availableCountyOptions = countyOptions.filter(
          (option) => option === entry.county || !selectedByOthers.includes(option)
        );
        const availableSubCounties = getSubCountyOptions(entry.county);
        const hasSubCounties = availableSubCounties.length > 0;
        const requiresSelectedSubCounties = entry.subCountyMode === "selected_sub_counties";
        const hasChosenSubCounties = entry.selectedSubCounties.length > 0;
        const activeSubCounties =
          entry.subCountyMode === "all_sub_counties"
            ? availableSubCounties
            : availableSubCounties.filter((subCounty) => entry.selectedSubCounties.includes(subCounty));
        const missingWardSelections =
          entry.wardMode === "selected_wards"
            ? activeSubCounties.filter((subCounty) => !(entry.selectedWardsBySubCounty?.[subCounty] || []).length)
            : [];
        const countyError = Boolean(errors.county && !entry.county);
        const subCountyModeError = Boolean(
          (errors.coverageMode || errors.coverageDetails) && entry.county && !entry.subCountyMode
        );
        const selectedSubCountiesError = Boolean(
          (errors.coverageMode || errors.coverageDetails) && requiresSelectedSubCounties && !hasChosenSubCounties
        );
        const wardSelectionError = Boolean(
          (errors.coverageMode || errors.coverageDetails) &&
            entry.wardMode === "selected_wards" &&
            missingWardSelections.length > 0
        );
        const activeField = !entry.county
          ? "county"
          : !entry.subCountyMode
            ? "subCountyMode"
            : requiresSelectedSubCounties && !hasChosenSubCounties
              ? "subCounties"
              : missingWardSelections.length > 0
                ? `wards:${missingWardSelections[0]}`
                : "";
        const isEntryComplete = isCountyCoverageEntryComplete(entry);

        return (
          <div
            key={entry.id}
            className="space-y-4 rounded-[28px] border p-5"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: palette.primary }}>
                  County coverage {index + 1}
                </div>
                <div className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>
                  Select the county, then choose whether you cover every sub-county and ward or only specific areas.
                </div>
              </div>
              {entries.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="rounded-2xl border px-4 py-2 text-sm font-semibold"
                  style={{ borderColor: palette.borderColor, color: palette.textColor }}
                >
                  Remove county
                </button>
              ) : null}
            </div>

            <SearchableSelect
              id={`county-${entry.id}`}
              label="County of operation"
              value={entry.county}
              onChange={(county) =>
                updateEntry(entry.id, {
                  county,
                  subCountyMode: "",
                  wardMode: "",
                  selectedSubCounties: [],
                  selectedWardsBySubCounty: {}
                })
              }
              options={availableCountyOptions}
              helper="You can add another county after finishing this one."
              placeholder="Start typing your county"
              error={countyError ? errors.county : ""}
              activeTrace={activeField === "county"}
            />

            {entry.county ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    updateEntry(entry.id, {
                      county: "",
                      subCountyMode: "",
                      wardMode: "",
                      selectedSubCounties: [],
                      selectedWardsBySubCounty: {}
                    })
                  }
                  className="rounded-2xl border px-4 py-2 text-sm font-semibold"
                  style={{ borderColor: palette.borderColor, color: palette.textColor }}
                >
                  Clear county selection
                </button>
              </div>
            ) : null}

            {entry.county ? (
              <>
                {hasSubCounties ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      Coverage in {entry.county}
                      <select
                        value={entry.subCountyMode}
                        onChange={(event) =>
                          updateEntry(entry.id, {
                            subCountyMode: event.target.value,
                            wardMode: event.target.value === "all_sub_counties" ? "all_wards" : "",
                            selectedSubCounties: [],
                            selectedWardsBySubCounty: {}
                          })
                        }
                        className={getSelectClasses(activeField === "subCountyMode", subCountyModeError)}
                        style={{
                          borderColor: subCountyModeError ? "#f43f5e" : activeField === "subCountyMode" ? "transparent" : palette.borderColor,
                          backgroundColor: palette.fieldBackground || palette.surfaceBackground,
                          color: palette.textColor,
                          "--trace-color": subCountyModeError ? "#f43f5e" : palette.primary,
                          "--trace-accent": palette.primarySoft,
                          "--trace-fill": palette.fieldBackground || palette.surfaceBackground
                        }}
                      >
                        <option value="">Choose an option</option>
                        <option value="all_sub_counties">I operate in all sub-counties and all wards in {entry.county}</option>
                        <option value="selected_sub_counties">I operate in specific sub-counties in {entry.county}</option>
                      </select>
                    </label>
                  </div>
                ) : (
                  <div
                    className="rounded-2xl border px-4 py-3 text-sm"
                    style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground, color: palette.mutedTextColor }}
                  >
                    No sub-counties were found for this county in the current dataset.
                  </div>
                )}
                {entry.subCountyMode === "selected_sub_counties" ? (
                  <MultiSelectDropdown
                    id={`sub-counties-${entry.id}`}
                    label="Select sub-counties"
                    options={availableSubCounties}
                    values={entry.selectedSubCounties}
                    onChange={(selectedSubCounties) => {
                      const selectedSet = new Set(selectedSubCounties);
                      const nextSelectedWards = Object.fromEntries(
                        Object.entries(entry.selectedWardsBySubCounty || {}).filter(([subCounty]) => selectedSet.has(subCounty))
                      );

                      updateEntry(entry.id, {
                        selectedSubCounties,
                        wardMode: selectedSubCounties.length ? "selected_wards" : "",
                        selectedWardsBySubCounty: nextSelectedWards
                      });
                    }}
                    helper="Choose one or more sub-counties within this county."
                    placeholder="Select sub-counties"
                    disabled={!entry.county}
                    error={selectedSubCountiesError ? errors.coverageMode || errors.coverageDetails : ""}
                    activeTrace={activeField === "subCounties"}
                    enableSelectAll
                    selectAllLabel={`Select all sub-counties in ${entry.county}`}
                    clearLabel="Clear sub-counties"
                    doneLabel="Done selecting sub-counties"
                  />
                ) : null}

                {entry.wardMode === "selected_wards" && activeSubCounties.length ? (
                  <div className="space-y-4">
                    {activeSubCounties.map((subCounty) => {
                      const selectedWards = entry.selectedWardsBySubCounty?.[subCounty] || [];

                      return (
                        <div
                          key={`${entry.id}-${subCounty}`}
                          className="rounded-[24px] border p-4"
                          style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                        >
                          <div className="mb-3">
                            <div className="text-sm font-semibold" style={{ color: palette.primaryDeep }}>
                              {subCounty}
                            </div>
                            <div className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>
                              Choose the wards you cover in this sub-county.
                            </div>
                          </div>
                          <MultiSelectDropdown
                            id={`wards-${entry.id}-${subCounty}`}
                            label={`Ward coverage for ${subCounty}`}
                            options={getWardOptions(entry.county, subCounty)}
                            values={selectedWards}
                            onChange={(wards) =>
                              updateEntry(entry.id, {
                                wardMode: "selected_wards",
                                selectedWardsBySubCounty: {
                                  ...(entry.selectedWardsBySubCounty || {}),
                                  [subCounty]: wards
                                }
                              })
                            }
                            helper="These wards are shown directly under the selected sub-county for faster entry."
                            placeholder="Select wards"
                            error={
                              wardSelectionError && !selectedWards.length
                                ? errors.coverageDetails || errors.coverageMode
                                : ""
                            }
                            activeTrace={activeField === `wards:${subCounty}`}
                            enableSelectAll
                            selectAllLabel={`Select all wards in ${subCounty}`}
                            clearLabel="Clear wards"
                            doneLabel="Done selecting wards"
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                {entry.subCountyMode === "all_sub_counties" || (entry.wardMode === "selected_wards" && !missingWardSelections.length) ? (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => focusElement("add-another-county")}
                      className="rounded-2xl px-4 py-2 text-sm font-semibold text-white"
                      style={{ backgroundColor: palette.primary }}
                    >
                      Proceed to next county or review
                    </button>
                  </div>
                ) : null}

                {isEntryComplete && formatCountyCoverageEntry(entry) ? (
                  <div
                    className="rounded-2xl border px-4 py-3 text-sm"
                    style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground, color: palette.textColor }}
                  >
                    <span className="font-semibold">Summary:</span> {formatCountyCoverageEntry(entry)}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        );
      })}

      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          id="add-another-county"
          type="button"
          onClick={addCounty}
          disabled={!canAddCounty}
          className="rounded-2xl border px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderColor: palette.borderColor, color: palette.textColor }}
        >
          Add another county
        </button>
      </div>

      {buildCoverageSummary(completeEntries) ? (
        <div className="rounded-2xl p-4 text-sm" style={{ backgroundColor: palette.accent, color: palette.primaryDeep }}>
          Coverage summary: {buildCoverageSummary(completeEntries)}
        </div>
      ) : null}
    </div>
  );
};

export default CountyCoverageSelector;
