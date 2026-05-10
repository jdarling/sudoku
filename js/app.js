/**
 * Module-level current game state.
 * @type {Object|null}
 */
let currentState = null;

/**
 * Module-level options, loaded from localStorage on init.
 * Updated immutably when the user changes any option.
 * @type {Object}
 */
let currentOptions = createDefaultOptions();

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
  renderGrid(
    currentState,
    currentOptions.highlightFeatures,
    onCellFocus,
    onCellKeydown,
    onCellInput,
  );
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
  updateState(applyDecodedBoard(currentState, decodedBoard));
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
  renderGrid(
    currentState,
    currentOptions.highlightFeatures,
    onCellFocus,
    onCellKeydown,
    onCellInput,
  );
  setStatus(
    formatPuzzleStatus("Loaded puzzle", currentPuzzleName, STATUS_MESSAGES),
    "",
  );
  lastStatusType = "";
  updateHash(currentState.board);
  window.scrollTo(0, 0);
};

/**
 * Applies a fetched puzzle to state, URL query, and rendering.
 * @param {Object} puzzle - Loaded puzzle object
 */
const loadFetchedPuzzle = (puzzle) => {
  const boardState = createStateFromPuzzle(puzzle.puzzle);
  const canonicalId = puzzle.filename
    .split("/")
    .pop()
    .replace(/\.yaml$/, "");
  updateQuery(canonicalId);
  loadGame(puzzle, boardState);
};

/**
 * Applies not-found puzzle fallback state.
 * Renders a blank board, shows loader error, and clears stale board hash.
 * @param {string} incomingToken - Original puzzle token from query
 */
