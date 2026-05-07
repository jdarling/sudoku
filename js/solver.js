/**
 * Converts row and column to board array index.
 * @param {number} row - Row (0-8)
 * @param {number} col - Column (0-8)
 * @returns {number} Board index (0-80)
 */
const idx = (row, col) => {
  return row * GRID_SIZE + col;
};

/**
 * Checks if a number is valid at a given position on the board.
 * @param {number[]} boardState - Current board state
 * @param {number} pos - Cell position (0-80)
 * @param {number} num - Number to validate (1-9)
 * @returns {boolean} True if placement is valid
 */
const isValid = (boardState, pos, num) => {
  const row = Math.floor(pos / GRID_SIZE);
  const col = pos % GRID_SIZE;

  for (let i = 0; i < GRID_SIZE; i++) {
    if (boardState[idx(row, i)] === num) {
      return false;
    }
    if (boardState[idx(i, col)] === num) {
      return false;
    }
    const boxRow =
      BOX_SIZE * Math.floor(row / BOX_SIZE) + Math.floor(i / BOX_SIZE);
    const boxCol = BOX_SIZE * Math.floor(col / BOX_SIZE) + (i % BOX_SIZE);
    if (boardState[idx(boxRow, boxCol)] === num) {
      return false;
    }
  }

  return true;
};

/**
 * Recursively solves the sudoku puzzle using backtracking.
 * Returns new solved board or null if unsolveable (immutable).
 * @param {number[]} boardState - Board state to solve (not mutated)
 * @returns {number[]|null} Solved board if solveable, null if unsolveable
 */
const solve = (boardState) => {
  const emptyCell = boardState.indexOf(0);
  if (emptyCell === -1) {
    return boardState;
  }

  for (let num = 1; num <= GRID_SIZE; num++) {
    if (!isValid(boardState, emptyCell, num)) {
      continue;
    }
    const newBoard = [...boardState];
    newBoard[emptyCell] = num;
    const result = solve(newBoard);
    if (result !== null) {
      return result;
    }
  }

  return null;
};

/**
 * Gets all cells related to a given position (same row, column, or box).
 * @param {number} pos - Cell position (0-80)
 * @returns {Set<number>} Set of related cell indices
 */
const getRelated = (pos) => {
  const row = Math.floor(pos / GRID_SIZE);
  const col = pos % GRID_SIZE;
  const related = new Set();

  for (let i = 0; i < GRID_SIZE; i++) {
    related.add(idx(row, i));
    related.add(idx(i, col));
  }

  const boxRow = BOX_SIZE * Math.floor(row / BOX_SIZE);
  const boxCol = BOX_SIZE * Math.floor(col / BOX_SIZE);
  for (let dr = 0; dr < BOX_SIZE; dr++) {
    for (let dc = 0; dc < BOX_SIZE; dc++) {
      related.add(idx(boxRow + dr, boxCol + dc));
    }
  }

  return related;
};
