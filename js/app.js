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
let lastStatusType = "";

/**
 * Interpolates placeholders in a status template.
 * @param {string} template - Template with placeholders
 * @param {Object} values - Placeholder values
 * @returns {string} Interpolated status text
 */
const applyStatusTemplate = (template, values) => {
  let message = template;

  Object.keys(values).forEach((key) => {
    message = message.split(`{${key}}`).join(String(values[key]));
  });

  return message;
};

/**
 * Builds a fallback puzzle name from filename.
 * @param {string} filename - Puzzle filename
 * @returns {string} Puzzle display name
 */
const getPuzzleNameFromFilename = (filename) => {
  if (!filename) {
    return "unknown";
  }

  return filename.replace(/\.yaml$/, "").replace(/^puzzles\//, "");
};

/**
 * Stores the active puzzle display name from loaded metadata.
 * @param {Object} puzzle - Loaded puzzle object
 */
const setCurrentPuzzleName = (puzzle) => {
  if (puzzle && puzzle.name && puzzle.name.trim()) {
    currentPuzzleName = puzzle.name.trim();
    return;
  }

  currentPuzzleName = getPuzzleNameFromFilename(puzzle ? puzzle.filename : "");
};

/**
 * Formats status messages with the active puzzle name.
 * @param {string} statusMessage - Base state status message
 * @returns {string} Puzzle-aware message
 */
const formatStatusWithPuzzleName = (statusMessage) => {
  if (!statusMessage || !currentPuzzleName) {
    return statusMessage;
  }

  const template = STATUS_MESSAGES[statusMessage];
  if (template) {
    return applyStatusTemplate(template, {
      puzzleName: currentPuzzleName,
    });
  }

  return statusMessage;
};

/**
 * Renders status with puzzle-aware formatting.
 * @param {string} statusMessage - Base status message
 * @param {string} statusType - Status type class
 */
const renderStatus = (statusMessage, statusType) => {
  setStatus(formatStatusWithPuzzleName(statusMessage), statusType);
};

/**
 * Updates current state and orchestrates rendering and side effects.
 * @param {Object} newState - New state to apply
 */
const updateState = (newState) => {
  currentState = newState;
  renderGrid(currentState, onCellFocus, onCellKeydown, onCellInput);
  markWrongCells(currentState);
  renderStatus(currentState.status, currentState.statusType);

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
 * Handles cell focus event.
 * @param {Event} event - Focus event
 */
const onCellFocus = (event) => {
  const cellIndex = parseInt(event.currentTarget.dataset.cellIndex, 10);
  if (cellIndex === currentState.selected) {
    return;
  }
  updateState(selectCell(currentState, cellIndex));
};

/**
 * Handles cell keydown event.
 * @param {Event} event - Keydown event
 */
const onCellKeydown = (event) => {
  const cellIndex = parseInt(event.currentTarget.dataset.cellIndex, 10);
  if (currentState.given[cellIndex]) {
    return;
  }

  if (event.key >= "1" && event.key <= "9") {
    event.preventDefault();
    const newState = handleNumberKey(currentState, parseInt(event.key, 10));
    updateState(newState);
    return;
  }

  if (
    event.key === "Backspace" ||
    event.key === "Delete" ||
    event.key === "0"
  ) {
    event.preventDefault();
    const newState = handleDeleteKey(currentState);
    updateState(newState);
    return;
  }

  if (!ARROW_MOVES[event.key]) {
    return;
  }

  event.preventDefault();
  const newState = handleArrowKey(currentState, ARROW_MOVES[event.key]);
  if (newState) {
    updateState(newState);
  }
};

/**
 * Handles cell input event.
 * @param {Event} event - Input event
 */
const onCellInput = (event) => {
  const cellIndex = parseInt(event.currentTarget.dataset.cellIndex, 10);
  if (currentState.given[cellIndex]) {
    return;
  }
  const numValue =
    parseInt(event.currentTarget.value.replace(/[^1-9]/g, ""), 10) || 0;
  updateState(placeNumber(currentState, cellIndex, numValue));
};

/**
 * Handles number button click.
 * @param {Event} event - Click event
 */
const onNumberButtonClick = (event) => {
  if (currentState.selected < 0) {
    return;
  }
  const num = parseInt(event.currentTarget.dataset.n, 10);
  if (num === 0) {
    updateState(handleDeleteKey(currentState));
    return;
  }
  const newState = handleNumberKey(currentState, num);
  updateState(newState);
};

/**
 * Loads a puzzle by filename and initializes game state.
 * If a board hash exists in the URL, restores that board state after loading the puzzle.
 * @param {string} filename - Puzzle filename (e.g., "puzzles/001.yaml")
 * @returns {Promise<void>}
 */
const loadPuzzleByFilename = async (filename) => {
  try {
    const puzzle = await getPuzzle(filename);
    currentState = createStateFromPuzzle(puzzle.puzzle);
    setCurrentPuzzleName(puzzle);
    updateQuery(filename);

    const boardHash = getBoardFromHash();
    if (boardHash) {
      const decodedBoard = decodeBoard(boardHash);
      if (decodedBoard) {
        currentState = {
          ...currentState,
          board: decodedBoard,
        };
      }
    }

    renderGrid(currentState, onCellFocus, onCellKeydown, onCellInput);
    markWrongCells(currentState);
    setStatus(
      applyStatusTemplate(STATUS_MESSAGES["Loaded puzzle"], {
        puzzleName: currentPuzzleName,
      }),
      "",
    );
    lastStatusType = "";
  } catch (error) {
    const failedPuzzleName = getPuzzleNameFromFilename(filename);
    setStatus(
      applyStatusTemplate(STATUS_MESSAGES["Failed to load puzzle"], {
        puzzleName: failedPuzzleName,
        errorMessage: error.message,
      }),
      "error",
    );
  }
};

/**
 * Loads a new puzzle and initializes game state.
 * Checks URL query parameter first; if present, loads that puzzle and restores board from hash if present.
 * Otherwise loads a random puzzle and updates the URL.
 * @returns {Promise<void>}
 */
const loadNewGame = async () => {
  const puzzleFromQuery = getPuzzleFromQuery();
  if (puzzleFromQuery) {
    await loadPuzzleByFilename(puzzleFromQuery);
    return;
  }

  const puzzle = await getRandomPuzzle();
  currentState = createStateFromPuzzle(puzzle.puzzle);
  setCurrentPuzzleName(puzzle);
  updateQuery(puzzle.filename);
  renderGrid(currentState, onCellFocus, onCellKeydown, onCellInput);
  markWrongCells(currentState);
  setStatus(
    applyStatusTemplate(STATUS_MESSAGES["Loaded puzzle"], {
      puzzleName: currentPuzzleName,
    }),
    "",
  );
  lastStatusType = "";
};

/**
 * Loads a random puzzle and updates the URL.
 * Used by the "New Puzzle" button to always get a different puzzle. * Clears any board hash to start fresh. * @returns {Promise<void>}
 */
const loadRandomPuzzle = async () => {
  try {
    const puzzle = await getRandomPuzzle();
    currentState = createStateFromPuzzle(puzzle.puzzle);
    setCurrentPuzzleName(puzzle);
    updateQuery(puzzle.filename);
    renderGrid(currentState, onCellFocus, onCellKeydown, onCellInput);
    markWrongCells(currentState);
    setStatus(
      applyStatusTemplate(STATUS_MESSAGES["Loaded puzzle"], {
        puzzleName: currentPuzzleName,
      }),
      "",
    );
    lastStatusType = "";
    updateHash(currentState.board);
  } catch (error) {
    setStatus(`Failed to load puzzle: ${error.message}`, "error");
  }
};

/**
 * Normalizes puzzle input to standard filename format: "puzzles/XXX.yaml"
 * Accepts formats: "001", "puzzles/001", "puzzles/001.yaml"
 * @param {string} inputValue - User input value
 * @returns {string} Normalized filename or null if invalid
 */
const normalizePuzzleInput = (inputValue) => {
  if (!inputValue || typeof inputValue !== "string") {
    return null;
  }

  const trimmed = inputValue.trim();
  if (!trimmed) {
    return null;
  }

  // Remove ".yaml" extension if present
  let withoutExt = trimmed;
  if (trimmed.endsWith(".yaml")) {
    withoutExt = trimmed.slice(0, -5);
  }

  // Remove "puzzles/" prefix if present
  let puzzleId = withoutExt;
  if (withoutExt.startsWith("puzzles/")) {
    puzzleId = withoutExt.slice(8);
  }

  // Validate it's a valid puzzle ID (numeric)
  if (!/^\d+$/.test(puzzleId)) {
    return null;
  }

  return `puzzles/${puzzleId}.yaml`;
};

/**
 * Handles Load Game button click.
 * Prompts user for puzzle ID and loads the puzzle if valid.
 */
const onLoadButtonClick = () => {
  const inputValue = prompt(
    "Enter puzzle ID (e.g., 001, puzzles/001, or puzzles/001.yaml):",
  );
  if (inputValue === null) {
    return; // User cancelled
  }

  const normalized = normalizePuzzleInput(inputValue);
  if (!normalized) {
    setStatus("Invalid puzzle ID format.", "error");
    return;
  }

  loadPuzzleByFilename(normalized);
};

/**
 * Initializes the game and sets up event listeners.
 * @returns {Promise<void>}
 */
const init = async () => {
  initTheme();
  renderVersion();
  await loadNewGame();

  document.getElementById("new-btn").addEventListener("click", () => {
    loadRandomPuzzle();
  });

  document
    .getElementById("load-btn")
    .addEventListener("click", onLoadButtonClick);

  document.getElementById("check-btn").addEventListener("click", () => {
    updateState(checkSolution(currentState, true));
  });

  document.getElementById("hint-btn").addEventListener("click", () => {
    updateState(hintBoard(currentState));
  });

  document.getElementById("solve-btn").addEventListener("click", () => {
    updateState(solveBoard(currentState));
  });

  document
    .getElementById("theme-select")
    .addEventListener("change", (event) => {
      applyTheme(event.target.value);
    });

  document.querySelectorAll(".num-btn").forEach((btn) => {
    btn.addEventListener("click", onNumberButtonClick);
  });

  window.addEventListener("popstate", () => {
    loadNewGame();
  });

  window.addEventListener("hashchange", () => {
    if (currentState && currentState.statusType === "win") {
      return;
    }
    const boardHash = getBoardFromHash();
    if (boardHash && currentState) {
      const decodedBoard = decodeBoard(boardHash);
      if (decodedBoard) {
        currentState = {
          ...currentState,
          board: decodedBoard,
        };
        renderGrid(currentState, onCellFocus, onCellKeydown, onCellInput);
        markWrongCells(currentState);
      }
    }
  });
};

init().catch((error) => {
  console.error("Failed to initialize game:", error);
});
