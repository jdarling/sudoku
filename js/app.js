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
 * Whether the device uses a coarse pointer (touch/mobile).
 * Computed once at module load; used to set readOnly on cells and skip focus.
 * @type {boolean}
 */
const coarsePointer = isCoarsePointerDevice();

/**
 * Module-level active puzzle name for status messaging.
 * @type {string}
 */
let currentPuzzleName = "";
let currentPuzzleFilename = "";
let lastStatusType = "";
let currentScorecard = null;

/**
 * Derives puzzle id used for scorecard tracking.
 * @param {Object} puzzle - Loaded puzzle metadata
 * @returns {string} Scorecard puzzle id
 */
const getScorecardPuzzleId = (puzzle) => {
  if (!puzzle) {
    return "unknown";
  }

  if (puzzle.filename) {
    const canonicalId = puzzle.filename
      .split("/")
      .pop()
      .replace(/\.yaml$/, "");
    return canonicalId || "unknown";
  }

  if (puzzle.name && puzzle.name.trim()) {
    return puzzle.name.trim();
  }

  return "unknown";
};

/**
 * Returns true when board values changed between states.
 * @param {Object|null} previousState - Previous game state
 * @param {Object|null} nextState - Next game state
 * @returns {boolean} True when any board value changed
 */
const didBoardChange = (previousState, nextState) => {
  if (!previousState || !nextState) {
    return false;
  }

  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (previousState.board[i] !== nextState.board[i]) {
      return true;
    }
  }

  return false;
};

/**
 * Returns true when selected-cell immediate error is visible for state.
 * @param {Object|null} state - Current game state
 * @returns {boolean} True when immediate conflict highlight should show
 */
const isImmediateErrorVisible = (state) => {
  if (!state || state.selected < 0) {
    return false;
  }

  if (state.given[state.selected] || state.board[state.selected] === 0) {
    return false;
  }

  const selectedValue = state.board[state.selected];
  const relatedCells = getRelated(state.selected);
  for (const relatedIndex of relatedCells) {
    if (relatedIndex === state.selected) {
      continue;
    }
    if (state.board[relatedIndex] === selectedValue) {
      return true;
    }
  }

  return false;
};

/**
 * Returns true when error-cell highlights are visible for state.
 * @param {Object|null} state - Current game state
 * @param {string[]} highlightFeatures - Active feature list
 * @returns {boolean} True when error-cell highlights are visible
 */
const isErrorCellVisible = (state, highlightFeatures) => {
  if (!state) {
    return false;
  }

  const usesErrorCells =
    state.hinting || (highlightFeatures || []).includes("error cells");
  if (!usesErrorCells) {
    return false;
  }

  return getHintCells(state).length > 0;
};

/**
 * Creates a fresh scorecard for a board run.
 * @param {Object} puzzle - Loaded puzzle metadata
 * @param {Object} boardState - Initial board state for run
 * @returns {void}
 */
const startScorecardRun = (puzzle, boardState) => {
  const puzzleId = getScorecardPuzzleId(puzzle);
  const startingBoardDigits = boardState.puzzle.join("");
  currentScorecard = createInitialScorecard({
    highlightFeatures: currentOptions.highlightFeatures,
    puzzleId,
    startingBoardDigits,
    startedAt: new Date().toISOString(),
  });
};

/**
 * Applies scorecard metric updates for one state transition.
 * @param {Object|null} previousState - Previous game state
 * @param {Object} nextState - Next game state
 * @param {Object|null} actionMeta - Action metadata from DOM handlers
 * @returns {void}
 */
const trackScorecardTransition = (previousState, nextState, actionMeta) => {
  if (!currentScorecard) {
    return;
  }

  const nowIso = new Date().toISOString();
  const highlightFeatures = currentOptions.highlightFeatures || [];

  if (
    actionMeta &&
    actionMeta.kind === "move" &&
    didBoardChange(previousState, nextState)
  ) {
    const showedImmediateBefore = highlightFeatures.includes("immediate errors")
      ? isImmediateErrorVisible(previousState)
      : false;
    const showsImmediateNow = highlightFeatures.includes("immediate errors")
      ? isImmediateErrorVisible(nextState)
      : false;

    currentScorecard = recordMove(currentScorecard, {
      isClear: Boolean(actionMeta.isClear),
      nowIso,
    });

    if (!showedImmediateBefore && showsImmediateNow) {
      currentScorecard = recordErrorShown(currentScorecard, "immediate");
    }
  }

  if (actionMeta && actionMeta.kind === "check") {
    const showedErrorCellsBefore = isErrorCellVisible(
      previousState,
      highlightFeatures,
    );
    const showsErrorCellsNow = isErrorCellVisible(nextState, highlightFeatures);
    currentScorecard = recordCheckClick(currentScorecard);
    if (!showedErrorCellsBefore && showsErrorCellsNow) {
      currentScorecard = recordErrorShown(currentScorecard, "error-cell");
    }
  }

  if (actionMeta && actionMeta.kind === "hint") {
    const showedErrorCellsBefore = isErrorCellVisible(
      previousState,
      highlightFeatures,
    );
    const showsErrorCellsNow = isErrorCellVisible(nextState, highlightFeatures);
    currentScorecard = recordHintClick(currentScorecard);
    if (!showedErrorCellsBefore && showsErrorCellsNow) {
      currentScorecard = recordErrorShown(currentScorecard, "error-cell");
    }
  }

  if (actionMeta && actionMeta.kind === "solve") {
    currentScorecard = mutateScorecard(currentScorecard, {
      isDisqualified: true,
      disqualifyReason: "solve-used",
    });
    currentScorecard = finalizeScorecard(currentScorecard, nowIso);
    return;
  }

  const solvedNow =
    nextState.statusType === "win" && nextState.status === "Puzzle solved!";
  if (solvedNow) {
    currentScorecard = finalizeScorecard(currentScorecard, nowIso);
  }
};

