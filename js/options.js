/**
 * User options management.
 * All options are stored in localStorage under sudoku-options.
 * All functions are pure and testable.
 */

const OPTIONS_STORAGE_KEY = 'sudoku-options';

/**
 * Creates default options object.
 * @returns {Object} Default options
 */
const createDefaultOptions = () => ({
  highlightMode: 'related-box',
  theme: 'default',
  autoCheck: false,
});

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
      return { ...defaults, ...parsed };
    }
  } catch (e) {
    // localStorage may not be available or JSON is invalid; fall back to defaults
  }
  return createDefaultOptions();
};

/**
 * Saves options to localStorage.
 * @param {Object} options - Options to save
 */
const saveOptions = (options) => {
  try {
    localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(options));
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
