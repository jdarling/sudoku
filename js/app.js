/**
 * Module-level current game state.
 * @type {Object|null}
 */
let currentState = null;

/**
 * Module-level active puzzle name for status messaging.
 * @type {string}
 */
let currentPuzzleName = "";
let currentPuzzleFilename = "";
let lastStatusType = "";

/**
 * Stores the active puzzle display name from loaded metadata.
 * @param {Object} puzzle - Loaded puzzle object
 */
const setCurrentPuzzleName = (puzzle) => {
  if (puzzle && puzzle.name && puzzle.name.trim()) {
    currentPuzzleName = puzzle.name.trim();
    return;
  }

  currentPuzzleName = extractPuzzleId(puzzle ? puzzle.filename : "");
};

/**
 * Updates current state and orchestrates rendering and side effects.
 * @param {Object} newState - New state to apply
 */
const updateState = (newState) => {
  currentState = newState;
  renderGrid(currentState, onCellFocus, onCellKeydown, onCellInput);
  markWrongCells(currentState);
  setStatus(
    formatPuzzleStatus(currentState.status, currentPuzzleName, STATUS_MESSAGES),
    currentState.statusType,
  );

  const enteredWin =
    currentState.statusType === "win" &&
    currentState.status === "Puzzle solved!" &&
    lastStatusType !== "win";
  if (enteredWin) {
    launchWinCelebration();
  }

  lastStatusType = currentState.statusType || "";
  updateHash(currentState.board);
  if (currentState.selected >= 0) {
    focusCell(currentState.selected);
  }
};

/**
 * Returns current application state.
 * @returns {Object|null} Current state
 */
const getCurrentState = () => {
  return currentState;
};

/**
 * Applies decoded board state from URL hash and re-renders.
 * @param {number[]} decodedBoard - Decoded board values
 */
const applyBoardStateFromHash = (decodedBoard) => {
  if (!currentState) {
    return;
  }
  updateState({ ...currentState, board: decodedBoard });
};

/**
 * Loads and displays a game: renders grid, marks cells, displays status, updates hash.
 * Common logic shared by all puzzle-loading functions.
 * @param {Object} puzzle - Loaded puzzle object with name and filename
 * @param {Object} boardState - The board state to apply
 */
const loadGame = (puzzle, boardState) => {
  currentState = boardState;
  currentPuzzleFilename = puzzle && puzzle.filename ? puzzle.filename : "";
  setCurrentPuzzleName(puzzle);
  renderGrid(currentState, onCellFocus, onCellKeydown, onCellInput);
  markWrongCells(currentState);
  setStatus(
    formatPuzzleStatus("Loaded puzzle", currentPuzzleName, STATUS_MESSAGES),
    "",
  );
  lastStatusType = "";
  updateHash(currentState.board);
};

/**
 * Loads a puzzle by filename and initializes game state.
 * Creates a fresh board state without restoring from URL hash.
 * This is used by the "Load Game" button for loading puzzles by ID.
 * @param {string} filename - Puzzle filename (e.g., "puzzles/001.yaml")
 * @returns {Promise<void>}
 */
const loadPuzzleByFilename = async (filename) => {
  try {
    const puzzle = await getPuzzle(filename);
    const boardState = createStateFromPuzzle(puzzle.puzzle);
    updateQuery(filename);
    loadGame(puzzle, boardState);
  } catch (error) {
    const failedPuzzleName = extractPuzzleId(filename);
    setStatus(
      formatString(STATUS_MESSAGES["Failed to load puzzle"], {
        puzzleName: failedPuzzleName,
        errorMessage: error.message,
      }),
      "error",
    );
  }
};

/**
 * Loads a new puzzle and initializes game state.
 * Checks URL query parameter first; if present, loads that puzzle.
 * If a board hash exists in the URL, restores that board state (for URL-based persistence).
 * Otherwise loads a random puzzle and updates the URL.
 * @returns {Promise<void>}
 */
const loadNewGame = async () => {
  const puzzleFromQuery = getPuzzleFromQuery();
  if (puzzleFromQuery) {
    try {
      const puzzle = await getPuzzle(puzzleFromQuery);
      let boardState = createStateFromPuzzle(puzzle.puzzle);

      const boardHash = getBoardFromHash();
      if (boardHash) {
        const decodedBoard = decodeBoard(boardHash);
        if (decodedBoard) {
          boardState = { ...boardState, board: decodedBoard };
        }
      }

      loadGame(puzzle, boardState);
    } catch (error) {
      const failedPuzzleName = extractPuzzleId(puzzleFromQuery);
      setStatus(
        formatString(STATUS_MESSAGES["Failed to load puzzle"], {
          puzzleName: failedPuzzleName,
          errorMessage: error.message,
        }),
        "error",
      );
    }
    return;
  }

  const puzzle = await getRandomPuzzle();
  const boardState = createStateFromPuzzle(puzzle.puzzle);
  updateQuery(puzzle.filename);
  loadGame(puzzle, boardState);
};

/**
 * Loads a random puzzle and updates the URL.
 * Used by the "New Puzzle" button to always get a different puzzle.
 * Clears any board hash to start fresh.
 * @returns {Promise<void>}
 */
const loadRandomPuzzle = async () => {
  try {
    const puzzle = await getRandomPuzzle(currentPuzzleFilename || null);
    try {
      const boardState = createStateFromPuzzle(puzzle.puzzle);
      updateQuery(puzzle.filename);
      loadGame(puzzle, boardState);
    } catch (error) {
      const failedPuzzleName = extractPuzzleId(puzzle.filename);
      setStatus(
        formatString(STATUS_MESSAGES["Failed to load puzzle"], {
          puzzleName: failedPuzzleName,
          errorMessage: error.message,
        }),
        "error",
      );
    }
  } catch (error) {
    setStatus(
      formatString(STATUS_MESSAGES["Failed to load puzzle"], {
        puzzleName: extractPuzzleId(""),
        errorMessage: error.message,
      }),
      "error",
    );
  }
};

/**
 * Initializes the game and sets up event listeners.
 * @returns {Promise<void>}
 */
const init = async () => {
  initTheme();
  renderVersion();
  await loadNewGame();

  configureDomEventHandlers({
    getState: getCurrentState,
    applyState: updateState,
    setStatus,
    applyTheme,
    loadRandomPuzzle,
    loadPuzzleByFilename,
    loadNewGame,
    applyBoardStateFromHash,
  });

  document.getElementById("new-btn").addEventListener("click", onNewGameClick);
  document
    .getElementById("load-btn")
    .addEventListener("click", onLoadGameClick);
  document
    .getElementById("check-btn")
    .addEventListener("click", onCheckButtonClick);
  document
    .getElementById("hint-btn")
    .addEventListener("click", onHintButtonClick);
  document
    .getElementById("solve-btn")
    .addEventListener("click", onSolveButtonClick);
  document
    .getElementById("theme-select")
    .addEventListener("change", onThemeChange);

  document.querySelectorAll(".num-btn").forEach((btn) => {
    btn.addEventListener("click", onNumberButtonClick);
  });

  window.addEventListener("popstate", onPopState);
  window.addEventListener("hashchange", onHashChange);
};

init().catch((error) => {
  console.error("Failed to initialize game:", error);
});
