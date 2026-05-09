/**
 * Options modal component.
 * Owns state and event handlers for the settings/options panel.
 * Uses modal.js for open/close.
 * Currently exposes theme selection and highlight mode; other settings can be added here over time.
 */

/**
 * Dependency container for options modal handlers.
 * @type {Object|null}
 */
let optionsModalDeps = null;

/**
 * Registers dependencies used by options modal handlers.
 * @param {Object} deps - Dependency functions from app orchestration
 * @param {Function} deps.applyTheme - Applies the named theme to the page
 * @param {Function} deps.getHighlightMode - Returns the current highlight mode
 * @param {Function} deps.applyHighlightMode - Applies the highlight mode
 */
const configureOptionsModal = (deps) => {
  optionsModalDeps = deps;
};

/**
 * Returns the options modal root element.
 * @returns {HTMLElement|null}
 */
const getOptionsModalEl = () => document.getElementById('options-modal');

/**
 * Opens the options modal and syncs controls to the current active theme and highlight mode.
 */
const openOptionsModal = () => {
  const modal = getOptionsModalEl();
  if (!modal) {
    return;
  }

  const themeSelect = document.getElementById('options-theme-select');
  if (themeSelect) {
    themeSelect.value = getActiveTheme();
  }

  const highlightSelect = document.getElementById('options-highlight-select');
  if (
    highlightSelect &&
    optionsModalDeps &&
    optionsModalDeps.getHighlightMode
  ) {
    highlightSelect.value = optionsModalDeps.getHighlightMode();
  }

  openModal(modal);

  if (themeSelect) {
    themeSelect.focus();
  }
};

/**
 * Closes the options modal.
 */
const closeOptionsModal = () => {
  closeModal(getOptionsModalEl());
};

/**
 * Handles the Options button click — opens the modal.
 */
const onOptionsClick = () => {
  openOptionsModal();
};

/**
 * Handles theme selector change inside the options modal.
 * @param {Event} event - Change event from the select element
 */
const onOptionsThemeChange = (event) => {
  if (!optionsModalDeps) {
    return;
  }
  optionsModalDeps.applyTheme(event.target.value);
};

/**
 * Handles highlight mode selector change inside the options modal.
 * @param {Event} event - Change event from the select element
 */
const onOptionsHighlightModeChange = (event) => {
  if (!optionsModalDeps || !optionsModalDeps.applyHighlightMode) {
    return;
  }
  optionsModalDeps.applyHighlightMode(event.target.value);
};

/**
 * Handles the Close button — closes the modal.
 */
const onOptionsCloseClick = () => {
  closeOptionsModal();
};

/**
 * Handles keyboard controls while the options modal is open.
 * Escape closes the modal.
 * @param {Event} event - Keydown event
 */
const onOptionsModalKeydown = (event) => {
  if (!isModalOpen(getOptionsModalEl())) {
    return;
  }

  if (event.key !== 'Escape') {
    return;
  }

  event.preventDefault();
  closeOptionsModal();
};
