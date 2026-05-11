/**
 * DOM and URL persistence utilities.
 * All window/history/location access and DOM event handlers happen here.
 */

/**
 * Detects touch-first/coarse-pointer devices where soft keyboard should stay hidden.
 * @returns {boolean} True when using a coarse pointer device
 */
const isCoarsePointerDevice = () => {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia("(pointer: coarse)").matches;
};

/**
 * Extracts puzzle token from URL query parameter.
 * Returns the raw token without path inference or file extension handling.
 * Token sanitization and file resolution happens at the resolver layer.
 * @returns {string|null} Raw puzzle token or null if puzzle param is empty
 */
const getPuzzleFromQuery = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("puzzle") || null;
};

/**
 * Extracts the puzzleUrl query parameter from the current URL.
 * @returns {string|null} Raw URL string or null if not present
 */
const getUrlPuzzleFromQuery = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("puzzleUrl") || null;
};

/**
 * Extracts the board query parameter from the current URL.
 * Used for manually-entered boards shared via ?board= links.
 * @returns {string|null} 81-char board string or null if not present
 */
const getBoardFromQuery = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("board") || null;
};

/**
 * Builds a query string for the app URL from a puzzle identity.
 * Exactly one of puzzleId, puzzleUrl, or board should be provided.
 * Returns an empty string when none is provided.
 * @param {Object} opts
 * @param {string|null} [opts.puzzleId] - Canonical puzzle id (e.g. '004')
 * @param {string|null} [opts.puzzleUrl] - Absolute URL to a remote puzzle file
 * @param {string|null} [opts.board] - 81-char digit string for a manually-entered board
 * @returns {string} Query string including leading '?', or ''
 */
const buildPuzzleQueryString = ({
  puzzleId = null,
  puzzleUrl = null,
  board = null,
} = {}) => {
  if (puzzleId) {
    return `?puzzle=${encodeURIComponent(puzzleId)}`;
  }
  if (puzzleUrl) {
    const params = new URLSearchParams();
    params.set("puzzleUrl", puzzleUrl);
    return `?${params.toString()}`;
  }
  if (board) {
    return `?board=${encodeURIComponent(board)}`;
  }
  return "";
};

/**
 * Replaces the browser URL query while preserving the current hash.
 * Single point of truth for all URL query updates.
 * @param {string} queryString - Value returned by buildPuzzleQueryString
 * @returns {void}
 */
const setAppQuery = (queryString) => {
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${queryString}${window.location.hash}`,
  );
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
 * Updates URL query parameter with the canonical puzzle id.
 * @param {string} canonicalId - Canonical puzzle id (e.g., "004")
 * @returns {void}
 */
const updateQuery = (canonicalId) => {
  setAppQuery(buildPuzzleQueryString({ puzzleId: canonicalId }));
};

/**
 * Updates the URL hash with the current board state.
 * Uses replaceState to avoid triggering hashchange for internal updates.
 * @param {Array<number>} board - Board state to encode in hash
 * @returns {void}
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
 * Clears the board hash from the URL.
 * @returns {void}
 */
const clearBoardHash = () => {
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`,
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
 * @returns {void}
 */
const configureDomEventHandlers = (deps) => {
  domHandlerDeps = deps;
};

/**
 * Handles cell focus event.
 * @param {Event} event - Focus event
 * @returns {void}
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

  domHandlerDeps.applyState(selectCell(state, cellIndex), {
    kind: "select",
  });
};

/**
 * Handles cell keydown event.
 * @param {Event} event - Keydown event
 * @returns {void}
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
    domHandlerDeps.applyState(applyNumber(state, parseInt(event.key, 10)), {
      kind: "move",
      isClear: false,
    });
    return;
  }

  if (
    event.key === "Backspace" ||
    event.key === "Delete" ||
    event.key === "0"
  ) {
    event.preventDefault();
    domHandlerDeps.applyState(clearCellValue(state, state.selected), {
      kind: "move",
      isClear: true,
    });
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

  domHandlerDeps.applyState(movedState, {
    kind: "navigate",
  });
};

/**
 * Handles cell input event.
 * @param {Event} event - Input event
 * @returns {void}
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
  domHandlerDeps.applyState(placeNumber(state, cellIndex, numValue), {
    kind: "move",
    isClear: numValue === 0,
  });
};

/**
 * Handles number pad button click.
 * @param {Event} event - Click event
 * @returns {void}
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
    domHandlerDeps.applyState(clearCellValue(state, state.selected), {
      kind: "move",
      isClear: true,
    });
    return;
  }

  domHandlerDeps.applyState(applyNumber(state, num), {
    kind: "move",
    isClear: false,
  });
};

/**
 * Handles New Game button click.
 * @returns {void}
 */
const onNewGameClick = () => {
  openNewGameDecisionModal();
};

/**
 * Handles Load Game button click.
 * @returns {Promise<void>}
 */
const onLoadGameClick = async () => {
  if (!domHandlerDeps) {
    return;
  }

  await openLoadModal();
};

/**
 * Handles Check button click.
 * @returns {void}
 */
const onCheckButtonClick = () => {
  if (!domHandlerDeps) {
    return;
  }
  const state = domHandlerDeps.getState();
  if (!state) {
    return;
  }
  domHandlerDeps.applyState(checkSolution(state, true), {
    kind: "check",
  });
};

/**
 * Handles Hint button click.
 * @returns {void}
 */
const onHintButtonClick = () => {
  if (!domHandlerDeps) {
    return;
  }
  const state = domHandlerDeps.getState();
  if (!state) {
    return;
  }
  domHandlerDeps.applyState(hintBoard(state), {
    kind: "hint",
  });
};

/**
 * Handles Solve button click.
 * @returns {void}
 */
const onSolveButtonClick = () => {
  if (!domHandlerDeps) {
    return;
  }
  const state = domHandlerDeps.getState();
  if (!state) {
    return;
  }

  openConfirmModal(
    "Reveal the full solution? This will fill the entire board.",
    () =>
      domHandlerDeps.applyState(solveBoard(state), {
        kind: "solve",
      }),
  );
};

/**
 * Handles browser popstate event.
 * @returns {void}
 */
const onPopState = () => {
  if (!domHandlerDeps) {
    return;
  }
  domHandlerDeps.loadNewGame();
};

/**
 * Handles browser hashchange event.
 * @returns {void}
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
