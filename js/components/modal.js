/**
 * Generic modal component.
 * Handles open, close, and visibility queries for any aria-based modal element.
 * No state, no event handling — those belong to the caller.
 */

/**
 * Opens a modal element by clearing its aria-hidden attribute.
 * @param {HTMLElement} modalEl - The modal root element
 */
const openModal = (modalEl) => {
  if (!modalEl) {
    return;
  }
  modalEl.setAttribute('aria-hidden', 'false');
};

/**
 * Closes a modal element by setting aria-hidden to true.
 * @param {HTMLElement} modalEl - The modal root element
 */
const closeModal = (modalEl) => {
  if (!modalEl) {
    return;
  }
  modalEl.setAttribute('aria-hidden', 'true');
};

/**
 * Returns whether a modal element is currently visible.
 * @param {HTMLElement} modalEl - The modal root element
 * @returns {boolean} True if the modal is open
 */
const isModalOpen = (modalEl) => {
  if (!modalEl) {
    return false;
  }
  return modalEl.getAttribute('aria-hidden') !== 'true';
};
