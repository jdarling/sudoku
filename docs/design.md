# Sudoku — Design Document

## Overview

A single-page Sudoku game that runs in the browser with no build tooling or framework dependencies. The architecture emphasizes pure functions, immutable state, and clean separation of concerns.

---

## Principles

1. **Pure Functions** — All business logic is stateless and testable. Functions take inputs and return new state without side effects.
2. **Immutable State** — Game state is represented as immutable objects. Updates create new objects via spread operators.
3. **Separation of Concerns** — Code is organized into logical layers: solver, state, rendering, and orchestration.
4. **Single Responsibility** — Each module owns one problem domain and nothing else.
5. **No Global State** — State lives in module scope within `app.js`, accessible only through controlled interfaces.

---

## Architecture

### Module Organization

```
js/
├── constants.js      Game constants (grid size, arrow keys)
├── solver.js         Sudoku algorithm: validation, backtracking, cell relationships
├── state.js          Pure state mutations (place number, select cell, check solution)
├── render.js         DOM rendering, cell styling, status display
├── puzzles.js        Puzzle loading, YAML parsing, index management
└── app.js            Application state, event handlers, orchestration
```

### `constants.js`

Defines immutable game configuration:

| Constant      | Value  | Purpose                         |
| ------------- | ------ | ------------------------------- |
| `GRID_SIZE`   | 9      | Sudoku grid dimension           |
| `TOTAL_CELLS` | 81     | Total cells (9×9)               |
| `BOX_SIZE`    | 3      | 3×3 box dimension               |
| `ARROW_MOVES` | Object | Maps arrow keys to cell offsets |

### `solver.js`

Pure functions for Sudoku logic. No state, no DOM.

**`idx(row, col)` → `number`**

Converts (row, col) to 0-80 cell index. Used everywhere instead of 2D arrays.

```javascript
// cell at row 3, col 5 → index 32
idx(3, 5) = 3 * 9 + 5 = 32
```

**`isValid(boardState, pos, num)` → `boolean`**

Checks if placing `num` at cell `pos` violates any Sudoku constraint:

- All values in the same row must be unique
- All values in the same column must be unique
- All values in the same 3×3 box must be unique

Returns `false` at the first conflict.

**`solve(boardState)` → `boolean`**

Recursively solves a puzzle using backtracking. Mutates `boardState` in place. Returns `true` if solved, `false` if unsolvable.

**`getRelated(pos)` → `Set<number>`**

Returns all cell indices that share a row, column, or 3×3 box with cell `pos`. Used for visual highlighting.

### `state.js`

Pure state transformation functions. All return new state objects; nothing is mutated.

**`createStateFromPuzzle(puzzleStr)` → `Object`**

Creates initial game state from an 81-character puzzle string.

Returns:

```javascript
{
  board: [...],        // Current board state
  given: [...],        // Which cells are fixed (original puzzle)
  solution: [...],     // Complete solved puzzle
  selected: -1,        // Selected cell index or -1
  status: '',          // Status message text
  statusType: ''       // CSS class for status (e.g., 'win', 'error')
}
```

**`selectCell(state, cellIndex)` → `Object`**

Returns new state with `selected` updated.

**`placeNumber(state, cellIndex, num)` → `Object`**

Places a number at a cell (ignores if cell is given/fixed). Returns new state with updated board and cleared status.

**`solveBoard(state)` → `Object`**

Returns new state with board filled with the solution and all cells marked as given.

**`checkSolution(state, showErrors)` → `Object`**

Compares board against solution. If `showErrors` is true and cells are wrong, status is set to error state. Returns new state.

**`getWrongCells(state)` → `number[]`**

Returns indices of user-entered cells that don't match the solution.

### `render.js`

Functions that modify the DOM. No game logic, no state mutations.

**`getCellHighlight(cellIndex, selectedNum, relatedCells, selected, board)` → `string|null`**

Returns the CSS class name for highlighting a cell based on its relationship to the selected cell.

**`createCell(state, cellIndex, onFocus, onKeydown, onInput)` → `HTMLTableCellElement`**

