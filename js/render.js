/**
 * Determines the highlight class for a cell based on selection state.
 * @param {number} cellIndex - Cell position (0-80)
 * @param {number} selectedNum - Number in the currently selected cell
 * @param {Set<number>} relatedCells - Set of cells in the same row/col/box
 * @param {number} selected - Currently selected cell index
 * @param {number[]} board - Board state
 * @returns {string|null} CSS class name or null
 */
const getCellHighlight = (
  cellIndex,
  selectedNum,
  relatedCells,
  selected,
  board,
) => {
  if (cellIndex === selected) {
    return 'selected';
  }
  if (selectedNum && selectedNum === board[cellIndex]) {
    return 'same-num';
  }
  if (relatedCells.has(cellIndex)) {
    return 'related';
  }
  return null;
};

/**
 * Creates a table cell element for a given board position.
 * @param {Object} state - Current state
 * @param {number} cellIndex - Cell position (0-80)
 * @param {Function} onCellFocus - Focus handler
 * @param {Function} onCellKeydown - Keydown handler
 * @param {Function} onCellInput - Input handler
 * @returns {HTMLTableCellElement} Configured td element
 */
const createCell = (
  state,
  cellIndex,
  onCellFocus,
  onCellKeydown,
  onCellInput,
) => {
  const row = Math.floor(cellIndex / GRID_SIZE);
  const col = cellIndex % GRID_SIZE;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'cell';
  input.maxLength = 1;
  input.value = state.board[cellIndex] || '';
  input.dataset.cellIndex = cellIndex;
  input.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}`);

  if (state.given[cellIndex]) {
    input.classList.add('given');
  }

  const relatedCells =
    state.selected >= 0 ? getRelated(state.selected) : new Set();
  const selectedNum = state.selected >= 0 ? state.board[state.selected] : 0;
  const highlight = getCellHighlight(
    cellIndex,
    selectedNum,
    relatedCells,
    state.selected,
    state.board,
  );
  if (highlight) {
    input.classList.add(highlight);
  }

  input.addEventListener('focus', onCellFocus);
  input.addEventListener('keydown', onCellKeydown);
  input.addEventListener('input', onCellInput);

  const td = document.createElement('td');
  td.appendChild(input);
  return td;
};

/**
 * Creates a table row element for a given board row.
 * @param {Object} state - Current state
 * @param {number} row - Row index (0-8)
 * @param {Function} onCellFocus - Focus handler
 * @param {Function} onCellKeydown - Keydown handler
 * @param {Function} onCellInput - Input handler
 * @returns {HTMLTableRowElement} Configured tr element
 */
const createRow = (state, row, onCellFocus, onCellKeydown, onCellInput) => {
  const tr = document.createElement('tr');
  for (let col = 0; col < GRID_SIZE; col++) {
    tr.appendChild(
      createCell(state, idx(row, col), onCellFocus, onCellKeydown, onCellInput),
    );
  }
  return tr;
};

/**
 * Renders the sudoku grid.
 * @param {Object} state - Current state
 * @param {Function} onCellFocus - Focus handler
 * @param {Function} onCellKeydown - Keydown handler
 * @param {Function} onCellInput - Input handler
 */
const renderGrid = (state, onCellFocus, onCellKeydown, onCellInput) => {
  const gridEl = document.getElementById('grid');
  gridEl.innerHTML = '';

  for (let row = 0; row < GRID_SIZE; row++) {
    gridEl.appendChild(
      createRow(state, row, onCellFocus, onCellKeydown, onCellInput),
    );
  }
};

/**
 * Marks wrong cells with visual indicator.
 * @param {Object} state - Current state
 */
const markWrongCells = (state) => {
  const wrongCells = getWrongCells(state);
  const inputs = document.querySelectorAll('.cell');
  wrongCells.forEach((i) => {
    inputs[i].classList.add('wrong');
  });
};

/**
 * Updates the status message display.
 * @param {string} msg - Status message
 * @param {string} type - Status type (e.g., 'win', 'error')
 */
const setStatus = (msg, type) => {
  const statusEl = document.getElementById('status');
  statusEl.textContent = msg;
  statusEl.className = type || '';
};

/**
 * Focuses the cell input at the given index.
 * @param {number} cellIndex - Cell position (0-80)
 */
const focusCell = (cellIndex) => {
  const inputs = document.querySelectorAll('.cell');
  if (inputs[cellIndex]) {
    inputs[cellIndex].focus();
  }
};
