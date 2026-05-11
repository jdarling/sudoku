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
 * @param {Function} deps.getHighlightFeatures - Returns the current highlight features
 * @param {Function} deps.applyHighlightFeatures - Applies highlight feature list
 * @param {Function} deps.applyHighlightPreset - Applies highlight preset by name
 * @returns {void}
 */
const initOptionsModal = (deps) => {
  optionsModalDeps = deps;
  renderPresetButtons();
};

/**
 * Returns all available highlight preset keys.
 * @returns {string[]} Preset keys from style config
 */
const getPresetKeys = () => {
  return Object.keys(STYLE_CONFIGS);
};

/**
 * Renders preset buttons from STYLE_CONFIGS keys.
 * @returns {void}
 */
const renderPresetButtons = () => {
  const container = document.getElementById("options-highlight-presets");
  if (!container) {
    return;
  }

  const presets = getPresetKeys();
  container.innerHTML = "";
  for (const preset of presets) {
    const button = document.createElement("button");
    button.className = "action-btn";
    button.type = "button";
    button.dataset.preset = preset;
    button.textContent = preset;
    container.appendChild(button);
  }
};

/**
 * Returns all feature checkbox inputs in options modal.
 * @returns {HTMLInputElement[]} Feature checkbox nodes
 */
const getFeatureCheckboxes = () => {
  const nodes = document.querySelectorAll(
    '#options-highlight-features input[type="checkbox"]',
  );
  return [...nodes];
};

/**
 * Syncs checkboxes to current feature list.
 * @param {string[]} features - Active features
 * @returns {void}
 */
const syncFeatureCheckboxes = (features) => {
  const featureSet = new Set(Array.isArray(features) ? features : []);
  const checkboxes = getFeatureCheckboxes();
  for (const checkbox of checkboxes) {
    checkbox.checked = featureSet.has(checkbox.value);
  }
};

/**
 * Reads selected features from current checkbox states.
 * @returns {string[]} Selected feature list
 */
const readFeaturesFromCheckboxes = () => {
  const selected = [];
  const checkboxes = getFeatureCheckboxes();
  for (const checkbox of checkboxes) {
    if (checkbox.checked) {
      selected.push(checkbox.value);
    }
  }
  return selected;
};

/**
 * Returns the options modal root element.
 * @returns {HTMLElement|null}
 */
const getOptionsModalEl = () => document.getElementById("options-modal");

/**
 * Opens the options modal and syncs controls to the current active theme and highlight features.
 * @returns {void}
 */
const openOptionsModal = () => {
  const modal = getOptionsModalEl();
  if (!modal) {
    return;
  }

  const themeSelect = document.getElementById("options-theme-select");
  if (themeSelect) {
    themeSelect.value = getActiveTheme();
  }

  if (optionsModalDeps && optionsModalDeps.getHighlightFeatures) {
    syncFeatureCheckboxes(optionsModalDeps.getHighlightFeatures());
  }

  openModal(modal);

  if (themeSelect) {
    themeSelect.focus();
  }
};

/**
 * Closes the options modal.
 * @returns {void}
 */
const closeOptionsModal = () => {
  closeModal(getOptionsModalEl());
};

/**
 * Handles the Options button click — opens the modal.
 * @returns {void}
 */
const onOptionsClick = () => {
  openOptionsModal();
};

/**
 * Handles theme selector change inside the options modal.
 * @param {Event} event - Change event from the select element
 * @returns {void}
 */
const onOptionsThemeChange = (event) => {
  if (!optionsModalDeps) {
    return;
  }
  optionsModalDeps.applyTheme(event.target.value);
};

/**
 * Handles feature checkbox changes inside the options modal.
 * @param {Event} event - Change event from a checkbox
 * @returns {void}
 */
const onOptionsHighlightFeatureChange = (event) => {
  if (!event.target || event.target.type !== "checkbox") {
    return;
  }
  if (!optionsModalDeps || !optionsModalDeps.applyHighlightFeatures) {
    return;
  }
  optionsModalDeps.applyHighlightFeatures(readFeaturesFromCheckboxes());
};

/**
 * Applies a preset mode and updates checkbox states.
 * @param {string} preset - Preset key
 * @returns {void}
 */
const applyPreset = (preset) => {
  if (!optionsModalDeps || !optionsModalDeps.applyHighlightPreset) {
    return;
  }
  const features = optionsModalDeps.applyHighlightPreset(preset);
  syncFeatureCheckboxes(features);
};

/**
 * Handles click on preset buttons.
 * @param {Event} event - Click event from options modal
 * @returns {void}
 */
const onOptionsPresetButtonClick = (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  if (!target.dataset.preset) {
    return;
  }
  applyPreset(target.dataset.preset);
};

/**
 * Handles the Close button — closes the modal.
 * @returns {void}
 */
const onOptionsCloseClick = () => {
  closeOptionsModal();
};

/**
 * Handles keyboard controls while the options modal is open.
 * Escape closes the modal.
 * @param {Event} event - Keydown event
 * @returns {void}
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
