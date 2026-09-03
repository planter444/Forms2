import {
  defaultLocationHierarchy,
  normalizeLocationHierarchy
} from "./locationHierarchyText.js";

const compareText = (left, right) => `${left}`.localeCompare(`${right}`);
const normalizeLabel = (value) =>
  `${value || ""}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

let locationHierarchy = defaultLocationHierarchy;

const getCountyKeyMap = () =>
  Object.fromEntries(Object.keys(locationHierarchy).map((key) => [normalizeLabel(key), key]));

const getCountyKey = (county) => getCountyKeyMap()[normalizeLabel(county)] || county;

const createId = () =>
  globalThis.crypto?.randomUUID?.() || `county-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const setLocationHierarchy = (nextHierarchy) => {
  const normalizedHierarchy = normalizeLocationHierarchy(nextHierarchy);
  locationHierarchy = Object.keys(normalizedHierarchy).length ? normalizedHierarchy : defaultLocationHierarchy;
};

export const getLocationHierarchy = () => locationHierarchy;

export const getCountyOptions = () => Object.keys(locationHierarchy).sort(compareText);

export const getSubCountyOptions = (county) =>
  Object.keys(locationHierarchy[getCountyKey(county)] || {}).sort(compareText);

export const getWardOptions = (county, subCounty) =>
  [...new Set(locationHierarchy[getCountyKey(county)]?.[subCounty] || [])].sort(compareText);

export const createCountyCoverageEntry = (county = "") => ({
  id: createId(),
  county,
  subCountyMode: "",
  wardMode: "",
  selectedSubCounties: [],
  selectedWardsBySubCounty: {}
});

export const hasCountyCoverageEntryStarted = (entry) =>
  Boolean(
    entry?.county ||
      entry?.subCountyMode ||
      entry?.selectedSubCounties?.length ||
      entry?.wardMode ||
      Object.keys(entry?.selectedWardsBySubCounty || {}).length
  );

export const getEntrySubCounties = (entry) => {
  if (!entry?.county) {
    return [];
  }

  const availableSubCounties = getSubCountyOptions(entry.county);

  if (entry.subCountyMode === "all_sub_counties") {
    return availableSubCounties;
  }

  return availableSubCounties.filter((subCounty) => entry.selectedSubCounties.includes(subCounty));
};

export const isCountyCoverageEntryComplete = (entry) => {
  if (!entry?.county || !entry.subCountyMode) {
    return false;
  }

  const availableSubCounties = getSubCountyOptions(entry.county);

  if (availableSubCounties.length === 0) {
    return false;
  }

  if (entry.subCountyMode === "all_sub_counties") {
    return true;
  }

  const activeSubCounties = getEntrySubCounties(entry);

  if (!activeSubCounties.length || !entry.wardMode) {
    return false;
  }

  if (entry.wardMode !== "selected_wards") {
    return true;
  }

  return activeSubCounties.every((subCounty) => (entry.selectedWardsBySubCounty?.[subCounty] || []).length > 0);
};

export const formatCountyCoverageEntry = (entry) => {
  if (!entry?.county) {
    return "";
  }

  const activeSubCounties = getEntrySubCounties(entry);

  if (!activeSubCounties.length) {
    return entry.county;
  }

  if (entry.subCountyMode === "all_sub_counties") {
    return `${entry.county}: all sub-counties, all wards`;
  }

  if (entry.wardMode === "all_wards") {
    return `${entry.county}: ${activeSubCounties.join(", ")} (all wards)`;
  }

  return `${entry.county}: ${activeSubCounties
    .map((subCounty) => {
      const wards = entry.selectedWardsBySubCounty?.[subCounty] || [];
      return wards.length ? `${subCounty} (${wards.join(", ")})` : subCounty;
    })
    .join("; ")}`;
};

export const buildCoverageSummary = (entries) =>
  entries
    .map((entry) => formatCountyCoverageEntry(entry))
    .filter(Boolean)
    .join(" | ");

export const deriveCoverageMode = (entries) => {
  const completeEntries = entries.filter((entry) => isCountyCoverageEntryComplete(entry));

  if (completeEntries.length === 1) {
    const [entry] = completeEntries;

    if (entry.subCountyMode === "all_sub_counties") {
      return "all_wards_in_county";
    }
  }

  return completeEntries.length > 1 ? "multiple_counties" : "specific_areas";
};
