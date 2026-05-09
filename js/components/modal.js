/**
 * Generic modal component.
 * Handles open, close, and visibility queries for any aria-based modal element.
 * Automatically records the focused element on open and restores it on close.
 * No state, no event handling — those belong to the caller.
 */

/**
 * Maps each modal element to the element that was focused when it opened.
 * @type {WeakMap<HTMLElement, HTMLElement|null>}
 */
const modalTriggerMap = new WeakMap();

/**
 * Opens a modal element by clearing its aria-hidden attribute.
 * Records the currently focused element so focus can be restored on close.
 * @param {HTMLElement} modalEl - The modal root element
 */
const openModal = (modalEl) => {
  if (!modalEl) {
    return;
  }
  modalTriggerMap.set(modalEl, document.activeElement || null);
  modalEl.setAttribute("aria-hidden", "false");
};

/**
 * Closes a modal element by setting aria-hidden to true.
 * Returns focus to the element that was focused when the modal opened.
 * @param {HTMLElement} modalEl - The modal root element
 */
const closeModal = (modalEl) => {
  if (!modalEl) {
    return;
  }
  modalEl.setAttribute("aria-hidden", "true");
  const trigger = modalTriggerMap.get(modalEl);
  if (trigger && trigger.focus) {
    trigger.focus();
  }
  modalTriggerMap.delete(modalEl);
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
  return modalEl.getAttribute("aria-hidden") !== "true";
};
