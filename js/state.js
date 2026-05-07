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
  };
};

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
  console.log("Board solved:", solvedState);
  return solvedState;
};

/**
 * Checks if board is completely solved and returns state with status.
 * Solves the puzzle fresh from state.puzzle (immutably) to compare.
 * @param {Object} state - Current state
 * @param {boolean} showErrors - If true, mark incorrect cells
 * @returns {Object} New state with win status or error status
 */
const checkSolution = (state, showErrors) => {
  const solution = solve([...state.puzzle]);
  if (!solution) {
    return {
      ...state,
      status: "Puzzle is unsolveable",
      statusType: "error",
    };
  }
  const allCorrect = state.board.every((digit, i) => digit === solution[i]);

  if (allCorrect) {
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
    status: "Some cells are incorrect",
    statusType: "error",
  };
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
 * Encodes the board to a hash string (81 characters, one digit per cell).
 * @param {number[]} board - Board array with 81 elements
 * @returns {string} Encoded board string
 */
const encodeBoard = (board) => {
  return compressBoard(board.map((digit) => digit.toString()).join(""));
};

/**
 * Decodes a hash string to a board array, preserving given cells.
 * @param {string} encodedBoard - Encoded board string (81 characters)
 * @param {boolean[]} givenCells - Array indicating which cells are given (immutable)
 * @param {number[]} originalBoard - Original puzzle board to restore given cells from
 * @returns {number[]} Decoded board array, with given cells restored from original puzzle
 */
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