Creates a `<td>` with an `<input>` for a single cell. Attaches event listeners.

**`createRow(state, row, ...)` → `HTMLTableRowElement`**

Creates a `<tr>` with 9 cells for one row.

**`renderGrid(state, ...)` → `void`**

Clears the grid and rebuilds it from state.

**`markWrongCells(state)` → `void`**

Adds the `wrong` class to cells with incorrect entries.

**`setStatus(msg, type)` → `void`**

Updates the status message and CSS class.

**`focusCell(cellIndex)` → `void`**

Moves keyboard focus to a specific cell input.

### `puzzles.js`

Async puzzle management.

**`getPuzzles()` → `Promise<string[]>`**

Fetches `data/puzzles.json`, returns array of puzzle filenames.

**`getPuzzle(filename)` → `Promise<Object>`**

Fetches and parses a YAML puzzle file. Returns:

```javascript
{
  name: "Puzzle Title",
  author: "Author Name",
  difficulty: "easy",
  puzzle: "530070000..." // 81-character string
}
```

Supports both `rows` and `blocks` puzzle formats in YAML.

**`getRandomPuzzle()` → `Promise<Object>`**

Fetches index, picks a random filename, returns that puzzle.

**Note on Scale:** At runtime, only the index is fetched (small). Individual puzzles load on demand. When scaling to millions of puzzles, replace this with a backend API endpoint (`/api/puzzles/random`) that handles randomization server-side.

### `app.js`

Application orchestration. Manages the single mutable `currentState` reference.

**Module-Level State**

```javascript
let currentState = null; // The only mutable state in the entire app
```

**`updateState(newState)` → `void`**

Core update function. Coordinates all side effects:

1. Updates `currentState`
2. Calls `renderGrid()`, `markWrongCells()`, `setStatus()`, `focusCell()` in sequence
3. All changes are synchronous and ordered

**Event Handlers** (top-level functions)

- `onCellFocus(event)` — Select a cell
- `onCellKeydown(event)` — Handle keyboard input (1-9, arrows, delete)
- `onCellInput(event)` — Handle typed input
- `onNumberButtonClick(event)` — Handle number pad buttons

All handlers are pure functions that compute new state and call `updateState()`.

**Helper Functions**

- `handleNumberKey(num)` — Pure: returns new state for placing a number
- `handleDeleteKey()` — Pure: returns new state for clearing a cell
- `handleArrowKey(offset)` — Pure: returns new state for arrow navigation

**`loadNewGame()` → `Promise<void>`**

Async function that fetches a puzzle and initializes the game.

**`init()` → `Promise<void>`**

Entry point. Calls `loadNewGame()`, then attaches all event listeners.

---

## Data Model

All game state lives in a single state object with five properties:

