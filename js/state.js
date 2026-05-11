/**
 * Creates initial game state for a given puzzle string.
 * @param {string} puzzleStr - 81-digit puzzle string
 * @returns {Object} Initial state object
 */
const createStateFromPuzzle = (puzzleStr) => {
  const board = puzzleStr.split("").map(Number);
  const given = board.map((digit) => digit !== 0);
  return {
    puzzle: [...board],
    board,
    given,
    selected: -1,
    status: "",
    statusType: "",
    hinting: false,
  };
};

/**
 * Creates initial game state from a manually-entered board string.
 * All non-zero digits are treated as given cells.
 * Semantically identical to createStateFromPuzzle; named separately for clarity.
 * @param {string} boardStr - 81-digit board string (0 = empty, 1-9 = given)
 * @returns {Object} Initial state object
 */
const createStateFromBoard = (boardStr) => createStateFromPuzzle(boardStr);

/**
 * Creates a new state with a cell selected.
 * @param {Object} state - Current state
 * @param {number} cellIndex - Cell to select
 * @returns {Object} New state with selected cell
 */
const selectCell = (state, cellIndex) => {
  return {
    ...state,
    selected: cellIndex,
  };
};

/**
 * Checks if two cells are in the same 3x3 box.
 * @param {number} cellIdx1 - First cell index (0-80)
 * @param {number} cellIdx2 - Second cell index (0-80)
 * @returns {boolean} True if cells are in the same box
 */
const isInBox = (cellIdx1, cellIdx2) => {
  const row1 = Math.floor(cellIdx1 / GRID_SIZE);
  const col1 = cellIdx1 % GRID_SIZE;
  const row2 = Math.floor(cellIdx2 / GRID_SIZE);
  const col2 = cellIdx2 % GRID_SIZE;
  return (
    Math.floor(row1 / BOX_SIZE) === Math.floor(row2 / BOX_SIZE) &&
    Math.floor(col1 / BOX_SIZE) === Math.floor(col2 / BOX_SIZE)
  );
};

/**
 * Gets the highlight style for a specific cell using the styler module.
 * Pure function: can be tested independently.
 * Accesses given array from state to apply fixed cell styling.
 * @param {number} cellIndex - Cell index (0-80)
 * @param {number} selectedIndex - Selected cell index (-1 if none)
 * @param {number[]} boardState - Current board state
 * @param {Set<number>} relatedCells - Set of related cells to selected (unused; included for backwards compatibility)
 * @param {string} highlightMode - Highlight mode
 * @param {boolean[]} given - Array indicating which cells are fixed
 * @returns {string|null} CSS class name or null
 */
const getCellHighlightClass = (
  cellIndex,
  selectedIndex,
  boardState,
  relatedCells,
  highlightMode = "related-block",
  given = null,
) => {
  const features = getStyleConfigFeatures(highlightMode);
  const styles = buildStyles(boardState, selectedIndex, features, given);
  return styles[cellIndex];
};

/**
 * Clears a cell value from the board.
 * @param {Object} state - Current state
 * @param {number} cellIndex - Cell position (0-80)
 * @returns {Object} New state with cell cleared
 */
const clearCellValue = (state, cellIndex) => {
  return placeNumber(state, cellIndex, 0);
};

/**
 * Moves selection by offset (arrow key navigation).
 * @param {Object} state - Current state
 * @param {number} offset - Cell offset from arrow key
 * @returns {Object|null} New state or null if out of bounds
 */
const moveSelection = (state, offset) => {
  const nextCell = state.selected + offset;
  if (nextCell < 0 || nextCell >= TOTAL_CELLS) {
    return null;
  }
  return selectCell(state, nextCell);
};

/**
 * Creates a new state with a number placed at a cell.
 * @param {Object} state - Current state
 * @param {number} cellIndex - Cell position (0-80)
 * @param {number} num - Number to place (0-9)
 * @returns {Object} New state with number placed
 */
const placeNumber = (state, cellIndex, num) => {
  if (state.given[cellIndex]) {
    return state;
  }
  const newBoard = [...state.board];
  newBoard[cellIndex] = num;
  return {
    ...state,
    board: newBoard,
    status: "",
    statusType: "",
    hinting: false,
  };
};

/**
 * Creates a new state with board solved.
 * Solves the puzzle fresh from state.puzzle (immutably).
 * @param {Object} state - Current state
 * @returns {Object} New state with board filled with solution, or unsolveable status
 */
const solveBoard = (state) => {
  const solution = solve([...state.puzzle]);

  if (!solution) {
    return {
      ...state,
      selected: -1,
      status: "Puzzle is unsolveable",
      statusType: "error",
    };
  }

  const solvedState = {
    ...state,
    board: solution,
    selected: -1,
    status: "Puzzle solved!",
    statusType: "win",
  };
  return solvedState;
};

/**
 * Checks whether the current board has any duplicate conflicts.
 * @param {number[]} board - Board state to validate
 * @returns {boolean} True when a duplicate exists in row/col/box
 */
