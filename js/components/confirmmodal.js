/**
 * Confirm (Yes/No) modal component.
 * Specialization of decisionModal that displays Yes/No buttons.
 * Invokes a callback on Yes; No closes without acting.
 * Delegates to decisionModal.js for implementation.
 * No game logic — that is passed in via the onConfirm callback.
 */

/**
 * Opens the confirm modal with a message and callback.
 * Internally uses decision modal with No={label, callback:null} and Yes={label, callback:onConfirm}.
 * @param {string} message - Message to display to the user
 * @param {Function} onConfirm - Invoked when the user clicks Yes
 */
const openConfirmModal = (message, onConfirm) => {
  const buttons = [
    { label: "No", callback: null },
    { label: "Yes", callback: onConfirm },
  ];
  openDecisionModal(message, buttons);
};

/**
 * Closes the confirm modal.
 * Delegates to decisionModal.
 */
const closeConfirmModal = () => {
  closeDecisionModal();
};

/**
 * Handles Yes button click.
 * Delegates to decisionModal — button at index 1.
 */
const onConfirmYesClick = () => {
  onDecisionButtonClick(1);
};

/**
 * Handles No button click.
 * Delegates to decisionModal — button at index 0.
 */
const onConfirmNoClick = () => {
  onDecisionButtonClick(0);
};

/**
 * Handles keyboard controls while the confirm modal is open.
 * Escape → No (button 0); Enter → Yes (button 1).
 * Delegates to decisionModal keyboard handler.
 * @param {Event} event - Keydown event
 */
const onConfirmModalKeydown = (event) => {
  const modal = getDecisionModalEl();
  if (!isModalOpen(modal)) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    onDecisionButtonClick(0);
    return;
  }

  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  onDecisionButtonClick(1);
};
