/**
 * Load puzzle modal component.
 * Owns all state, rendering, and event handlers for the puzzle-picker modal.
 * Uses modal.js for open/close and table.js for filtered row rendering.
 * No game logic, no URL manipulation — those belong to other modules.
 */

/**
 * Dependency container for load modal handlers.
 * @type {Object|null}
 */
let loadModalDeps = null;

/**
 * Currently fetched list of puzzle filenames.
 * @type {string[]}
 */
let loadModalFilenames = [];

/**
 * Active filter text entered by the user.
 * @type {string}
 */
let loadModalFilterText = '';

/**
 * Filename of the currently highlighted row.
 * @type {string}
 */
let loadModalSelectedFilename = '';

/**
 * Registers dependencies used by load modal handlers.
 * @param {Object} deps - Dependency functions from app orchestration
 * @param {Function} deps.listPuzzles - Returns Promise<string[]> of filenames
 * @param {Function} deps.loadPuzzleByFilename - Loads a puzzle by filename
 */
const configureLoadModal = (deps) => {
  loadModalDeps = deps;
};

/**
 * Returns the modal DOM element.
 * @returns {HTMLElement|null}
 */
const getLoadModalEl = () => document.getElementById('load-modal');

/**
 * Gets all interactive load modal DOM elements.
 * @returns {Object|null} Element map or null when unavailable
 */
const getLoadModalElements = () => {
  const modal = getLoadModalEl();
  const filterInput = document.getElementById('load-filter-input');
  const tableBody = document.getElementById('load-puzzle-table-body');
  const status = document.getElementById('load-modal-status');
  const selectBtn = document.getElementById('load-select-btn');
  if (!modal || !filterInput || !tableBody || !status || !selectBtn) {
    return null;
  }
  return { modal, filterInput, tableBody, status, selectBtn };
};

/**
 * Re-renders the puzzle table based on current filter and selection state.
 */
const renderLoadModal = () => {
  const elements = getLoadModalElements();
  if (!elements) {
    return;
  }

  const filtered = filterTableRows(
    loadModalFilenames,
    loadModalFilterText,
    (filename) => `${extractPuzzleId(filename)} ${filename}`,
  );

  if (!filtered.includes(loadModalSelectedFilename)) {
    loadModalSelectedFilename = '';
  }

  if (filtered.length === 0) {
    elements.tableBody.innerHTML = '';
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 2;
    td.textContent = 'No puzzles match your filter.';
    tr.appendChild(td);
    elements.tableBody.appendChild(tr);
    elements.status.textContent = '0 puzzles shown';
    elements.selectBtn.disabled = true;
    return;
  }

  renderTableRows(
    elements.tableBody,
    filtered,
    (filename) => filename,
    (filename) => [extractPuzzleId(filename), filename],
    loadModalSelectedFilename,
  );

  elements.status.textContent = `${filtered.length} puzzles shown`;
  elements.selectBtn.disabled = loadModalSelectedFilename === '';
};

/**
 * Opens the load modal and fetches the available puzzle list.
 * @returns {Promise<void>}
 */
const openLoadModal = async () => {
  if (!loadModalDeps) {
    return;
  }

  const elements = getLoadModalElements();
  if (!elements) {
    return;
  }

  loadModalFilenames = [];
  loadModalFilterText = '';
  loadModalSelectedFilename = '';

  openModal(elements.modal);
  elements.filterInput.value = '';
  elements.status.textContent = 'Loading puzzles...';
  elements.selectBtn.disabled = true;
  elements.tableBody.innerHTML = '';

  try {
    const filenames = await loadModalDeps.listPuzzles();
    loadModalFilenames = [...filenames].sort();
    renderLoadModal();
    elements.filterInput.focus();
  } catch (error) {
    elements.status.textContent = `Failed to load puzzle list: ${error.message}`;
  }
};

/**
 * Closes the load modal and clears transient selection state.
 */
const closeLoadModal = () => {
  const modal = getLoadModalEl();
  closeModal(modal);
  loadModalFilterText = '';
  loadModalSelectedFilename = '';
};

/**
 * Handles typing in the load modal filter input.
 * @param {Event} event - Input event
 */
const onLoadModalFilterInput = (event) => {
  loadModalFilterText = event.target.value || '';
  renderLoadModal();
};

/**
 * Handles single-click row selection in the load modal table.
 * @param {Event} event - Click event
 */
const onLoadModalTableClick = (event) => {
  const row = event.target.closest('tr[data-key]');
  if (!row) {
    return;
  }
  loadModalSelectedFilename = row.dataset.key;
  renderLoadModal();
};

/**
 * Handles double-click/double-tap on a row to immediately load that puzzle.
 * @param {Event} event - Dblclick event
 */
const onLoadModalTableDblClick = (event) => {
  const row = event.target.closest('tr[data-key]');
  if (!row || !loadModalDeps) {
    return;
  }
  const selectedFilename = row.dataset.key;
  closeLoadModal();
  loadModalDeps.loadPuzzleByFilename(selectedFilename);
};

/**
 * Handles the Cancel button — closes the modal without loading.
 */
const onLoadModalCancelClick = () => {
  closeLoadModal();
};

/**
 * Handles the Select button — loads the currently highlighted puzzle.
 */
const onLoadModalSelectClick = () => {
  if (!loadModalDeps || !loadModalSelectedFilename) {
    return;
  }
  const selectedFilename = loadModalSelectedFilename;
  closeLoadModal();
  loadModalDeps.loadPuzzleByFilename(selectedFilename);
};

/**
 * Handles keyboard controls while the load modal is open.
 * Escape closes; Enter (outside a text input) confirms selection.
 * @param {Event} event - Keydown event
 */
const onLoadModalKeydown = (event) => {
  const modal = getLoadModalEl();
  if (!isModalOpen(modal)) {
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    closeLoadModal();
    return;
  }

  if (event.key !== 'Enter') {
    return;
  }

  const activeTag = document.activeElement ? document.activeElement.tagName : '';
  if (activeTag === 'INPUT') {
    return;
  }

  event.preventDefault();
  onLoadModalSelectClick();
};
