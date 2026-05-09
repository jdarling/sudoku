/**
 * Gets the highlight style for a cell from a pre-computed styles array.
 * @param {number} cellIndex - Cell position (0-80)
 * @param {(string|null)[]} boardStyles - Array of 81 pre-computed styles
 * @returns {string|null} CSS class name or null
 */
const getCellStyle = (cellIndex, boardStyles) => {
  return boardStyles[cellIndex];
};

/**
 * Creates a table cell element for a given board position.
 * @param {Object} state - Current state
 * @param {number} cellIndex - Cell position (0-80)
 * @param {(string|null)[]} boardStyles - Pre-computed styles array
 * @param {Function} onCellFocus - Focus handler
 * @param {Function} onCellKeydown - Keydown handler
 * @param {Function} onCellInput - Input handler
 * @returns {HTMLTableCellElement} Configured td element
 */
const createCell = (
  state,
  cellIndex,
  boardStyles,
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
  input.inputMode = 'none';
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('spellcheck', 'false');
  input.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}`);

  if (state.given[cellIndex] || isCoarsePointerDevice()) {
    input.readOnly = true;
  }
  if (state.given[cellIndex]) {
    input.classList.add('given');
  }

  const style = getCellStyle(cellIndex, boardStyles);
  if (style) {
    input.classList.add(style);
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
 * @param {(string|null)[]} boardStyles - Pre-computed styles array
 * @param {Function} onCellFocus - Focus handler
 * @param {Function} onCellKeydown - Keydown handler
 * @param {Function} onCellInput - Input handler
 * @returns {HTMLTableRowElement} Configured tr element
 */
const createRow = (
  state,
  row,
  boardStyles,
  onCellFocus,
  onCellKeydown,
  onCellInput,
) => {
  const tr = document.createElement('tr');
  for (let col = 0; col < GRID_SIZE; col++) {
    tr.appendChild(
      createCell(
        state,
        idx(row, col),
        boardStyles,
        onCellFocus,
        onCellKeydown,
        onCellInput,
      ),
    );
  }
  return tr;
};

/**
 * Renders the sudoku grid.
 * @param {Object} state - Current state
 * @param {string[]} highlightFeatures - Active highlight features from options
 * @param {Function} onCellFocus - Focus handler
 * @param {Function} onCellKeydown - Keydown handler
 * @param {Function} onCellInput - Input handler
 */
const renderGrid = (
  state,
  highlightFeatures,
  onCellFocus,
  onCellKeydown,
  onCellInput,
) => {
  const gridEl = document.getElementById('grid');
  gridEl.innerHTML = '';

  // Build styles array once for entire board
  const boardStyles = buildStyles(
    state.board,
    state.selected,
    highlightFeatures || getStyleConfigFeatures('related-block'),
    state.given,
    state.puzzle,
    state.hinting,
  );

  for (let row = 0; row < GRID_SIZE; row++) {
    gridEl.appendChild(
      createRow(
        state,
        row,
        boardStyles,
        onCellFocus,
        onCellKeydown,
        onCellInput,
      ),
    );
  }
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
 * Gets or creates the confetti layer used for win celebrations.
 * @returns {HTMLDivElement|null} Confetti layer element
 */
const getConfettiLayer = () => {
  if (typeof document === 'undefined') {
    return null;
  }

  let layer = document.getElementById('confetti-layer');
  if (layer) {
    return layer;
  }

  layer = document.createElement('div');
  layer.id = 'confetti-layer';
  document.body.appendChild(layer);
  return layer;
};

/**
 * Creates and animates a single confetti piece.
 * @param {HTMLElement} layer - Confetti layer element
 */
const createConfettiPiece = (layer) => {
  const piece = document.createElement('span');
  piece.className = 'confetti-piece';
  piece.style.left = `${Math.random() * 100}vw`;
  piece.style.top = `${Math.random() * 100}vh`;
  piece.style.backgroundColor = `hsl(${Math.floor(Math.random() * 360)}, 85%, 58%)`;
  piece.style.animationDuration = `${1.6 + Math.random() * 1.1}s`;
  piece.style.animationDelay = `${Math.random() * 0.15}s`;
  piece.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`;
  layer.appendChild(piece);

  piece.addEventListener('animationend', () => {
    piece.remove();
  });
};

/**
 * Calculates a dense confetti piece count based on viewport area.
 * @returns {number} Number of pieces to emit
 */
const getWinConfettiPieceCount = () => {
  if (typeof window === 'undefined') {
    return 700;
  }

  const viewportArea = window.innerWidth * window.innerHeight;
  const scaledCount = Math.floor(viewportArea / 1800);
  return Math.max(700, Math.min(1400, scaledCount));
};

/**
 * Triggers a non-blocking confetti burst to celebrate a win.
 */
const launchWinCelebration = () => {
  const layer = getConfettiLayer();
  if (!layer) {
    return;
  }

  const pieceCount = getWinConfettiPieceCount();
  for (let i = 0; i < pieceCount; i++) {
    createConfettiPiece(layer);
  }
};

/**
 * Renders the version number in the version footer element.
 */
const renderVersion = () => {
  const el = document.getElementById('version');
  if (el) {
    el.textContent = `v${VERSION}`;
  }
};

/**
 * Focuses the cell input at the given index.
 * @param {number} cellIndex - Cell position (0-80), or -1 to clear focus
 */
const focusCell = (cellIndex) => {
  if (cellIndex < 0 || cellIndex >= TOTAL_CELLS) {
    return;
  }
  if (isCoarsePointerDevice()) {
    return;
  }
  const inputs = document.querySelectorAll('.cell');
  if (inputs[cellIndex]) {
    inputs[cellIndex].focus();
  }
};
