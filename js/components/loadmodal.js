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
 * Currently fetched list of puzzle index entries.
 * @type {Object[]}
 */
let loadModalEntries = [];

/**
 * Active filter text entered by the user.
 * @type {string}
 */
let loadModalFilterText = "";

/**
 * Path of the currently highlighted row.
 * @type {string}
 */
let loadModalSelectedPath = "";

/**
 * Resolve function for the active openLoadModalForSelection promise.
 * Null when the modal was not opened in selection mode.
 * @type {Function|null}
 */
let loadModalResolve = null;

/**
 * Registers dependencies used by load modal handlers.
 * @param {Object} deps - Dependency functions from app orchestration
 * @param {Function} deps.listPuzzles - Returns Promise<Object[]> of metadata entries
 * @param {Function} deps.loadPuzzleByFilename - Loads a puzzle by filename
 */
const configureLoadModal = (deps) => {
  loadModalDeps = deps;
};

/**
 * Returns the modal DOM element.
 * @returns {HTMLElement|null}
 */
const getLoadModalEl = () => document.getElementById("load-modal");

/**
 * Gets all interactive load modal DOM elements.
 * @returns {Object|null} Element map or null when unavailable
 */
const getLoadModalElements = () => {
  const modal = getLoadModalEl();
  const filterInput = document.getElementById("load-filter-input");
  const tableBody = document.getElementById("load-puzzle-table-body");
  const status = document.getElementById("load-modal-status");
  const selectBtn = document.getElementById("load-select-btn");
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
    loadModalEntries,
    loadModalFilterText,
    (entry) => buildPuzzleSearchText(entry),
  );

  if (!filtered.some((entry) => entry.path === loadModalSelectedPath)) {
    loadModalSelectedPath = "";
  }

  if (filtered.length === 0) {
    elements.tableBody.innerHTML = "";
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "No puzzles match your filter.";
    tr.appendChild(td);
    elements.tableBody.appendChild(tr);
    elements.status.textContent = "0 puzzles shown";
    elements.selectBtn.disabled = true;
    return;
  }

  renderTableRows(
    elements.tableBody,
    filtered,
    (entry) => entry.path,
    (entry) => [entry.id, entry.name, entry.level, entry.author, entry.path],
    loadModalSelectedPath,
  );

  elements.status.textContent = `${filtered.length} puzzles shown`;
  elements.selectBtn.disabled = loadModalSelectedPath === "";
};

/**
 * Opens the load modal and fetches the available puzzle list.
 * @param {string} [prefillFilter] - Optional filter text to prefill
 * @returns {Promise<void>}
 */
const openLoadModal = async (prefillFilter = "") => {
  if (!loadModalDeps) {
    return;
  }

  const elements = getLoadModalElements();
  if (!elements) {
    return;
  }

  loadModalEntries = [];
  loadModalFilterText = prefillFilter || "";
  loadModalSelectedPath = "";

  openModal(elements.modal);
  elements.filterInput.value = prefillFilter || "";
  elements.status.textContent = "Loading puzzles...";
  elements.selectBtn.disabled = true;
  elements.tableBody.innerHTML = "";

  try {
    const entries = await loadModalDeps.listPuzzles();
    loadModalEntries = [...entries].sort((a, b) => {
      if (a.id === b.id) {
        return a.path.localeCompare(b.path);
      }
      return a.id.localeCompare(b.id);
    });
    renderLoadModal();
    elements.filterInput.focus();
  } catch (error) {
    elements.status.textContent = `Failed to load puzzle list: ${error.message}`;
  }
};

/**
 * Opens the load modal in selection mode.
 * Resolves with the selected filename, or null if the user cancels.
 * @param {string} [prefillFilter] - Optional filter text to prefill
 * @returns {Promise<string|null>}
 */
const openLoadModalForSelection = (prefillFilter = "") => {
  return new Promise((resolve) => {
    loadModalResolve = resolve;
    openLoadModal(prefillFilter);
  });
};

/**
 * Closes the load modal and clears transient selection state.
 */
const closeLoadModal = () => {
  const modal = getLoadModalEl();
  closeModal(modal);
  loadModalFilterText = "";
  loadModalSelectedPath = "";
};

/**
 * Handles typing in the load modal filter input.
 * @param {Event} event - Input event
 */
const onLoadModalFilterInput = (event) => {
  loadModalFilterText = event.target.value || "";
  renderLoadModal();
};

/**
 * Handles single-click row selection in the load modal table.
 * Updates selection state and CSS class in-place so dblclick can fire correctly.
 * A full re-render replaces the tr elements, which prevents the browser from
 * recognising the two clicks as a double-click on the same target.
 * @param {Event} event - Click event
 */
const onLoadModalTableClick = (event) => {
  const row = event.target.closest("tr[data-key]");
  if (!row) {
    return;
  }

  const tbody = row.closest("tbody");
  if (tbody) {
    const prev = tbody.querySelector("tr.is-selected");
    if (prev) {
      prev.classList.remove("is-selected");
    }
  }
  row.classList.add("is-selected");

  loadModalSelectedPath = row.dataset.key;

  const selectBtn = document.getElementById("load-select-btn");
  if (selectBtn) {
    selectBtn.disabled = false;
  }
};

/**
 * Handles double-click/double-tap on a row to immediately load that puzzle.
 * @param {Event} event - Dblclick event
 */
const onLoadModalTableDblClick = (event) => {
  const row = event.target.closest("tr[data-key]");
  if (!row) {
    return;
  }
  const selectedPath = row.dataset.key;
  closeLoadModal();
  if (loadModalResolve) {
    const resolve = loadModalResolve;
    loadModalResolve = null;
    resolve(selectedPath);
    return;
  }
  if (!loadModalDeps) {
    return;
  }
  loadModalDeps.loadPuzzleByFilename(selectedPath);
};

/**
 * Handles the Cancel button — closes the modal without loading.
 */
const onLoadModalCancelClick = () => {
  closeLoadModal();
  if (loadModalResolve) {
    const resolve = loadModalResolve;
    loadModalResolve = null;
    resolve(null);
  }
};

/**
 * Handles the Select button — loads the currently highlighted puzzle.
 */
const onLoadModalSelectClick = () => {
  if (!loadModalSelectedPath) {
    return;
  }
  const selectedPath = loadModalSelectedPath;
  closeLoadModal();
  if (loadModalResolve) {
    const resolve = loadModalResolve;
    loadModalResolve = null;
    resolve(selectedPath);
    return;
  }
  if (!loadModalDeps) {
    return;
  }
  loadModalDeps.loadPuzzleByFilename(selectedPath);
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

  if (event.key === "Escape") {
    event.preventDefault();
    closeLoadModal();
    if (loadModalResolve) {
      const resolve = loadModalResolve;
      loadModalResolve = null;
      resolve(null);
    }
    return;
  }

  if (event.key !== "Enter") {
    return;
  }

  const activeTag = document.activeElement
    ? document.activeElement.tagName
    : "";
  if (activeTag === "INPUT") {
    return;
  }

  event.preventDefault();
  onLoadModalSelectClick();
};
