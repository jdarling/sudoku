/**
 * New Game decision modal component.
 * Displays three options: Cancel, Clear (board to givens), or Random (new puzzle).
 * Uses decisionModal.js as the foundation.
 * Delegates to app state functions (clearBoard, loadRandomPuzzle).
 */

/**
 * Callbacks for New Game actions.
 * Injected by app.js at initialization.
 * @type {Object|null}
 */
let newGameDecisionModalDeps = null;

/**
 * Stores dependencies for New Game modal actions.
 * @param {Object} deps - {clearBoard, loadRandomPuzzle}
 */
const setNewGameDecisionModalDeps = (deps) => {
  newGameDecisionModalDeps = deps;
};

/**
 * Opens the New Game decision modal with three action buttons.
 */
const openNewGameDecisionModal = () => {
  if (!newGameDecisionModalDeps) {
    return;
  }

  const buttons = [
    { label: "Cancel", callback: null },
    { label: "Clear", callback: newGameDecisionModalDeps.clearBoard },
    { label: "Random", callback: newGameDecisionModalDeps.loadRandomPuzzle },
  ];

  openDecisionModal(
    "Choose an action: clear the current board to givens only, or load a random puzzle.",
    buttons,
  );
};
