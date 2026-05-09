/**
 * User settings management.
 * All settings are stored in localStorage under sudoku-settings.
 * All functions are pure and testable.
 */

const SETTINGS_STORAGE_KEY = 'sudoku-settings';

/**
 * Creates default settings object.
 * @returns {Object} Default settings
 */
const createDefaultSettings = () => ({
  highlightMode: 'related-box',
  theme: 'default',
  autoCheck: false,
});

/**
 * Loads settings from localStorage, falling back to defaults if missing or invalid.
 * @returns {Object} Settings object with all required keys
 */
const loadSettings = () => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const defaults = createDefaultSettings();
      return { ...defaults, ...parsed };
    }
  } catch (e) {
    // localStorage may not be available or JSON is invalid; fall back to defaults
  }
  return createDefaultSettings();
};

/**
 * Saves settings to localStorage.
 * @param {Object} settings - Settings to save
 */
const saveSettings = (settings) => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    // localStorage may not be available in some environments
  }
};

/**
 * Creates a new settings object with one key updated.
 * @param {Object} settings - Current settings
 * @param {string} key - Setting key to update
 * @param {*} value - New value
 * @returns {Object} New settings object
 */
const updateSetting = (settings, key, value) => {
  return {
    ...settings,
    [key]: value,
  };
};
