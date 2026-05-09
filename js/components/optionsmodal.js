/**
 * Options modal component.
 * Owns state and event handlers for the settings/options panel.
 * Uses modal.js for open/close.
 * Currently exposes theme selection; other settings can be added here over time.
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
 */
const configureOptionsModal = (deps) => {
  optionsModalDeps = deps;
};

/**
 * Returns the options modal root element.
 * @returns {HTMLElement|null}
 */
const getOptionsModalEl = () => document.getElementById("options-modal");

/**
 * Opens the options modal and syncs controls to the current active theme.
 */
const openOptionsModal = () => {
  const modal = getOptionsModalEl();
  if (!modal) {
    return;
  }

  const select = document.getElementById("options-theme-select");
  if (select) {
    select.value = getActiveTheme();
  }

  openModal(modal);

  if (select) {
    select.focus();
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

  if (event.key !== "Escape") {
    return;
  }

  event.preventDefault();
  closeOptionsModal();
};
