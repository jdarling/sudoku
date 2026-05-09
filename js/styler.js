/**
 * Cell styling engine for sudoku.
 * Provides pure functions to build styles for an 81-cell grid.
 * Styles are applied in order; later applications override earlier ones.
 */

/**
 * Gets all cells containing the same number as a given cell.
 * @param {number[]} boardState - Current board state
 * @param {number} cellIndex - Cell index (0-80)
 * @returns {Set<number>} Set of cell indices with the same number
 */
const getCellsWithSameNumber = (boardState, cellIndex) => {
  if (cellIndex < 0 || cellIndex >= boardState.length) {
    return new Set();
  }
  const num = boardState[cellIndex];
  if (num === 0) {
    return new Set();
  }
  const cells = new Set();
  for (let i = 0; i < boardState.length; i++) {
    if (boardState[i] === num) {
      cells.add(i);
    }
  }
  return cells;
};

/**
 * Applies a style to a single cell in the styles array.
 * @param {(string|null)[]} styles - Array of styles (one per cell)
 * @param {number} cellIndex - Cell to style (0-80)
 * @param {string|null} style - Style to apply
 */
const styleCell = (styles, cellIndex, style) => {
  if (cellIndex >= 0 && cellIndex < styles.length) {
    styles[cellIndex] = style;
  }
};

/**
 * Applies a style to all cells in a row.
 * @param {(string|null)[]} styles - Array of styles (one per cell)
 * @param {number} rowIndex - Row (0-8)
 * @param {string|null} style - Style to apply
 */
const styleRow = (styles, rowIndex, style) => {
  for (let col = 0; col < GRID_SIZE; col++) {
    styleCell(styles, rowIndex * GRID_SIZE + col, style);
  }
};

/**
 * Applies a style to all cells in a column.
 * @param {(string|null)[]} styles - Array of styles (one per cell)
 * @param {number} colIndex - Column (0-8)
 * @param {string|null} style - Style to apply
 */
const styleCol = (styles, colIndex, style) => {
  for (let row = 0; row < GRID_SIZE; row++) {
    styleCell(styles, row * GRID_SIZE + colIndex, style);
  }
};

/**
 * Applies a style to all cells in a 3x3 block.
 * @param {(string|null)[]} styles - Array of styles (one per cell)
 * @param {number} cellIndex - Any cell in the block (0-80)
 * @param {string|null} style - Style to apply
 */
const styleBlock = (styles, cellIndex, style) => {
  const row = Math.floor(cellIndex / GRID_SIZE);
  const col = cellIndex % GRID_SIZE;
  const blockRow = BOX_SIZE * Math.floor(row / BOX_SIZE);
  const blockCol = BOX_SIZE * Math.floor(col / BOX_SIZE);
  for (let dr = 0; dr < BOX_SIZE; dr++) {
    for (let dc = 0; dc < BOX_SIZE; dc++) {
      styleCell(styles, (blockRow + dr) * GRID_SIZE + (blockCol + dc), style);
    }
  }
};

/**
 * Style rows of cells that contain the same value as the selected cell.
 * @param {(string|null)[]} styles - Styles array to modify
 * @param {number[]} boardState - Current board state
 * @param {number} selectedIndex - Selected cell index
 * @param {boolean[]} given - Fixed cells array
 */
const styleSameValueRows = (styles, boardState, selectedIndex, given) => {
  if (selectedIndex < 0) {
    return;
  }
  const sameValueCells = getCellsWithSameNumber(boardState, selectedIndex);
  for (const cell of sameValueCells) {
    const cellRow = Math.floor(cell / GRID_SIZE);
    styleRow(styles, cellRow, 'related-line-subtle');
  }
};

/**
 * Style columns of cells that contain the same value as the selected cell.
 * @param {(string|null)[]} styles - Styles array to modify
 * @param {number[]} boardState - Current board state
 * @param {number} selectedIndex - Selected cell index
 * @param {boolean[]} given - Fixed cells array
 */
const styleSameValueCols = (styles, boardState, selectedIndex, given) => {
  if (selectedIndex < 0) {
    return;
  }
  const sameValueCells = getCellsWithSameNumber(boardState, selectedIndex);
  for (const cell of sameValueCells) {
    const cellCol = cell % GRID_SIZE;
    styleCol(styles, cellCol, 'related-line-subtle');
  }
};

