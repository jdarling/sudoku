/**
 * User options management.
 * All options are stored in localStorage under sudoku-options.
 * All functions are pure and testable.
 */

const OPTIONS_STORAGE_KEY = "sudoku-options";

/**
 * Deduplicates and validates feature strings against known feature keys.
 * @param {string[]} features - Candidate features
 * @returns {string[]} Valid feature list
 */
const normalizeHighlightFeatures = (features) => {
  if (!Array.isArray(features)) {
    return [];
  }
  const unique = new Set();
  for (const feature of features) {
    if (HIGHLIGHT_FEATURES.includes(feature)) {
      unique.add(feature);
    }
  }
  return [...unique];
};

/**
 * Converts a legacy highlight mode string into feature list.
 * @param {string} mode - Legacy mode string
 * @returns {string[]} Feature list for mode
 */
const mapModeToFeatures = (mode) => {
  if (typeof mode !== "string") {
    return [];
  }
  return [...getStyleConfigFeatures(mode)];
};

/**
 * Creates default options object.
 * @returns {Object} Default options
 */
const createDefaultOptions = () => ({
  highlightFeatures: [...getStyleConfigFeatures("related-block")],
  theme: "default",
  autoCheck: false,
  showStatsOnSolved: true,
});

/**
 * Sanitizes options to supported persisted keys and valid value types only.
 * Drops legacy/unknown fields.
 * @param {Object} options - Candidate options object
 * @returns {Object} Sanitized options object
 */
const sanitizeOptions = (options) => {
  const defaults = createDefaultOptions();
  const source =
    options && typeof options === "object" ? options : createDefaultOptions();

  const highlightFeatures = normalizeHighlightFeatures(
    source.highlightFeatures,
  );
  const resolvedFeatures =
    highlightFeatures.length > 0 || source.highlightFeatures
      ? highlightFeatures
      : [...defaults.highlightFeatures];

  const theme =
    typeof source.theme === "string" && AVAILABLE_THEMES.includes(source.theme)
      ? source.theme
      : defaults.theme;

  const autoCheck =
    typeof source.autoCheck === "boolean"
      ? source.autoCheck
      : defaults.autoCheck;

  const showStatsOnSolved =
    typeof source.showStatsOnSolved === "boolean"
      ? source.showStatsOnSolved
      : defaults.showStatsOnSolved;

  return {
    highlightFeatures: resolvedFeatures,
    theme,
    autoCheck,
    showStatsOnSolved,
  };
};

/**
 * Formats elapsed time from two ISO timestamps as minutes/seconds.
 * @param {string} startedAtIso - Start timestamp (ISO)
 * @param {string} completedAtIso - Completion timestamp (ISO)
 * @returns {string} Human-readable duration string
 */
const formatElapsedTime = (startedAtIso, completedAtIso) => {
  const startedAtMs = Date.parse(startedAtIso || "");
  const completedAtMs = Date.parse(completedAtIso || "");
  if (Number.isNaN(startedAtMs) || Number.isNaN(completedAtMs)) {
    return "0 minutes 0 seconds";
  }

  const diffMs = Math.max(0, completedAtMs - startedAtMs);
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const minuteLabel = minutes === 1 ? "minute" : "minutes";
  const secondLabel = seconds === 1 ? "second" : "seconds";
  return `${minutes} ${minuteLabel} ${seconds} ${secondLabel}`;
};

/**
 * Creates a display-friendly metrics object from scorecard values.
 * @param {Object} scorecard - Completed scorecard object
 * @returns {Object} Metrics object prepared for UI display
 */
const createMetricsDisplay = (scorecard) => {
  const source =
    scorecard && typeof scorecard === "object" ? scorecard : Object.create(null);

  const supportOptions = Array.isArray(source.supportOptionsUsed)
    ? source.supportOptionsUsed
    : [];

  return {
    puzzleId: source.puzzleId || "unknown",
    elapsedTime: formatElapsedTime(source.startedAt || "", source.completedAt || ""),
    moveCount: source.moveCount || 0,
    checkClickCount: source.checkClickCount || 0,
    hintClickCount: source.hintClickCount || 0,
    immediateErrorShownCount: source.immediateErrorShownCount || 0,
    errorCellShownCount: source.errorCellShownCount || 0,
    errorShownCount: source.errorShownCount || 0,
    supportOptionsUsed: supportOptions.length > 0 ? [...supportOptions] : ["None"],
    startedAt: source.startedAt || "",
    completedAt: source.completedAt || "",
  };
};

/**
 * Loads options from localStorage, falling back to defaults if missing or invalid.
 * @returns {Object} Options object with all required keys
 */
const loadOptions = () => {
  try {
    const stored = localStorage.getItem(OPTIONS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const defaults = createDefaultOptions();
      const merged = { ...defaults, ...parsed };
      const fromFeatures = normalizeHighlightFeatures(parsed.highlightFeatures);

      if (fromFeatures.length > 0 || parsed.highlightFeatures) {
        return sanitizeOptions({ ...merged, highlightFeatures: fromFeatures });
      }

      const migratedFeatures = mapModeToFeatures(parsed.highlightMode);
      if (migratedFeatures.length > 0) {
        return sanitizeOptions({
          ...merged,
          highlightFeatures: migratedFeatures,
        });
      }

      return sanitizeOptions(merged);
    }
  } catch (e) {
    // localStorage may not be available or JSON is invalid; fall back to defaults
  }
  return createDefaultOptions();
};

/**
 * Saves options to localStorage.
 * @param {Object} options - Options to save
 * @returns {void}
 */
const saveOptions = (options) => {
  try {
    localStorage.setItem(
      OPTIONS_STORAGE_KEY,
      JSON.stringify(sanitizeOptions(options)),
    );
  } catch (e) {
    // localStorage may not be available in some environments
  }
};

/**
 * Creates a new options object with one key updated.
 * @param {Object} options - Current options
 * @param {string} key - Option key to update
 * @param {*} value - New value
 * @returns {Object} New options object
 */
const updateOption = (options, key, value) => {
  return {
    ...options,
    [key]: value,
  };
};
