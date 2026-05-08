/**
 * DOM and URL persistence utilities.
 * All window/history/location access and DOM event handlers happen here.
 */

/**
 * Extracts puzzle filename from URL query parameter.
 * Examples: ?puzzle=001, ?puzzle=username/001, ?puzzle=puzzles/001.yaml
 * @returns {string|null} Puzzle filename or null if puzzle param is empty
 */
const getPuzzleFromQuery = () => {
  const params = new URLSearchParams(window.location.search);
  const puzzle = params.get("puzzle");
  if (!puzzle) {
    return null;
  }
  if (!puzzle.includes("/")) {
    return `puzzles/${puzzle}.yaml`;
  }
  if (!puzzle.includes(".yaml")) {
    return `${puzzle}.yaml`;
  }
  return puzzle;
};

/**
 * Extracts board state from URL hash.
 * @returns {string|null} Encoded board string from hash or null if not present
 */
const getBoardFromHash = () => {
  const hash = window.location.hash;
  if (!hash.includes("board=")) {
    return null;
  }
  const encoded = hash.split("board=")[1];
  return encoded || null;
};

/**
 * Updates URL query parameter with current puzzle filename.
 * @param {string} filename - Puzzle filename (e.g., "puzzles/001.yaml" or "username/001.yaml")
 */
const updateQuery = (filename) => {
  const params = new URLSearchParams(window.location.search);
  const shortName = filename.replace(/\.yaml$/, "").replace(/^puzzles\//, "");
  params.set("puzzle", shortName);
  window.history.replaceState(
    null,
    "",
    `?${params.toString()}${window.location.hash}`,
  );
};

/**
 * Updates the URL hash with the current board state.
 * Uses replaceState to avoid triggering hashchange for internal updates.
 * @param {Array<number>} board - Board state to encode in hash
 */
const updateHash = (board) => {
  const encoded = encodeBoard(board);
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}#board=${encoded}`,
  );
};

/**
 * Handles number key press (1-9).
 * @param {Object} state - Current game state
 * @param {number} num - Number pressed (1-9)
 * @returns {Object} New state or current state
 */
const handleNumberKey = (state, num) => {
  const newState = updateCellValue(state, state.selected, num);
  if (newState.board.every((digit) => digit !== 0)) {
    return checkSolution(newState, false);
  }
  return newState;
};

/**
 * Handles delete key (Backspace, Delete, or 0).
 * @param {Object} state - Current game state
 * @returns {Object} New state
 */
const handleDeleteKey = (state) => {
  return clearCellValue(state, state.selected);
};

/**
 * Handles arrow key navigation.
 * @param {Object} state - Current game state
 * @param {number} offset - Cell offset from arrow key
 * @returns {Object|null} New state or null if out of bounds
 */
const handleArrowKey = (state, offset) => {
  return moveSelection(state, offset);
};