/**
 * Style blocks of cells that contain the same value as the selected cell.
 * @param {(string|null)[]} styles - Styles array to modify
 * @param {number[]} boardState - Current board state
 * @param {number} selectedIndex - Selected cell index
 * @param {boolean[]} given - Fixed cells array
 */
const styleSameValueBlocks = (styles, boardState, selectedIndex, given) => {
  if (selectedIndex < 0) {
    return;
  }
  const sameValueCells = getCellsWithSameNumber(boardState, selectedIndex);
  for (const cell of sameValueCells) {
    styleBlock(styles, cell, 'related-line-subtle');
  }
};

/**
 * Style all cells containing the same value as the selected cell.
 * @param {(string|null)[]} styles - Styles array to modify
 * @param {number[]} boardState - Current board state
 * @param {number} selectedIndex - Selected cell index
 * @param {boolean[]} given - Fixed cells array
 */
const styleSameValueCells = (styles, boardState, selectedIndex, given) => {
  if (selectedIndex < 0) {
    return;
  }
  const sameValueCells = getCellsWithSameNumber(boardState, selectedIndex);
  for (const cell of sameValueCells) {
    styleCell(styles, cell, 'same-num');
  }
};

/**
 * Style the row of the selected cell.
 * @param {(string|null)[]} styles - Styles array to modify
 * @param {number[]} boardState - Current board state
 * @param {number} selectedIndex - Selected cell index
 * @param {boolean[]} given - Fixed cells array
 */
const styleSelectedRow = (styles, boardState, selectedIndex, given) => {
  if (selectedIndex < 0) {
    return;
  }
  const selectedRow = Math.floor(selectedIndex / GRID_SIZE);
  styleRow(styles, selectedRow, 'related-line');
};

/**
 * Style the column of the selected cell.
 * @param {(string|null)[]} styles - Styles array to modify
 * @param {number[]} boardState - Current board state
 * @param {number} selectedIndex - Selected cell index
 * @param {boolean[]} given - Fixed cells array
 */
const styleSelectedCol = (styles, boardState, selectedIndex, given) => {
  if (selectedIndex < 0) {
    return;
  }
  const selectedCol = selectedIndex % GRID_SIZE;
  styleCol(styles, selectedCol, 'related-line');
};

/**
 * Style the block of the selected cell.
 * @param {(string|null)[]} styles - Styles array to modify
 * @param {number[]} boardState - Current board state
 * @param {number} selectedIndex - Selected cell index
 * @param {boolean[]} given - Fixed cells array
 */
const styleSelectedBlock = (styles, boardState, selectedIndex, given) => {
  if (selectedIndex < 0) {
    return;
  }
  styleBlock(styles, selectedIndex, 'related-line-subtle');
};

/**
 * Style all fixed (given) cells.
 * @param {(string|null)[]} styles - Styles array to modify
 * @param {number[]} boardState - Current board state
 * @param {number} selectedIndex - Selected cell index
 * @param {boolean[]} given - Fixed cells array
 */
const styleGivenCells = (styles, boardState, selectedIndex, given) => {
  if (!given) {
    return;
  }
  for (let i = 0; i < given.length; i++) {
    if (given[i]) {
      styleCell(styles, i, 'given');
    }
  }
};

/**
 * Style the selected cell.
 * @param {(string|null)[]} styles - Styles array to modify
 * @param {number[]} boardState - Current board state
 * @param {number} selectedIndex - Selected cell index
 * @param {boolean[]} given - Fixed cells array
 */
const styleSelectedCell = (styles, boardState, selectedIndex, given) => {
  if (selectedIndex >= 0) {
    styleCell(styles, selectedIndex, 'selected');
  }
};

/**
 * Gets user-entered cells that violate direct Sudoku constraints.
 * @param {number[]} boardState - Current board state
 * @param {boolean[]} given - Fixed cells array
 * @returns {number[]} Array of conflicting user-entered cell indices
 */
