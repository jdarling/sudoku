/**
 * Scoreboard modal component.
 * Shows scorecard metrics after puzzle completion.
 */

/**
 * Returns the scoreboard modal root element.
 * @returns {HTMLElement|null}
 */
const getScoreboardModalEl = () => document.getElementById("scoreboard-modal");

/**
 * Sets text content on an element by id when present.
 * @param {string} elementId - Element id
 * @param {string} value - Text value
 * @returns {void}
 */
const setScoreboardText = (elementId, value) => {
  const element = document.getElementById(elementId);
  if (!element) {
    return;
  }
  element.textContent = value;
};

/**
 * Opens scoreboard modal and renders scorecard metrics.
 * @param {Object} scorecard - Completed scorecard object
 * @returns {void}
 */
const openScoreboardModal = (scorecard) => {
  const modal = getScoreboardModalEl();
  if (!modal) {
    return;
  }

  const metrics = createMetricsDisplay(scorecard);
  setScoreboardText("scoreboard-puzzle-id", metrics.puzzleId);
  setScoreboardText("scoreboard-elapsed-time", metrics.elapsedTime);
  setScoreboardText("scoreboard-move-count", String(metrics.moveCount));
  setScoreboardText("scoreboard-check-count", String(metrics.checkClickCount));
  setScoreboardText("scoreboard-hint-count", String(metrics.hintClickCount));
  setScoreboardText(
    "scoreboard-immediate-errors",
    String(metrics.immediateErrorShownCount),
  );
  setScoreboardText(
    "scoreboard-error-cells",
    String(metrics.errorCellShownCount),
  );
  setScoreboardText("scoreboard-total-errors", String(metrics.errorShownCount));
  setScoreboardText(
    "scoreboard-support-options",
    metrics.supportOptionsUsed.join(", "),
  );

  openModal(modal);

  const closeButton = document.getElementById("scoreboard-close-btn");
  if (!closeButton) {
    return;
  }
  closeButton.focus();
};

/**
 * Closes scoreboard modal.
 * @returns {void}
 */
const closeScoreboardModal = () => {
  closeModal(getScoreboardModalEl());
};

/**
 * Handles scoreboard modal close button click.
 * @returns {void}
 */
const onScoreboardCloseClick = () => {
  closeScoreboardModal();
};

/**
 * Handles keyboard controls while scoreboard modal is open.
 * Escape closes the modal.
 * @param {Event} event - Keydown event
 * @returns {void}
 */
const onScoreboardModalKeydown = (event) => {
  if (!isModalOpen(getScoreboardModalEl())) {
    return;
  }

  if (event.key !== "Escape") {
    return;
  }

  event.preventDefault();
  closeScoreboardModal();
};
