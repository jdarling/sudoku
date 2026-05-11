/**
 * Board entry modal component.
 * Owns all state, rendering, and event handlers for the manual board-entry dialog.
 * Uses modal.js for open/close. No game logic, no URL manipulation.
 */

/**
 * Dependency container for board entry modal handlers.
 * @type {Object|null}
 */
let boardEntryModalDeps = null;

/**
 * Registers dependencies used by board entry modal handlers.
 * @param {Object} deps - Dependency functions from app orchestration
 * @param {Function} deps.loadPuzzleFromBoard - Loads a puzzle from an 81-char board string
 */
const configureBoardEntryModal = (deps) => {
  boardEntryModalDeps = deps;
};

/**
 * Returns the board entry modal DOM element.
 * @returns {HTMLElement|null}
 */
const getBoardEntryModalEl = () => document.getElementById("board-entry-modal");

/**
 * Gets all interactive board entry modal DOM elements.
 * @returns {Object|null} Element map or null when unavailable
 */
const getBoardEntryModalElements = () => {
  const modal = getBoardEntryModalEl();
  const textarea = document.getElementById("board-entry-input");
  const error = document.getElementById("board-entry-error");
  const loadBtn = document.getElementById("board-entry-confirm-btn");
  const cancelBtn = document.getElementById("board-entry-cancel-btn");
  if (!modal || !textarea || !error || !loadBtn || !cancelBtn) {
    return null;
  }
  return { modal, textarea, error, loadBtn, cancelBtn };
};

/**
 * Opens the board entry modal and resets its input state.
 */
const openBoardEntryModal = () => {
  const elements = getBoardEntryModalElements();
  if (!elements) {
    return;
  }
  elements.textarea.value = "";
  elements.error.textContent = "";
  elements.loadBtn.disabled = true;
  openModal(elements.modal);
  elements.textarea.focus();
};

/**
 * Closes the board entry modal.
 */
const closeBoardEntryModal = () => {
  const modal = getBoardEntryModalEl();
  closeModal(modal);
};

/**
 * Validates board input and updates button state and inline error.
 * @param {Event} event - Input event from textarea
 */
const onBoardEntryInput = (event) => {
  const elements = getBoardEntryModalElements();
  if (!elements) {
    return;
  }
  const raw = event.target.value;
  const parsed = parseBoardInput(raw);
  if (!parsed) {
    const cellCount = raw.replace(/\s/g, "").length;
    elements.error.textContent =
      cellCount === 0
        ? ""
        : `Board must contain exactly 81 cells (${cellCount} found).`;
    elements.loadBtn.disabled = true;
    return;
  }
  const validationError = validateBoardInput(parsed);
  elements.error.textContent = validationError || "";
  elements.loadBtn.disabled = validationError !== null;
};

/**
 * Handles the Load button — parses and loads the entered board.
 */
const onBoardEntryConfirmClick = () => {
  const elements = getBoardEntryModalElements();
  if (!elements || !boardEntryModalDeps) {
    return;
  }
  const parsed = parseBoardInput(elements.textarea.value);
  if (!parsed) {
    elements.error.textContent = "Board must contain exactly 81 cells.";
    elements.loadBtn.disabled = true;
    return;
  }
  const validationError = validateBoardInput(parsed);
  if (validationError) {
    elements.error.textContent = validationError;
    elements.loadBtn.disabled = true;
    return;
  }
  boardEntryModalDeps.loadPuzzleFromBoard(parsed);
  closeBoardEntryModal();
  window.scrollTo(0, 0);
};

/**
 * Handles the Cancel button — closes the modal without any state changes.
 */
const onBoardEntryCancelClick = () => {
  closeBoardEntryModal();
};

/**
 * Handles keyboard controls while the board entry modal is open.
 * Escape closes the modal.
 * @param {Event} event - Keydown event
 */
const onBoardEntryModalKeydown = (event) => {
  const modal = getBoardEntryModalEl();
  if (!isModalOpen(modal)) {
    return;
  }
  if (event.key !== "Escape") {
    return;
  }
  event.preventDefault();
  closeBoardEntryModal();
};