/**
 * Sets the active puzzle display name from loaded metadata.
 * @param {Object} puzzle - Loaded puzzle object
 * @returns {void}
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
 * @param {Object|null} actionMeta - Action metadata from DOM handlers
 * @returns {void}
 */
const updateState = (newState, actionMeta = null) => {
  const previousState = currentState;
  trackScorecardTransition(previousState, newState, actionMeta);
  currentState = newState;
  renderGrid(
    currentState,
    currentOptions.highlightFeatures,
    coarsePointer,
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
    focusCell(currentState.selected, coarsePointer);
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
 * @returns {void}
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
 * @returns {void}
 */
const loadGame = (puzzle, boardState) => {
  currentState = boardState;
  currentPuzzleFilename = puzzle && puzzle.filename ? puzzle.filename : "";
  setCurrentPuzzleName(puzzle);
  startScorecardRun(puzzle, boardState);
  renderGrid(
    currentState,
    currentOptions.highlightFeatures,
    coarsePointer,
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
 * @returns {void}
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
 * @returns {void}
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
  const incomingBoard = getBoardFromQuery();

  if (incomingUrl) {
    try {
      await loadPuzzleFromUrl(incomingUrl);
    } catch (error) {
      showUnknownPuzzleFallback(incomingUrl);
    }
    return;
  }

  if (incomingBoard) {
    const parsed = parseBoardInput(incomingBoard);
    const validationError = parsed
      ? validateBoardInput(parsed)
      : "Invalid board.";
    if (validationError) {
      showUnknownPuzzleFallback(incomingBoard);
      return;
    }
    let boardState = createStateFromBoard(parsed);
    const boardHash = getBoardFromHash();
    if (boardHash) {
      const decodedBoard = decodeBoard(boardHash);
      boardState = applyDecodedBoard(boardState, decodedBoard);
    }
    loadPuzzleFromBoard(parsed, boardState, false);
    return;
  }

  if (incomingToken) {
    try {
      const indexEntries = await getPuzzleIndex();
      const { exactMatch, filtered } = findPuzzleMatches(
        incomingToken,
        indexEntries,
      );

      if (!exactMatch) {
        const selectedFilename = await openLoadModalForSelection(incomingToken);
        if (!selectedFilename) {
          showUnknownPuzzleFallback(incomingToken);
          return;
        }
        await loadPuzzleByFilename(selectedFilename);
        return;
      }

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
 * Loads a puzzle from a manually-entered 81-char board string.
 * All non-zero digits are treated as givens. No file, no index entry.
 * URL is set to ?board=<boardStr> for shareability.
 * @param {string} boardStr - Validated 81-char digit string
 * @param {Object|null} restoredState - Optional board state that already includes restored progress
 * @param {boolean} clearHashOnLoad - Whether to clear board hash after load
 * @returns {void}
 */
const loadPuzzleFromBoard = (
  boardStr,
  restoredState = null,
  clearHashOnLoad = true,
) => {
  const boardState = restoredState || createStateFromBoard(boardStr);
  const puzzle = {
    filename: null,
    name: "Custom Board",
    author: "",
    difficulty: "",
    puzzle: boardStr,
  };
  closeLoadModal();
  loadGame(puzzle, boardState);
  setAppQuery(buildPuzzleQueryString({ board: boardStr }));
  if (clearHashOnLoad) {
    clearBoardHash();
  }
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
 * Clears the current board, resetting all user entries to givens only.
 * Deselects any cell and updates status.
 * @returns {void}
 */
const clearBoard = () => {
  if (!currentState) {
    return;
  }
  updateState(resetBoardToGivens(currentState));
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
 * @returns {void}
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
  if (currentScorecard) {
    currentScorecard = recordSupportChecksChange(
      currentScorecard,
      currentOptions.highlightFeatures,
      new Date().toISOString(),
    );
  }
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

  configureBoardEntryModal({
    loadPuzzleFromBoard,
  });

  initNewGameDecisionModal({
    clearBoard,
    loadRandomPuzzle,
  });

  initOptionsModal({
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

  document.getElementById("load-board-btn").addEventListener("click", () => {
    closeLoadModal();
    openBoardEntryModal();
  });
  document
    .getElementById("board-entry-confirm-btn")
    .addEventListener("click", onBoardEntryConfirmClick);
  document
    .getElementById("board-entry-cancel-btn")
    .addEventListener("click", onBoardEntryCancelClick);
  document
    .getElementById("board-entry-input")
    .addEventListener("input", onBoardEntryInput);

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
    .addEventListener("click", onOptionsPresetButtonClick);

  document.querySelectorAll(".num-btn").forEach((btn) => {
    btn.addEventListener("click", onNumberButtonClick);
  });

  window.addEventListener("popstate", onPopState);
  window.addEventListener("hashchange", onHashChange);
  window.addEventListener("keydown", onUrlLoadModalKeydown);
  window.addEventListener("keydown", onBoardEntryModalKeydown);
  window.addEventListener("keydown", onLoadModalKeydown);
  window.addEventListener("keydown", onDecisionModalKeydown);
  window.addEventListener("keydown", onOptionsModalKeydown);

  await loadNewGame();
};

init().catch((error) => {
  console.error("Failed to initialize game:", error);
});