| Property     | Type             | Description                                              |
| ------------ | ---------------- | -------------------------------------------------------- |
| `board`      | `number[]` (81)  | Current board state. `0` means empty.                    |
| `given`      | `boolean[]` (81) | `true` if cell is from the original puzzle (can't edit). |
| `solution`   | `number[]` (81)  | Complete solved puzzle for validation.                   |
| `selected`   | `number`         | Index of selected cell, or `-1` for none.                |
| `status`     | `string`         | Display message (e.g., "Puzzle solved!").                |
| `statusType` | `string`         | CSS class for status styling (e.g., "win", "error").     |

Cell indexing is row-major: `index = row * 9 + col`

---

## Core Algorithms

### Constraint Validator — `isValid(board, pos, num)`

Ensures placing a number doesn't violate Sudoku rules.

1. Check row: all cells in `row` must have unique values
2. Check column: all cells in `col` must have unique values
3. Check box: all 9 cells in the 3×3 box must have unique values

Box coordinates are computed via integer division:

```javascript
boxRow = BOX_SIZE * Math.floor(row / BOX_SIZE);
boxCol = BOX_SIZE * Math.floor(col / BOX_SIZE);
```

Returns `false` at the first conflict, `true` if all pass.

### Backtracking Solver — `solve(board)`

Recursively solves a puzzle by trying digits 1-9 for each empty cell.

```
1. Find first empty cell (value 0). If none, puzzle is solved → return true
2. For each digit 1-9:
   a. If digit is valid at this position:
      - Place digit
      - Recurse. If recursion succeeds, return true
      - Otherwise, reset cell to 0 and try next digit
3. If no digit works, return false (triggers backtracking up the stack)
```

Called once per puzzle load to pre-compute the solution. Not called during gameplay.

### Related Cell Lookup — `getRelated(pos)`

Computes all cells visually related to a position (same row, column, or 3×3 box).

Returns a `Set<number>` to allow O(1) lookup during rendering.

---

## Puzzle Format (YAML)

Puzzles are stored in `data/puzzles/*.yaml`. Each file is a single YAML document.

### Supported Formats

**Rows Format**

```yaml
name: My Puzzle
author: Jane Doe
difficulty: easy
puzzle:
  rows:
    - '530070000'
    - '600195000'
    - ...
```

Each row is an 81-digit string (or split as 9 separate 3-digit strings).

**Blocks Format**

```yaml
puzzle:
  blocks:
    top-left:
      - '530'
      - '600'
      - '098'
    top-center:
      - ...
```

Blocks are named by position (`top-left`, `middle-center`, etc.) and contain 3 rows of 3 digits each.

### Metadata

- `name` — Display name (required)
- `author` — Contributor name (required)
- `difficulty` — One of: `easy`, `medium`, `hard`, `expert` (required)
- `schemaVersion` — YAML schema version (default: 1.0.0, omit unless newer)
- `version` — Puzzle version for tracking updates (optional)

Values must be quoted strings (e.g., `"530070000"`) to avoid YAML interpreting leading zeros as octal.

---

## Rendering Strategy

The entire grid is rebuilt on every state change via `renderGrid()`. No diffing, no optimizations—just clear and rebuild.

This design is intentionally simple because:

- 81 cells is trivially small for modern browsers
- Clear and rebuild avoids state/DOM sync bugs
- Simpler code is easier to test and maintain

For each cell, the process is:

1. Determine CSS class from cell state (selected, related, wrong, given, etc.)
2. Create `<input>` element with value from state
3. Attach event listeners
4. Append to DOM

After rendering, `focusCell()` moves keyboard focus to the selected cell.

---

## User Interaction Flow

```
User Action → Event Handler → Pure State Function → updateState()
                                                         ↓
                                              1. Update currentState
                                              2. Render grid
                                              3. Mark wrong cells
                                              4. Update status
                                              5. Move focus
                                                         ↓
                                                    UI Updates
```

Example: User presses "5"

1. `onCellKeydown` fires with key "5"
2. Calls `handleNumberKey(5)` → returns new state
3. Calls `updateState(newState)`
4. `updateState` orchestrates all side effects in order

---

## Testing Strategy

Every pure function can be unit tested in isolation:

- `isValid()` — Test constraint violations
- `solve()` — Test with known puzzles
- `getRelated()` — Test with specific cell indices
- `selectCell()` — Test state immutability
- `placeNumber()` — Test placement rules and state updates
- `checkSolution()` — Test win conditions and error marking

Event handlers can be tested by:

1. Creating a known state
2. Calling the handler with a synthetic event
3. Verifying the resulting state matches expectations

Rendering functions can be mocked/stubbed for state-only testing.

---

## Design Decisions

**No Framework** — The DOM is small, static, and state-driven. A framework adds no value.

**Full Grid Re-render** — Simpler than diffing, avoids sync bugs, fast enough for 81 cells.

**Pure Functions** — All business logic is side-effect-free, testable, and reusable.

**Immutable State** — Every state update creates a new object. This prevents accidental mutations and makes time-travel debugging straightforward.

**Single Mutable Reference** — Only `currentState` in `app.js` is mutable. Everything else is derived from it.

**YAML Puzzles** — Human-readable, supports multiple input formats, easy for contributors to understand and create.

**Async Puzzle Loading** — Supports future scaling to millions of puzzles without loading all at once.
