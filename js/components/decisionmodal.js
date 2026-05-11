/**
 * Decision modal component.
 * Generic multi-action modal supporting 2, 3, or N buttons.
 * Each button is a {label, callback} pair; callback is invoked on click.
 * Uses modal.js for open/close and focus management.
 * No game logic — actions and callbacks are passed by the caller.
 */

/**
 * Array of {label, callback} button configs for the current decision.
 * @type {Array<{label: string, callback: Function|null}>}
 */
let decisionButtons = [];

/**
 * Returns the decision modal DOM element.
 * @returns {HTMLElement|null}
 */
const getDecisionModalEl = () => document.getElementById("decision-modal");

/**
 * Gets all interactive decision modal DOM elements.
 * @returns {Object|null} Element map or null when unavailable
 */
const getDecisionModalElements = () => {
  const modal = getDecisionModalEl();
  const message = document.getElementById("decision-modal-message");
  const actions = document.getElementById("decision-modal-actions");
  if (!modal || !message || !actions) {
    return null;
  }
  return { modal, message, actions };
};

/**
 * Opens the decision modal with a message and button configurations.
 * Clears any previous buttons and renders new ones from the buttons array.
 * @param {string} message - Message to display to the user
 * @param {Array<{label: string, callback: Function|null}>} buttons - Button configs
 */
const openDecisionModal = (message, buttons) => {
  const elements = getDecisionModalElements();
  if (!elements || !buttons || buttons.length === 0) {
    return;
  }
  decisionButtons = buttons;
  elements.message.textContent = message;

  // Clear existing buttons
  elements.actions.innerHTML = "";

  // Render buttons
  buttons.forEach((button, index) => {
    const btn = document.createElement("button");
    btn.className = "action-btn";
    btn.type = "button";
    btn.textContent = button.label;
    btn.id = `decision-btn-${index}`;
    btn.addEventListener("click", () => onDecisionButtonClick(index));
    elements.actions.appendChild(btn);
  });

  openModal(elements.modal);
  // Focus first button
  const firstBtn = elements.actions.querySelector("button");
  if (firstBtn) {
    firstBtn.focus();
  }
};

/**
 * Closes the decision modal and clears stored buttons.
 */
const closeDecisionModal = () => {
  const modal = getDecisionModalEl();
  closeModal(modal);
  decisionButtons = [];
};

/**
 * Handles decision button click — invokes callback and closes modal.
 * @param {number} index - Index of the button that was clicked
 */
const onDecisionButtonClick = (index) => {
  const button = decisionButtons[index];
  if (!button) {
    return;
  }
  const callback = button.callback;
  closeDecisionModal();
  if (!callback) {
    return;
  }
  callback();
};

/**
 * Handles keyboard controls while the decision modal is open.
 * Escape → first button (if callback is null, acts as cancel); Enter → first button.
 * @param {Event} event - Keydown event
 */
const onDecisionModalKeydown = (event) => {
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
  onDecisionButtonClick(0);
};
