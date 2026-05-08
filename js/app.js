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

const STATUS_BASE =
  typeof STATUS_BASE_MESSAGES !== "undefined"
    ? STATUS_BASE_MESSAGES
    : {
        allValuesCorrect: "All values are correct",
        someCellsIncorrect: "Some cells are incorrect",
        puzzleSolved: "Puzzle solved!",
        puzzleUnsolveable: "Puzzle is unsolveable",
      };

const STATUS_TEMPLATES =
  typeof STATUS_MESSAGE_TEMPLATES !== "undefined"
    ? STATUS_MESSAGE_TEMPLATES
    : {
        allValuesCorrect: 'All values for "{puzzleName}" are correct!',
        someCellsIncorrect: 'Some values for "{puzzleName}" are incorrect.',
        puzzleSolved: 'Puzzle "{puzzleName}" solved!',
        puzzleUnsolveable: 'Puzzle "{puzzleName}" is unsolveable.',
        loadedPuzzle: 'Loaded puzzle "{puzzleName}".',
        failedLoadPuzzle:
          'Failed to load puzzle "{puzzleName}": {errorMessage}',
      };

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

  if (statusMessage === STATUS_BASE.allValuesCorrect) {
    return applyStatusTemplate(STATUS_TEMPLATES.allValuesCorrect, {
      puzzleName: currentPuzzleName,
    });
  }

  if (statusMessage === STATUS_BASE.someCellsIncorrect) {
    return applyStatusTemplate(STATUS_TEMPLATES.someCellsIncorrect, {
      puzzleName: currentPuzzleName,
    });
  }

  if (statusMessage === STATUS_BASE.puzzleSolved) {
    return applyStatusTemplate(STATUS_TEMPLATES.puzzleSolved, {
      puzzleName: currentPuzzleName,
    });
  }

  if (statusMessage === STATUS_BASE.puzzleUnsolveable) {
    return applyStatusTemplate(STATUS_TEMPLATES.puzzleUnsolveable, {
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
 * Updates the URL hash with the current board state.
 * Uses replaceState to avoid triggering hashchange for internal updates.
 */
const updateHash = () => {
  const encoded = encodeBoard(currentState.board);
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}#board=${encoded}`,
  );
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
  updateHash();
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
 * Handles number key press (1-9).
 * @param {number} num - Number pressed
 * @returns {Object} New state or current state
 */
const handleNumberKey = (num) => {
  const cellIndex = currentState.selected;
  const newState = placeNumber(currentState, cellIndex, num);
  if (newState.board.every((digit) => digit !== 0)) {
    return checkSolution(newState, false);
  }
  return newState;
};

/**
 * Handles delete key (Backspace, Delete, or 0).
 * @returns {Object} New state
 */
const handleDeleteKey = () => {
  const cellIndex = currentState.selected;
  return placeNumber(currentState, cellIndex, 0);
};

/**
 * Handles arrow key navigation.
 * @param {number} offset - Cell offset from arrow key
 * @returns {Object|null} New state or null if out of bounds
 */
const handleArrowKey = (offset) => {
  const nextCell = currentState.selected + offset;
  if (nextCell < 0 || nextCell >= TOTAL_CELLS) {
    return null;
  }
  return selectCell(currentState, nextCell);
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
    const newState = handleNumberKey(parseInt(event.key, 10));
    updateState(newState);
    return;
  }

  if (
    event.key === "Backspace" ||
    event.key === "Delete" ||
    event.key === "0"
  ) {
    event.preventDefault();
    const newState = handleDeleteKey();
    updateState(newState);
    return;
  }

  if (!ARROW_MOVES[event.key]) {
    return;
  }

  event.preventDefault();
  const newState = handleArrowKey(ARROW_MOVES[event.key]);
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
    updateState(handleDeleteKey());
    return;
  }
  const newState = handleNumberKey(num);
  updateState(newState);
};

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
      applyStatusTemplate(STATUS_TEMPLATES.loadedPuzzle, {
        puzzleName: currentPuzzleName,
      }),
      "",
    );
  } catch (error) {
    const failedPuzzleName = getPuzzleNameFromFilename(filename);
    setStatus(
      applyStatusTemplate(STATUS_TEMPLATES.failedLoadPuzzle, {
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
    applyStatusTemplate(STATUS_TEMPLATES.loadedPuzzle, {
      puzzleName: currentPuzzleName,
    }),
    "",
  );
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
      applyStatusTemplate(STATUS_TEMPLATES.loadedPuzzle, {
        puzzleName: currentPuzzleName,
      }),
      "",
    );
    updateHash();
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
