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
 * Applies a style to all cells in a 3x3 box.
 * @param {(string|null)[]} styles - Array of styles (one per cell)
 * @param {number} cellIndex - Any cell in the box (0-80)
 * @param {string|null} style - Style to apply
 */
const styleBox = (styles, cellIndex, style) => {
  const row = Math.floor(cellIndex / GRID_SIZE);
  const col = cellIndex % GRID_SIZE;
  const boxRow = BOX_SIZE * Math.floor(row / BOX_SIZE);
  const boxCol = BOX_SIZE * Math.floor(col / BOX_SIZE);
  for (let dr = 0; dr < BOX_SIZE; dr++) {
    for (let dc = 0; dc < BOX_SIZE; dc++) {
      styleCell(styles, (boxRow + dr) * GRID_SIZE + (boxCol + dc), style);
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
 * Style boxes of cells that contain the same value as the selected cell.
 * @param {(string|null)[]} styles - Styles array to modify
 * @param {number[]} boardState - Current board state
 * @param {number} selectedIndex - Selected cell index
 * @param {boolean[]} given - Fixed cells array
 */
const styleSameValueBoxes = (styles, boardState, selectedIndex, given) => {
  if (selectedIndex < 0) {
    return;
  }
  const sameValueCells = getCellsWithSameNumber(boardState, selectedIndex);
  for (const cell of sameValueCells) {
    styleBox(styles, cell, 'related-line-subtle');
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
 * Style the box of the selected cell.
 * @param {(string|null)[]} styles - Styles array to modify
 * @param {number[]} boardState - Current board state
 * @param {number} selectedIndex - Selected cell index
 * @param {boolean[]} given - Fixed cells array
 */
const styleSelectedBox = (styles, boardState, selectedIndex, given) => {
  if (selectedIndex < 0) {
    return;
  }
  styleBox(styles, selectedIndex, 'related-line-subtle');
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
 * Builds an 81-element array of styles for the given board state and mode.
 * Applies style features in order based on STYLE_CONFIGS.
 * Always applies: selected cell (implicit).
 * @param {number[]} boardState - Current board state
 * @param {number} selectedIndex - Selected cell index (-1 if none)
 * @param {string} styleMode - Style mode (key in STYLE_CONFIGS)
 * @param {boolean[]} given - Fixed cells array (optional)
 * @returns {string[]} Array of 81 styles (one per cell)
 */
const buildStyles = (boardState, selectedIndex, styleMode, given = null) => {
  const styles = new Array(TOTAL_CELLS).fill('');
  const features = (STYLE_CONFIGS[styleMode] || STYLE_CONFIGS.none).map((val) =>
    val.toLowerCase(),
  );

  if (features.includes('selected box')) {
    styleSelectedBox(styles, boardState, selectedIndex, given);
  }
  if (features.includes('same value rows')) {
    styleSameValueRows(styles, boardState, selectedIndex, given);
  }
  if (features.includes('same value cols')) {
    styleSameValueCols(styles, boardState, selectedIndex, given);
  }
  if (features.includes('same value boxes')) {
    styleSameValueBoxes(styles, boardState, selectedIndex, given);
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
  return styles;
};
