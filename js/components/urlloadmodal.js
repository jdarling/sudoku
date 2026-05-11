/**
 * Load URL modal component.
 * Owns all state, rendering, and event handlers for the URL puzzle-load dialog.
 * Uses modal.js for open/close. No game logic, no URL manipulation.
 */

/**
 * Dependency container for URL load modal handlers.
 * @type {Object|null}
 */
let urlLoadModalDeps = null;

/**
 * Registers dependencies used by URL load modal handlers.
 * @param {Object} deps - Dependency functions from app orchestration
 * @param {Function} deps.loadPuzzleFromUrl - Loads a puzzle from a URL string
 */
const configureUrlLoadModal = (deps) => {
  urlLoadModalDeps = deps;
};

/**
 * Returns the URL load modal DOM element.
 * @returns {HTMLElement|null}
 */
const getUrlLoadModalEl = () => document.getElementById("url-load-modal");

/**
 * Gets all interactive URL load modal DOM elements.
 * @returns {Object|null} Element map or null when unavailable
 */
const getUrlLoadModalElements = () => {
  const modal = getUrlLoadModalEl();
  const urlInput = document.getElementById("url-load-input");
  const error = document.getElementById("url-load-error");
  const loadBtn = document.getElementById("url-load-confirm-btn");
  const cancelBtn = document.getElementById("url-load-cancel-btn");
  if (!modal || !urlInput || !error || !loadBtn || !cancelBtn) {
    return null;
  }
  return { modal, urlInput, error, loadBtn, cancelBtn };
};

/**
 * Opens the URL load modal and resets its input state.
 */
const openUrlLoadModal = () => {
  const elements = getUrlLoadModalElements();
  if (!elements) {
    return;
  }
  elements.urlInput.value = "";
  elements.error.textContent = "";
  elements.loadBtn.disabled = true;
  openModal(elements.modal);
  elements.urlInput.focus();
};

/**
 * Closes the URL load modal.
 */
const closeUrlLoadModal = () => {
  const modal = getUrlLoadModalEl();
  closeModal(modal);
};

/**
 * Validates URL input and updates button state and inline error.
 * @param {Event} event - Input event
 */
const onUrlLoadInput = (event) => {
  const elements = getUrlLoadModalElements();
  if (!elements) {
    return;
  }
  const validationError = validatePuzzleUrl(event.target.value);
  elements.error.textContent = validationError || "";
  elements.loadBtn.disabled = validationError !== null;
};

/**
 * Handles the Load button — fetches and loads the YAML from the entered URL.
 */
const onUrlLoadConfirmClick = async () => {
  const elements = getUrlLoadModalElements();
  if (!elements || !urlLoadModalDeps) {
    return;
  }
  const url = elements.urlInput.value.trim();
  const validationError = validatePuzzleUrl(url);
  if (validationError) {
    elements.error.textContent = validationError;
    elements.loadBtn.disabled = true;
    return;
  }

  elements.loadBtn.disabled = true;
  elements.error.textContent = "";

  try {
    await urlLoadModalDeps.loadPuzzleFromUrl(url);
    closeUrlLoadModal();
    window.scrollTo(0, 0);
  } catch (error) {
    elements.error.textContent = error.message;
    elements.loadBtn.disabled = false;
  }
};

/**
 * Handles the Cancel button — closes the modal without any state changes.
 */
const onUrlLoadCancelClick = () => {
  closeUrlLoadModal();
};

/**
 * Handles keyboard controls while the URL load modal is open.
 * Escape closes; Enter on non-input triggers load.
 * @param {Event} event - Keydown event
 */
const onUrlLoadModalKeydown = (event) => {
  const modal = getUrlLoadModalEl();
  if (!isModalOpen(modal)) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    closeUrlLoadModal();
    return;
  }

  if (event.key !== "Enter") {
    return;
  }

  const activeTag = document.activeElement
    ? document.activeElement.tagName
    : "";
  if (activeTag === "INPUT") {
    return;
  }

  event.preventDefault();
  onUrlLoadConfirmClick();
};
