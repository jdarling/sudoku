/**
 * Creates initial game state for a given puzzle string.
 * @param {string} puzzleStr - 81-digit puzzle string
 * @returns {Object} Initial state object
 */
const createStateFromPuzzle = (puzzleStr) => {
  const board = puzzleStr.split('').map(Number);
  const given = board.map((digit) => digit !== 0);
  const solution = [...board];
  solve(solution);
  return {
    board,
    given,
    solution,
    selected: -1,
    status: '',
    statusType: '',
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
    status: '',
    statusType: '',
  };
};

/**
 * Creates a new state with board solved.
 * @param {Object} state - Current state
 * @returns {Object} New state with board set to solution
 */
const solveBoard = (state) => {
  return {
    ...state,
    board: [...state.solution],
    given: state.solution.map(() => true),
    selected: -1,
    status: 'Puzzle solved!',
    statusType: 'win',
  };
};

/**
 * Checks if board is completely solved and returns state with status.
 * @param {Object} state - Current state
 * @param {boolean} showErrors - If true, mark incorrect cells
 * @returns {Object} New state with win status or error status
 */
const checkSolution = (state, showErrors) => {
  const allCorrect = state.board.every(
    (digit, i) => digit === state.solution[i],
  );

  if (allCorrect) {
    return {
      ...state,
      status: 'Puzzle solved!',
      statusType: 'win',
    };
  }

  if (!showErrors) {
    return state;
  }

  return {
    ...state,
    status: 'Some cells are incorrect',
    statusType: 'error',
  };
};

/**
 * Gets indices of incorrectly filled cells.
 * @param {Object} state - Current state
 * @returns {number[]} Array of cell indices with incorrect values
 */
const getWrongCells = (state) => {
  const wrong = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (
      !state.given[i] &&
      state.board[i] !== 0 &&
      state.board[i] !== state.solution[i]
    ) {
      wrong.push(i);
    }
  }
  return wrong;
};
