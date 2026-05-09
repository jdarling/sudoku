/**
 * Generic filterable table component.
 * Pure rendering utilities — no state, no event handling.
 */

/**
 * Filters an array of row objects by a text predicate.
 * @param {any[]} rows - Full set of row data
 * @param {string} filterText - Text to filter by
 * @param {Function} getSearchText - Returns the searchable string for a row
 * @returns {any[]} Filtered rows
 */
const filterTableRows = (rows, filterText, getSearchText) => {
  const normalized = filterText.trim().toLowerCase();
  if (!normalized) {
    return rows;
  }

  const filtered = [];
  for (const row of rows) {
    if (!getSearchText(row).toLowerCase().includes(normalized)) {
      continue;
    }
    filtered.push(row);
  }

  return filtered;
};

/**
 * Renders rows into a tbody element, clearing previous contents.
 * @param {HTMLElement} tbodyEl - The tbody element to render into
 * @param {any[]} rows - Row data to render
 * @param {Function} getKey - Returns a unique key string for each row
 * @param {Function} getCells - Returns an array of cell text strings for a row
 * @param {string} selectedKey - Key of the currently selected row ('' for none)
 */
const renderTableRows = (tbodyEl, rows, getKey, getCells, selectedKey) => {
  if (!tbodyEl) {
    return;
  }

  tbodyEl.innerHTML = "";

  for (const row of rows) {
    const key = getKey(row);
    const tr = document.createElement("tr");
    tr.dataset.key = key;
    if (key === selectedKey) {
      tr.classList.add("is-selected");
    }

    for (const cellText of getCells(row)) {
      const td = document.createElement("td");
      td.textContent = cellText;
      tr.appendChild(td);
    }

    tbodyEl.appendChild(tr);
  }
};