const showUnknownPuzzleFallback = (incomingToken) => {
  const blankState = createStateFromPuzzle("0".repeat(TOTAL_CELLS));
  currentPuzzleFilename = "";
  currentPuzzleName = "unknown";
  updateState({
    ...blankState,
    status: `Can't load puzzle "${incomingToken}".`,
    statusType: "error",
  });
  clearBoardHash();
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
    loadFetchedPuzzle(puzzle);
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
 * Checks URL query parameter first; if present, matches against puzzle index.
 * If a board hash exists in the URL, restores that board state (for URL-based persistence).
 * Otherwise loads a random puzzle and updates the URL.
 * @returns {Promise<void>}
 */
const loadNewGame = async () => {
  const incomingToken = getPuzzleFromQuery();
  const incomingUrl = getUrlPuzzleFromQuery();

  if (incomingUrl) {
    try {
      await loadPuzzleFromUrl(incomingUrl);
    } catch (error) {
      showUnknownPuzzleFallback(incomingUrl);
    }
    return;
  }

  if (incomingToken) {
    try {
      const indexEntries = await getPuzzleIndex();
      const { exactMatch, filtered } = findPuzzleMatches(
        incomingToken,
        indexEntries,
      );

      if (exactMatch) {
        const puzzle = await getPuzzle(exactMatch);
        let boardState = createStateFromPuzzle(puzzle.puzzle);

        const boardHash = getBoardFromHash();
        if (boardHash) {
          const decodedBoard = decodeBoard(boardHash);
          boardState = applyDecodedBoard(boardState, decodedBoard);
        }

        loadGame(puzzle, boardState);
        const canonicalId = exactMatch
          .split("/")
          .pop()
          .replace(/\.yaml$/, "");
        updateQuery(canonicalId);
      } else {
        const selectedFilename = await openLoadModalForSelection(incomingToken);
        if (!selectedFilename) {
          showUnknownPuzzleFallback(incomingToken);
        } else {
          await loadPuzzleByFilename(selectedFilename);
        }
      }
    } catch (error) {
      console.error("[loadNewGame] error:", error);
      showUnknownPuzzleFallback(incomingToken);
    }
    return;
  }

  try {
    const puzzle = await getRandomPuzzle();
    loadFetchedPuzzle(puzzle);
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
 * Loads a puzzle from an arbitrary URL and updates state and URL.
 * Handles indexed and unindexed puzzles differently for URL provenance.
 * Error messages are surfaced via status, not thrown.
 * @param {string} puzzleUrl - Validated absolute URL to a .yaml puzzle file
 * @returns {Promise<void>}
 */
const loadPuzzleFromUrl = async (puzzleUrl) => {
  const { puzzle } = await fetchPuzzleFromUrl(puzzleUrl);

  const boardState = createStateFromPuzzle(puzzle.puzzle);
  closeLoadModal();
  loadGame(puzzle, boardState);
  setAppQuery(buildPuzzleQueryString({ puzzleUrl }));
};

/**
 * Loads a random puzzle and updates the URL.
 * Used by the "New Puzzle" button to always get a different puzzle.
 * Clears any board hash to start fresh.
 * @returns {Promise<void>}
 */
const loadRandomPuzzle = async () => {
  let failedPuzzleName = extractPuzzleId("");
  try {
    const puzzle = await getRandomPuzzle(currentPuzzleFilename || null);
    failedPuzzleName = extractPuzzleId(puzzle.filename);
    loadFetchedPuzzle(puzzle);
  } catch (error) {
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
 * Gets the current highlight feature list.
 * @returns {string[]} Current highlight features
 */
const getHighlightFeatures = () => {
  return currentOptions.highlightFeatures;
};

/**
 * Applies new highlight features, updates game state, and persists options.
 * @param {string[]} features - Highlight features to apply
 */
const applyHighlightFeatures = (features) => {
  if (!currentState) {
    return;
  }
  currentOptions = updateOption(
    currentOptions,
    "highlightFeatures",
    normalizeHighlightFeatures(features),
  );
  saveOptions(currentOptions);
  updateState(currentState);
};

/**
 * Applies one of the built-in highlight presets.
 * @param {string} preset - Preset key in STYLE_CONFIGS
 * @returns {string[]} Applied features
 */
const applyHighlightPreset = (preset) => {
  const features = getStyleConfigFeatures(preset);
  applyHighlightFeatures(features);
  return [...features];
};

/**
 * Initializes the game and sets up event listeners.
 * @returns {Promise<void>}
 */
const init = async () => {
  currentOptions = loadOptions();
  initTheme();
  renderVersion();

  configureDomEventHandlers({
    getState: getCurrentState,
    applyState: updateState,
    setStatus,
    loadRandomPuzzle,
    loadPuzzleByFilename,
    loadNewGame,
    applyBoardStateFromHash,
  });

  configureLoadModal({
    listPuzzles: getPuzzleIndex,
    loadPuzzleByFilename,
  });

  configureUrlLoadModal({
    loadPuzzleFromUrl,
  });

  configureOptionsModal({
    applyTheme,
    getHighlightFeatures,
    applyHighlightFeatures,
    applyHighlightPreset,
  });

  document.getElementById("load-url-btn").addEventListener("click", () => {
    closeLoadModal();
    openUrlLoadModal();
  });
  document
    .getElementById("url-load-confirm-btn")
    .addEventListener("click", onUrlLoadConfirmClick);
  document
    .getElementById("url-load-cancel-btn")
    .addEventListener("click", onUrlLoadCancelClick);
  document
    .getElementById("url-load-input")
    .addEventListener("input", onUrlLoadInput);

  document.getElementById("new-btn").addEventListener("click", onNewGameClick);
  document
    .getElementById("load-btn")
    .addEventListener("click", onLoadGameClick);
  document
    .getElementById("load-cancel-btn")
    .addEventListener("click", onLoadModalCancelClick);
  document
    .getElementById("load-select-btn")
    .addEventListener("click", onLoadModalSelectClick);
  document
    .getElementById("load-filter-input")
    .addEventListener("input", onLoadModalFilterInput);
  document
    .getElementById("load-puzzle-table-body")
    .addEventListener("click", onLoadModalTableClick);
  document
    .getElementById("load-puzzle-table-body")
    .addEventListener("dblclick", onLoadModalTableDblClick);
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
    .getElementById("options-btn")
    .addEventListener("click", onOptionsClick);
  document
    .getElementById("options-close-btn")
    .addEventListener("click", onOptionsCloseClick);
  document
    .getElementById("options-theme-select")
    .addEventListener("change", onOptionsThemeChange);
  document
    .getElementById("options-highlight-features")
    .addEventListener("change", onOptionsHighlightFeatureChange);
  document
    .getElementById("options-highlight-presets")
    .addEventListener("click", onOptionsPresetClick);

  document.querySelectorAll(".num-btn").forEach((btn) => {
    btn.addEventListener("click", onNumberButtonClick);
  });

  document
    .getElementById("confirm-yes-btn")
    .addEventListener("click", onConfirmYesClick);
  document
    .getElementById("confirm-no-btn")
    .addEventListener("click", onConfirmNoClick);

  window.addEventListener("popstate", onPopState);
  window.addEventListener("hashchange", onHashChange);
  window.addEventListener("keydown", onUrlLoadModalKeydown);
  window.addEventListener("keydown", onLoadModalKeydown);
  window.addEventListener("keydown", onConfirmModalKeydown);
  window.addEventListener("keydown", onOptionsModalKeydown);

  await loadNewGame();
  updateState(currentState);
};

init().catch((error) => {
  console.error("Failed to initialize game:", error);
});
