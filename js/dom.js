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
 * Shared dependency container for top-level DOM handlers.
 * @type {Object|null}
 */
let domHandlerDeps = null;

/**
 * Registers dependencies used by DOM event handlers.
 * @param {Object} deps - Dependency functions from app orchestration
 */
const configureDomEventHandlers = (deps) => {
  domHandlerDeps = deps;
};

/**
 * Handles cell focus event.
 * @param {Event} event - Focus event
 */
const onCellFocus = (event) => {
  if (!domHandlerDeps) {
    return;
  }

  const state = domHandlerDeps.getState();
  if (!state) {
    return;
  }

  const cellIndex = parseInt(event.currentTarget.dataset.cellIndex, 10);
  if (cellIndex === state.selected) {
    return;
  }

  domHandlerDeps.applyState(selectCell(state, cellIndex));
};

/**
 * Handles cell keydown event.
 * @param {Event} event - Keydown event
 */
const onCellKeydown = (event) => {
  if (!domHandlerDeps) {
    return;
  }

  const state = domHandlerDeps.getState();
  if (!state) {
    return;
  }

  const cellIndex = parseInt(event.currentTarget.dataset.cellIndex, 10);
  if (state.given[cellIndex]) {
    return;
  }

  if (event.key >= "1" && event.key <= "9") {
    event.preventDefault();
    const num = parseInt(event.key, 10);
    const afterNum = placeNumber(state, state.selected, num);
    const resolved = afterNum.board.every((d) => d !== 0)
      ? checkSolution(afterNum, false)
      : afterNum;
    domHandlerDeps.applyState(resolved);
    return;
  }

  if (
    event.key === "Backspace" ||
    event.key === "Delete" ||
    event.key === "0"
  ) {
    event.preventDefault();
    domHandlerDeps.applyState(clearCellValue(state, state.selected));
    return;
  }

  if (!ARROW_MOVES[event.key]) {
    return;
  }

  event.preventDefault();
  const movedState = moveSelection(state, ARROW_MOVES[event.key]);
  if (!movedState) {
    return;
  }

  domHandlerDeps.applyState(movedState);
};

/**
 * Handles cell input event.
 * @param {Event} event - Input event
 */
const onCellInput = (event) => {
  if (!domHandlerDeps) {
    return;
  }

  const state = domHandlerDeps.getState();
  if (!state) {
    return;
  }

  const cellIndex = parseInt(event.currentTarget.dataset.cellIndex, 10);
  if (state.given[cellIndex]) {
    return;
  }

  const numValue =
    parseInt(event.currentTarget.value.replace(/[^1-9]/g, ""), 10) || 0;
  domHandlerDeps.applyState(placeNumber(state, cellIndex, numValue));
};

/**
 * Handles number pad button click.
 * @param {Event} event - Click event
 */
const onNumberButtonClick = (event) => {
  if (!domHandlerDeps) {
    return;
  }

  const state = domHandlerDeps.getState();
  if (!state || state.selected < 0) {
    return;
  }

  const num = parseInt(event.currentTarget.dataset.n, 10);
  if (num === 0) {
    domHandlerDeps.applyState(clearCellValue(state, state.selected));
    return;
  }

  const afterNum = placeNumber(state, state.selected, num);
  const resolved = afterNum.board.every((d) => d !== 0)
    ? checkSolution(afterNum, false)
    : afterNum;
  domHandlerDeps.applyState(resolved);
};

/**
 * Handles New Game button click.
 */
const onNewGameClick = () => {
  if (!domHandlerDeps) {
    return;
  }
  domHandlerDeps.loadRandomPuzzle();
};

/**
 * Handles Load Game button click.
 */
const onLoadGameClick = () => {
  if (!domHandlerDeps) {
    return;
  }

  const inputValue = prompt(
    "Enter puzzle ID (e.g., 001, puzzles/001, or puzzles/001.yaml):",
  );
  if (inputValue === null) {
    return;
  }

  const normalized = normalizePuzzleId(inputValue);
  if (!normalized) {
    domHandlerDeps.setStatus("Invalid puzzle ID format.", "error");
    return;
  }

  domHandlerDeps.loadPuzzleByFilename(normalized);
};

/**
 * Handles Check button click.
 */
const onCheckButtonClick = () => {
  if (!domHandlerDeps) {
    return;
  }
  const state = domHandlerDeps.getState();
  if (!state) {
    return;
  }
  domHandlerDeps.applyState(checkSolution(state, true));
};

/**
 * Handles Hint button click.
 */
const onHintButtonClick = () => {
  if (!domHandlerDeps) {
    return;
  }
  const state = domHandlerDeps.getState();
  if (!state) {
    return;
  }
  domHandlerDeps.applyState(hintBoard(state));
};

/**
 * Handles Solve button click.
 */
const onSolveButtonClick = () => {
  if (!domHandlerDeps) {
    return;
  }
  const state = domHandlerDeps.getState();
  if (!state) {
    return;
  }
  domHandlerDeps.applyState(solveBoard(state));
};

/**
 * Handles theme selector change.
 * @param {Event} event - Change event
 */
const onThemeChange = (event) => {
  if (!domHandlerDeps) {
    return;
  }
  domHandlerDeps.applyTheme(event.target.value);
};

/**
 * Handles browser popstate event.
 */
const onPopState = () => {
  if (!domHandlerDeps) {
    return;
  }
  domHandlerDeps.loadNewGame();
};

/**
 * Handles browser hashchange event.
 */
const onHashChange = () => {
  if (!domHandlerDeps) {
    return;
  }

  const state = domHandlerDeps.getState();
  if (!state || state.statusType === "win") {
    return;
  }

  const boardHash = getBoardFromHash();
  if (!boardHash) {
    return;
  }

  const decodedBoard = decodeBoard(boardHash);
  if (!decodedBoard) {
    return;
  }

  domHandlerDeps.applyBoardStateFromHash(decodedBoard);
};