const getDirectErrorCells = (boardState, given) => {
  const wrong = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if ((given && given[i]) || boardState[i] === 0) {
      continue;
    }

    const value = boardState[i];
    const related = getRelated(i);
    let hasConflict = false;
    for (const relatedIndex of related) {
      if (relatedIndex === i) {
        continue;
      }
      if (boardState[relatedIndex] === value) {
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
 * Gets user-entered cells that do not match solved puzzle.
 * @param {number[]} boardState - Current board state
 * @param {number[]} puzzleState - Original puzzle board
 * @param {boolean[]} given - Fixed cells array
 * @returns {number[]} Array of incorrect user-entered cell indices
 */
const getSolvedErrorCells = (boardState, puzzleState, given) => {
  if (!puzzleState) {
    return getDirectErrorCells(boardState, given);
  }

  const solution = solve([...puzzleState]);
  if (!solution) {
    return getDirectErrorCells(boardState, given);
  }

  const wrong = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if ((given && given[i]) || boardState[i] === 0) {
      continue;
    }
    if (boardState[i] !== solution[i]) {
      wrong.push(i);
    }
  }
  return wrong;
};

/**
 * Styles all conflicting cells related to the selected cell only.
 * @param {(string|null)[]} styles - Styles array to modify
 * @param {number[]} boardState - Current board state
 * @param {number} selectedIndex - Selected cell index
 * @param {boolean[]} given - Fixed cells array
 */
const styleImmediateErrors = (styles, boardState, selectedIndex, given) => {
  if (selectedIndex < 0) {
    return;
  }
  if ((given && given[selectedIndex]) || boardState[selectedIndex] === 0) {
    return;
  }

  const selectedValue = boardState[selectedIndex];
  const related = getRelated(selectedIndex);
  let hasConflict = false;
  for (const relatedIndex of related) {
    if (relatedIndex === selectedIndex) {
      continue;
    }
    if (boardState[relatedIndex] === selectedValue) {
      hasConflict = true;
      if (!(given && given[relatedIndex])) {
        styleCell(styles, relatedIndex, 'wrong');
      }
    }
  }

  if (hasConflict) {
    styleCell(styles, selectedIndex, 'wrong');
  }
};

/**
 * Styles wrong cells using either solved comparison or direct conflicts.
 * @param {(string|null)[]} styles - Styles array to modify
 * @param {number[]} boardState - Current board state
 * @param {number} selectedIndex - Selected cell index
 * @param {boolean[]} given - Fixed cells array
 * @param {number[]} puzzleState - Original puzzle board
 * @param {boolean} useSolvedErrors - Use solved comparison when true
 */
const styleErrorCells = (
  styles,
  boardState,
  selectedIndex,
  given,
  puzzleState,
  useSolvedErrors,
) => {
  const wrongCells = useSolvedErrors
    ? getSolvedErrorCells(boardState, puzzleState, given)
    : getDirectErrorCells(boardState, given);
  for (const cell of wrongCells) {
    styleCell(styles, cell, 'wrong');
  }
};

/**
 * Builds an 81-element array of styles for the given board state and config.
 * Applies style features in order based on highlight feature list.
 * Always applies: selected cell (implicit).
 * @param {number[]} boardState - Current board state
 * @param {number} selectedIndex - Selected cell index (-1 if none)
 * @param {string[]} highlightFeatures - Feature list to apply
 * @param {boolean[]} given - Fixed cells array (optional)
 * @param {number[]} puzzleState - Original puzzle board (optional)
 * @param {boolean} hinting - Hint mode flag (optional)
 * @returns {string[]} Array of 81 styles (one per cell)
 */
const buildStyles = (
  boardState,
  selectedIndex,
  highlightFeatures,
  given = null,
  puzzleState = null,
  hinting = false,
) => {
  const styles = new Array(TOTAL_CELLS).fill('');
  const features = (highlightFeatures || []).map((val) =>
    String(val).toLowerCase(),
  );

  if (features.includes('selected block')) {
    styleSelectedBlock(styles, boardState, selectedIndex, given);
  }
  if (features.includes('same value rows')) {
    styleSameValueRows(styles, boardState, selectedIndex, given);
  }
  if (features.includes('same value cols')) {
    styleSameValueCols(styles, boardState, selectedIndex, given);
  }
  if (features.includes('same value blocks')) {
    styleSameValueBlocks(styles, boardState, selectedIndex, given);
  }
  if (features.includes('selected row')) {
    styleSelectedRow(styles, boardState, selectedIndex, given);
  }
  if (features.includes('selected col')) {
    styleSelectedCol(styles, boardState, selectedIndex, given);
  }
  if (features.includes('same value')) {
    styleSameValueCells(styles, boardState, selectedIndex, given);
  }

  styleSelectedCell(styles, boardState, selectedIndex, given);

  if (features.includes('immediate errors')) {
    styleImmediateErrors(styles, boardState, selectedIndex, given);
  }

  const useSolvedErrors = hinting || features.includes('error cells');
  if (useSolvedErrors) {
    styleErrorCells(
      styles,
      boardState,
      selectedIndex,
      given,
      puzzleState,
      true,
    );
  }

  return styles;
};
