/**
 * Theme management module.
 * Handles switching between available themes and persisting user preference.
 */

const THEME_STORAGE_KEY = "sudoku-theme";

/**
 * Gets the currently active theme name.
 * @returns {string} Current theme name
 */
const getActiveTheme = () => {
  const linkEl = document.querySelector("link[data-theme-link]");
  if (!linkEl) {
    return DEFAULT_THEME;
  }
  const href = linkEl.getAttribute("href");
  const match = href.match(/themes\/(.+?)\.css/);
  return match ? match[1] : DEFAULT_THEME;
};

/**
 * Gets the user's saved theme preference from localStorage.
 * @returns {string} Saved theme name or default theme
 */
const getSavedTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && AVAILABLE_THEMES.includes(saved)) {
      return saved;
    }
  } catch (e) {
    // localStorage may not be available in some environments
  }
  return DEFAULT_THEME;
};

/**
 * Saves the theme preference to localStorage.
 * @param {string} themeName - Theme to save
 */
const saveTheme = (themeName) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeName);
  } catch (e) {
    // localStorage may not be available in some environments
  }
};

/**
 * Applies a theme by swapping the stylesheet link.
 * @param {string} themeName - Theme name to apply
 */
const applyTheme = (themeName) => {
  if (!AVAILABLE_THEMES.includes(themeName)) {
    return;
  }

  // Remove old theme link
  const oldLink = document.querySelector("link[data-theme-link]");
  if (oldLink) {
    oldLink.remove();
  }

  // Create and append new theme link
  const newLink = document.createElement("link");
  newLink.rel = "stylesheet";
  newLink.href = `style/themes/${themeName}.css`;
  newLink.setAttribute("data-theme-link", "true");
  document.head.appendChild(newLink);

  saveTheme(themeName);
};

/**
 * Initializes the theme system by loading the saved theme.
 */
const initTheme = () => {
  const savedTheme = getSavedTheme();
  applyTheme(savedTheme);
};
