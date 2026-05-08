# Changelog

All notable changes to this project are documented here.
Follow [semver](https://semver.org/): `major.minor.patch`.

- **patch** — bug fix
- **minor** — new feature, backward compatible (resets patch)
- **major** — breaking change (resets minor and patch)

---

## [1.10.0]

- Added favicons and app icons (favicon.ico, apple-touch-icon, android-chrome, mstile) with references in index.html

## [1.9.0]

- Split stylesheet into layout (geometry/spacing) and theme (colors) for better maintainability and future theme support
- Created skills/commit-changes/SKILL.md for automated versioning workflow

## [1.8.1]

- Fixed Check button incorrectly highlighting wrong cells in red; Check now only shows a status message
- Hint button now exclusively triggers red cell highlighting
- Placing a number clears hint highlighting

## [1.8.0]

- Added version display in the UI footer (`renderVersion()` in `render.js`, called from `init()` in `app.js`)
- `VERSION` constant added to `js/constants.js`
- Versioning rules and changelog requirement recorded in `AGENTS.md`

## [1.7.0]

- Suppress soft keyboard on mobile/coarse-pointer devices when tapping cells
- Cells on touch devices are set to `readOnly` to prevent keyboard activation while still allowing selection and highlighting

## [1.6.0]

- Added Hint button that highlights incorrect cells in red based on solution comparison

## [1.5.1]

- Fixed Check button to show "All values are correct" for valid partial boards instead of always flagging incomplete boards as wrong
- Check now compares current entries against the puzzle solution rather than checking for empty cells

## [1.5.0]

- Improved color palette to colorblind-safe Okabe-Ito-based scheme
- Added distinct row/column highlight (`related-line`) separate from box-only highlight (`related`)

## [1.4.0]

- Made related cells more visually distinct when a cell is selected

## [1.3.2]

- Fixed solve button marking all cells as given after solving (solved cells are now editable)

## [1.3.1]

- Replaced puzzle 005 which was unsolveable with a freshly generated valid puzzle (24 clues, unique solution)

## [1.3.0]

- Allow clicking on given (pre-filled) cells to select and highlight them
- Given cells are now read-only but no longer block pointer events

## [1.2.0]

- Fixed URL rerender bug where every hash change caused a full re-render and lost focus
- Added BigInt-based board compression — board hash is now 45 characters instead of 81

## [1.1.2]

- Fixed hash not clearing when loading a new board

## [1.1.1]

- Tests passing; UI works; puzzles 1–4 can be solved via the Solve button
- Fixed solve() mutating state; now returns new board or null (immutable)
- Fixed hashchange re-render loop (switched to `replaceState`)
- Fixed infinite focus recursion between `focusCell` and `onCellFocus`

## [1.1.0]

- Added test suite (`testharness.js`, `run-node-tests.js`, `testConfig.js`, per-module test files)

## [1.0.1]

- Added link to hosted version in readme

## [1.0.0]

- Initial commit: basic Sudoku game with puzzle loading, board rendering, number input, solve, and check
