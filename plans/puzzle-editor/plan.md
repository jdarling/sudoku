# Puzzle Editor — Implementation Plan

## Goal

A separate page (`edit.html`) for creating and editing Sudoku puzzles. Not linked from
`index.html` — accessible by direct URL only. Lets users build puzzles from scratch,
validate them, rate their difficulty, and export them in the project's YAML format.

---

## Architecture

The editor is completely standalone — a separate HTML page with its own JS entry point.
It reuses shared modules but has its own orchestration layer.

```
edit.html
    │
    ├── js/solver.js       (shared — validation and difficulty analysis)
    ├── js/render.js       (shared — grid rendering, reused as-is)
    ├── js/constants.js    (shared — grid size, encoding constants)
    ├── js/editor.js       (new — editor-specific state and logic)
    └── style/themes/      (shared — same visual themes as main game)
```

No game state (puzzles.json, currentState) is loaded in the editor. The editor manages
its own internal state object.

---

## Editor State Shape

```javascript
{
  board: number[81],      // 0 = empty, 1-9 = clue
  selected: number,       // selected cell index (-1 = none)
  validation: {
    valid: boolean,
    uniqueSolution: boolean,
    errorCells: number[], // indices with duplicates
    difficulty: string,   // 'Easy' | 'Medium' | 'Hard' | 'Expert' | null
  }
}
```

---

## Module API (`js/editor.js`)

All pure functions:

```javascript
const createEditorState = () => ({ board: Array(81).fill(0), selected: -1, validation: null })
const selectCell = (state, index) => { ...state, selected: index }
const placeClue = (state, index, value) => { ...state, board: [...] }
const clearCell = (state, index) => placeClue(state, index, 0)
const clearBoard = (state) => { ...state, board: Array(81).fill(0) }
const validatePuzzle = (state) => { ...state, validation: { ... } }
const exportYAML = (state, name, difficulty) => string
```

---

## Sub-Features

### Editor UI & Board Input

Interactive grid where the user places digits to define puzzle clues.

**Behaviour:**
- Click a cell to select it
- Press 1–9 to place a clue; press 0 or Delete/Backspace to erase
- All placed digits are treated as clues (given cells), not player entries
- Real-time duplicate detection: highlight cells that violate row/column/box rules

**Implementation:**
- `edit.html` uses the same `<table id="grid">` structure as `index.html`
- Reuse `js/render.js` `renderGrid()` — editor state maps cleanly to the same cell classes
- Add keypad (1–9 + Erase) identical to main game
- Add toolbar: Validate | Clear | Export | Load

### Puzzle Validation & Difficulty Rating

Analyzes the board to confirm it has exactly one solution and estimates difficulty.

**Validation rules:**
- No duplicate digits in any row, column, or box
- At least one solution exists
- Exactly one solution exists (required for a valid puzzle)

**Difficulty rating** (based on solving technique required):
- `Easy` — Solvable using only naked singles (one candidate per cell)
- `Medium` — Requires hidden singles (one position per digit in a unit)
- `Hard` — Requires naked pairs, triples, or pointing pairs
- `Expert` — Requires advanced techniques (X-wing, swordfish, etc.)

**Implementation:**
- Use `js/solver.js` — `countSolutions(board)` already exists for uniqueness check
- Implement `rateDifficulty(board)` in `js/editor.js` using hint-counting approach:
  solve step-by-step, record which technique was needed at each step
- Display result in editor UI: green "Valid — Medium difficulty" or red "No unique solution"

### Save & Export

Output the puzzle in the project's YAML format for adding to `data/puzzles/`.

**YAML format:**
```yaml
difficulty: Medium
name: "My Puzzle"
clues: |
  53..7....
  6..195...
  .98....6.
  8...6...3
  4..8.3..1
  7...2...6
  .6....28.
  ...419..5
  ....8..79
```

**Implementation:**
- `exportYAML(state, name, difficulty)` in `js/editor.js` — pure string output
- "Export" button: generates YAML and either:
  - Triggers a file download (`puzzleName.yaml`)
  - Copies YAML to clipboard
- "Save to localStorage" option: stores under a user-chosen name for quick reload

### Load & Edit Existing Puzzles

Load a YAML puzzle file into the editor for modification or remixing.

**Implementation:**
- "Load" button → file upload input (`.yaml`) or paste-YAML textarea
- Parse YAML using the existing `js-yaml` library (already loaded via CDN)
- Populate editor board from parsed clues
- Re-run validation after load

**Use cases:**
- Fix an existing puzzle with an error
- Remix a puzzle by adding/removing clues
- Use a known puzzle as a starting point for a harder variant

---

## Open Questions

1. **Difficulty rating implementation**
   `rateDifficulty()` requires a step-by-step solver that tracks which technique was used.
   The current `solver.js` uses backtracking (brute force) — it does not classify techniques.
   Options:
   - Implement a technique-aware solver (significant work, high accuracy)
   - Use hint count as a proxy: puzzles requiring more hints = harder (simpler approximation)
   - Rate based on minimum given clues as a rough heuristic

2. **Render reuse**
   `renderGrid()` in `render.js` is designed for game state, not editor state. How closely
   should editor state mirror game state to maximize render reuse vs. creating an
   editor-specific render function?

3. **YAML download vs clipboard**
   On mobile, file downloads may open in browser rather than save. Should export default to
   clipboard copy on mobile and file download on desktop? Or always offer both?

4. **Puzzle Scanner integration**
   The Puzzle Scanner will be able to populate the editor board directly. The editor's
   `placeClue()` function is the right integration point. No special work needed here beyond
   confirming the API is compatible when Scanner is built.

5. **Undo support**
   Should the editor support undo (Ctrl+Z)? A simple history stack (array of board states)
   would work well given immutable state. Worth including from the start or add later?

---

## Testing

- Verify all 81 cells accept input and display correctly
- Test duplicate detection highlights correct cells
- Test validation: known valid puzzle passes, known invalid puzzle fails
- Test uniqueness check: puzzle with two solutions is flagged
- Test difficulty rating against known puzzles with published ratings
- Test YAML export: output is valid YAML, roundtrips through the game loader
- Test load from file: valid YAML populates board correctly
- Test load from file: malformed YAML shows error without crashing

---

## Reference Materials

Place reference files in this folder:

```
plans/puzzle-editor/
├── plan.md           ← this file
└── wireframes/       ← any UI sketches or mockups
```
