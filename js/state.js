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
    given: solution.map(() => true),
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
 * Encodes the board to a hash string (81 characters, one digit per cell).
 * @param {number[]} board - Board array with 81 elements
 * @returns {string} Encoded board string
 */
const encodeBoard = (board) => {
  return board.map((digit) => digit.toString()).join("");
};

/**
 * Decodes a hash string to a board array, preserving given cells.
 * @param {string} encodedBoard - Encoded board string (81 characters)
 * @param {boolean[]} givenCells - Array indicating which cells are given (immutable)
 * @param {number[]} originalBoard - Original puzzle board to restore given cells from
 * @returns {number[]} Decoded board array, with given cells restored from original puzzle
 */
const decodeBoard = (encodedBoard, givenCells, originalBoard) => {
  if (!encodedBoard || encodedBoard.length !== TOTAL_CELLS) {
    return null;
  }
  const board = encodedBoard.split("").map((char) => {
    const num = parseInt(char, 10);
    return Number.isNaN(num) ? 0 : num;
  });

  // Restore given cells to their original puzzle values
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (givenCells[i]) {
      board[i] = originalBoard[i];
    }
  }

  return board;
};