const hasBoardConflicts = (board) => {
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (board[i] === 0) {
      continue;
    }

    const related = getRelated(i);
    for (const relatedIndex of related) {
      if (relatedIndex === i) {
        continue;
      }
      if (board[relatedIndex] === board[i]) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Checks whether the current board entries are still solveable.
 * @param {Object} state - Current state
 * @param {boolean} showErrors - If true, mark incorrect cells
 * @returns {Object} New state with status based on consistency/solveability
 */
const checkSolution = (state, showErrors) => {
  if (hasBoardConflicts(state.board)) {
    if (!showErrors) {
      return state;
    }
    return {
      ...state,
      status: "Some cells are incorrect",
      statusType: "error",
    };
  }

  const solution = solve([...state.board]);
  if (!solution) {
    if (!showErrors) {
      return state;
    }
    return {
      ...state,
      status: "Some cells are incorrect",
      statusType: "error",
    };
  }

  const isComplete = state.board.every((digit) => digit !== 0);
  if (isComplete) {
    return {
      ...state,
      status: "Puzzle solved!",
      statusType: "win",
    };
  }

  if (!showErrors) {
    return state;
  }

  return {
    ...state,
    status: "All values are correct",
    statusType: "win",
  };
};

/**
 * Creates a new state with hint mode active, showing incorrect cells.
 * @param {Object} state - Current state
 * @returns {Object} New state with hinting enabled and error status if applicable
 */
const hintBoard = (state) => {
  return { ...checkSolution(state, true), hinting: true };
};

/**
 * Gets indices of user-entered cells that do not match the puzzle solution.
 * Used by Hint/Check when an error state is shown.
 * @param {Object} state - Current state
 * @returns {number[]} Array of incorrect user-entered cell indices
 */
const getHintCells = (state) => {
  const solution = solve([...state.puzzle]);
  if (!solution) {
    return getWrongCells(state);
  }

  const wrong = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (state.given[i] || state.board[i] === 0) {
      continue;
    }
    if (state.board[i] !== solution[i]) {
      wrong.push(i);
    }
  }
  return wrong;
};

/**
 * Gets indices of user-entered cells that violate Sudoku constraints.
 * A cell is wrong when it duplicates the same digit in its row, column, or box.
 * @param {Object} state - Current state
 * @returns {number[]} Array of invalid cell indices
 */
const getWrongCells = (state) => {
  const wrong = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (state.given[i] || state.board[i] === 0) {
      continue;
    }

    const value = state.board[i];
    const related = getRelated(i);
    let hasConflict = false;

    for (const relatedIndex of related) {
      if (relatedIndex === i) {
        continue;
      }
      if (state.board[relatedIndex] === value) {
        hasConflict = true;
        break;
      }
    }

    if (hasConflict) {
      wrong.push(i);
    }
  }
  return wrong;
};

/**
 * Encodes an 81-character Sudoku string into a 45-character URL-safe string.
 * @param {string} board - 81 digits (0-9).
 * @returns {string} 45-character compact string.
 */
const compressBoard = (board) => {
  // Treat the 81 digits as one massive BigInt
  let val = BigInt(board);
  let result = "";

  // log64(10^81) ≈ 44.8, so 45 characters is the minimum possible
  for (let i = 0; i < 45; i++) {
    result = ENCODING_CHARS[Number(val % 64n)] + result;
    val /= 64n;
  }
  return result;
};

/**
 * Decodes the 45-character string back into the original 81-character board.
 * @param {string} compact - 45-character string.
 * @returns {string} 81-character board string.
 */
const decompressBoard = (compact) => {
  let val = 0n;
  for (let char of compact) {
    val = val * 64n + BigInt(ENCODING_CHARS.indexOf(char));
  }

  // Restore as string, padding with leading zeros to maintain 81 chars
  return val.toString().padStart(81, "0");
};

/**
 * Places a number at the selected cell and auto-checks if the board is complete.
 * @param {Object} state - Current state
 * @param {number} num - Number to place (1-9)
 * @returns {Object} New state with number placed; win/error status if board is full
 */
const applyNumber = (state, num) => {
  const next = placeNumber(state, state.selected, num);
  if (next.board.every((d) => d !== 0)) {
    return checkSolution(next, false);
  }
  return next;
};

/**
 * Encodes the board to a hash string (81 characters, one digit per cell).
 * @param {number[]} board - Board array with 81 elements
 * @returns {string} Encoded board string
 */
const encodeBoard = (board) => {
  return compressBoard(board.map((digit) => digit.toString()).join(""));
};

/**
 * Decodes an encoded board string into a board array.
 * @param {string} encodedBoard - 81-character digit string
 * @returns {number[]|null} Board array or null if invalid
 */
const decodeBoard = (encodedBoard) => {
  if (!encodedBoard) {
    return null;
  }
  const decoded = decompressBoard(encodedBoard);
  if (!decoded || decoded.length !== TOTAL_CELLS || !/^\d+$/.test(decoded)) {
    return null;
  }
  return decoded.split("").map((char) => parseInt(char, 10));
};

/**
 * Applies a decoded board onto state while preserving immutable given cells.
 * Given cells are always restored from the original puzzle digits.
 * @param {Object} state - Current puzzle state
 * @param {number[]|null} decodedBoard - Decoded board array from URL hash
 * @returns {Object} New state with merged board, or original state when invalid
 */
const applyDecodedBoard = (state, decodedBoard) => {
  if (!state || !decodedBoard || decodedBoard.length !== TOTAL_CELLS) {
    return state;
  }

  const mergedBoard = decodedBoard.map((digit, index) => {
    if (state.given[index]) {
      return state.puzzle[index];
    }
    return digit;
  });

  return {
    ...state,
    board: mergedBoard,
  };
};
