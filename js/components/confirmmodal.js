/**
 * Confirm (Yes/No) modal component.
 * Displays a message and two buttons; invokes a callback on confirmation.
 * Uses modal.js for open/close.
 * No game logic — that is passed in via the onConfirm callback.
 */

/**
 * Callback to invoke when the user clicks Yes.
 * @type {Function|null}
 */
let confirmCallback = null;

/**
 * Returns the confirm modal DOM element.
 * @returns {HTMLElement|null}
 */
const getConfirmModalEl = () => document.getElementById("confirm-modal");

/**
 * Gets all interactive confirm modal DOM elements.
 * @returns {Object|null} Element map or null when unavailable
 */
const getConfirmModalElements = () => {
  const modal = getConfirmModalEl();
  const message = document.getElementById("confirm-modal-message");
  const yesBtn = document.getElementById("confirm-yes-btn");
  const noBtn = document.getElementById("confirm-no-btn");
  if (!modal || !message || !yesBtn || !noBtn) {
    return null;
  }
  return { modal, message, yesBtn, noBtn };
};

/**
 * Opens the confirm modal with a message and stores the confirm callback.
 * @param {string} message - Message to display to the user
 * @param {Function} onConfirm - Invoked when the user clicks Yes
 */
const openConfirmModal = (message, onConfirm) => {
  const elements = getConfirmModalElements();
  if (!elements) {
    return;
  }
  confirmCallback = onConfirm;
  elements.message.textContent = message;
  openModal(elements.modal);
  elements.yesBtn.focus();
};

/**
 * Closes the confirm modal and clears the pending callback.
 */
const closeConfirmModal = () => {
  const modal = getConfirmModalEl();
  closeModal(modal);
  confirmCallback = null;
};

/**
 * Handles Yes button click — invokes the confirm callback then closes.
 */
const onConfirmYesClick = () => {
  const callback = confirmCallback;
  closeConfirmModal();
  if (!callback) {
    return;
  }
  callback();
};

/**
 * Handles No button click — closes the modal without acting.
 */
const onConfirmNoClick = () => {
  closeConfirmModal();
};

/**
 * Handles keyboard controls while the confirm modal is open.
 * Escape → No; Enter → Yes.
 * @param {Event} event - Keydown event
 */
const onConfirmModalKeydown = (event) => {
  const modal = getConfirmModalEl();
  if (!isModalOpen(modal)) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    closeConfirmModal();
    return;
  }

  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  onConfirmYesClick();
};
