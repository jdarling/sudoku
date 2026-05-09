# Changelog

All notable changes to this project are documented here.
Follow [semver](https://semver.org/): `major.minor.patch`.

- **patch** — bug fix
- **minor** — new feature, backward compatible (resets patch)
- **major** — breaking change (resets minor and patch)

---

## [1.13.5]

- Fixed `aria-hidden` accessibility warning: `modal.js` now records the focused element on open and restores focus on close via a `WeakMap`, so focus is never trapped inside a hidden modal

## [1.13.4]

- Updated `readme.md`: corrected project structure, How to Play, and Features to reflect current UI and module layout
- Updated `docs/design.md`: added `utils.js`, `theme.js`, `dom.js`, and `js/components/` module documentation; removed stale handler references from `app.js` section

## [1.13.3]

- Replaced prompt-based `Load Game` flow with a full-screen modal selector showing all available puzzles
- Modal includes a live filter by puzzle ID or filename, row selection, and `Cancel`/`Select` actions
- Extracted modal logic into a `js/components/` folder: `modal.js` (generic open/close), `table.js` (filterable row rendering), `loadmodal.js` (load puzzle modal using both)
- Replaced native `confirm()` dialogs for New Game and Solve with a styled Yes/No modal (`js/components/confirmmodal.js`)
- Confirm modal uses the same CSS variables and visual chrome as the load modal; Escape → No, Enter → Yes
- Moved theme selection into an Options modal (`js/components/optionsmodal.js`); replaced the inline theme row with an Options button

## [1.13.2]

- Added seven new selectable themes: Terminal, Sepia/Vintage, Forest, Ocean/Water, Sunset, High Contrast, and Cyberpunk/Neon
- Registered all new themes in the theme selector and theme allowlist

## [1.13.1]

- Increased win celebration confetti so win effects fill the full screen with a denser burst

## [1.13.0]

- Swapped mobile control groups so `Check`/`Hint` appear above the keypad and `Solve`/`New Game`/`Load Game` appear below it
- Kept desktop control ordering unchanged

## [1.12.27]

- Added a confirmation prompt on `New Game` to clearly warn that current progress will be lost

## [1.12.26]

- Repositioned `Solve` back into the top control group and removed the separate lower `solve-row` layout
- Updated mobile top controls to `Solve`, `New`, `Load` with `Solve` full-width on row 1 and `New`/`Load` half-width on row 2
- Added a confirmation prompt before applying `Solve` to prevent accidental one-tap full-board solves

## [1.12.25]

- Moved `Solve` out of the top control cluster into its own lower `solve-row` to reduce accidental clicks near the number pad

## [1.12.24]

- Added missing `try/catch` around `loadNewGame` random puzzle startup path so failures update user-visible status instead of only bubbling to init-level console logging

## [1.12.23]

- Updated root `readme.md` with preferred Node test command: `node tests/run-node-tests.js --report-only-failures --report-status`
- Updated `AGENTS.md` to require runner-flag-based concise test reporting and prohibit `tail`/`grep` truncation patterns

## [1.12.22]

- Added Node test runner flags in `tests/run-node-tests.js`: `--report-only-failures`, `--report-status`, and `--help`
- Added runner flag usage examples to `tests/README.md`

## [1.12.21]

- Added `constants.test.js` as an intentional-blank test stub and registered it in shared test configuration

## [1.12.20]

- Simplified puzzle-loading orchestration in app.js by replacing `loadFetchedRandomPuzzle` with a shared `loadFetchedPuzzle` path used by both `loadPuzzleByFilename` and `loadRandomPuzzle`
- Removed nested random-puzzle error handling complexity while preserving puzzle-specific error names

## [1.12.19]

- Extracted random-puzzle post-fetch work into `loadFetchedRandomPuzzle(puzzle)` for clearer orchestration and named inner error handling

## [1.12.18]

- Refactored `loadRandomPuzzle` to use nested `try/catch`: outer catch handles `getRandomPuzzle` failures, inner catch handles `createStateFromPuzzle`/`updateQuery`/`loadGame` failures with puzzle-specific name extraction

## [1.12.17]

- Fixed `applyBoardStateFromHash` to route through `updateState` instead of directly mutating `currentState` and manually re-rendering

## [1.12.16]

- Fixed `loadRandomPuzzle` error path to use `formatString` + `STATUS_MESSAGES` consistently with all other error paths

## [1.12.15]

- Extracted duplicated number-placement logic from dom.js into `applyNumber(state, num)` in state.js
- Both `onCellKeydown` and `onNumberButtonClick` now delegate to `applyNumber`
- Added tests for `applyNumber` in state.test.js

## [1.12.14]

- Removed `updateCellValue` alias from state.js; callers in dom.js now call `placeNumber` directly
- Removed redundant `updateCellValue` test; `clearCellValue` test updated to use `placeNumber` for setup

## [1.12.13]

- Removed pure helper functions (handleNumberKey, handleDeleteKey, handleArrowKey) from dom.js; logic inlined directly into DOM event handlers where it belongs
- dom.test.js, render.test.js, and theme.test.js are intentional-blank stubs — these modules are entirely browser-coupled and untestable outside a real browser
- Registered render.test.js and theme.test.js in testConfig.js

## [1.12.12]

- Removed browser-interaction tests from dom.test.js (event handlers, prompt(), window.location are not testable outside the browser)
- dom.test.js now covers only the three pure helpers: handleNumberKey, handleDeleteKey, handleArrowKey

## [1.12.11]

- Unified load status formatting path in app orchestration to use shared `formatPuzzleStatus` helper
- Removed direct loaded-status template interpolation from `loadGame` for cleaner single-path status formatting

## [1.12.10]

- Replaced closure-based DOM handler factories with top-level DOM handlers configured via `configureDomEventHandlers`
- Moved remaining app cell event handlers into `js/dom.js` (`onCellFocus`, `onCellKeydown`, `onCellInput`)
- Updated app init to register named DOM handlers with no inline listener lambdas
- Added `js/dom.test.js` and wired it into browser/node runners for custom DOM handler logic coverage

## [1.12.9]

- Moved init-registered UI/window event handlers to `js/dom.js` as named top-level handler factories
- Replaced inline listener lambdas in `js/app.js` `init()` with registered handler functions created from dom helpers
- Added state-curried registration wiring in app orchestration for check/hint/solve/theme/new/load/number/popstate/hashchange handlers

## [1.12.8]

- New Game now avoids selecting the currently loaded puzzle when alternatives exist
- Added puzzle-layer tests for excluded random selection and single-puzzle fallback behavior

## [1.12.7]

- Extracted pure string and puzzle-id helpers into `js/utils.js` (`formatString`, `extractPuzzleId`, `normalizePuzzleId`, `formatPuzzleStatus`)
- Added comprehensive utils unit tests in `js/utils.test.js`
- Updated app orchestration to use shared utils helpers instead of duplicating pure logic
- Fixed browser test runner to use shared `tests/testConfig.js` list instead of a hardcoded test array
- Loaded `js/utils.js` in runtime `index.html` to support app usage

## [1.12.6]

- Simplified app.js method names: finalizeGameLoad → loadGame, formatStatusWithPuzzleName → formatPuzzleStatus
- Removed redundant renderStatus wrapper for cleaner call stack
- Improved code readability with no functional changes

## [1.12.5]

- Consolidated puzzle-loading logic into shared finalizeGameLoad helper
- Removed duplicate rendering/status code from loadPuzzleByFilename, loadNewGame, loadRandomPuzzle
- Improved code maintainability with no user-visible changes

## [1.12.4]

- Fixed Load Game not fully resetting board state: now clears hash on load instead of restoring stale board from previous puzzle
- URL-based state persistence (query + hash) still works correctly on initial page load
- Added state test to verify all fields reset when loading a new puzzle

## [1.12.3]

- Removed debug logging from state-layer solve logic to keep business logic side-effect free
- Added pure-logic test coverage for solver edge cases (unsolveable and already-complete boards)
- Added pure-logic test coverage for state conflict detection and wrong-cell edge cases
- Expanded Node test runner exports for state helpers used by the logic test suite

## [1.12.2]

- Start 1.12.2 development line after tagging 1.12.1

## [1.12.1]

- Removed duplicate STATUS_MESSAGES from app.js; now uses constants directly
- Extracted URL/query/hash persistence functions from app orchestration into js/dom.js
- Added explicit state mutation helpers in js/state.js and moved keyboard handler orchestration to js/dom.js
- Added state tests for updateCellValue(), clearCellValue(), and moveSelection()
- Normalized repository line endings to LF and enforced LF via .gitattributes

## [1.12.0]

- Start of 1.12 feature branch line (`feat/v1.12`) from stable 1.11.10 baseline

## [1.11.10]

- Fixed win celebration trigger so confetti only appears for true solved-puzzle state
- Prevented confetti from triggering on Hint/Check "all values currently correct" messages

## [1.11.9]

- Added non-blocking confetti burst when a puzzle enters a win state
- Celebration triggers only on transition into win to avoid repeated bursts during normal updates
- Kept solved board fully visible and interactive while celebrating

## [1.11.8]

- Reordered mobile controls to prioritize gameplay: Check/Hint first, number pad second, New/Load/Solve third
- Kept desktop control order unchanged to preserve current wide-screen workflow
- Implemented via CSS ordering for minimal structural complexity

## [1.11.7]

- Removed unused status lookup structures from app orchestration after dictionary migration
- Consolidated status template usage to the single STATUS_MESSAGES dictionary
- Cleaned up dead constants related to legacy status mapping

## [1.11.6]

- Refactored status formatting in app orchestration to use a message-to-template map
- Removed repetitive conditionals in puzzle-name status rendering without changing behavior
- Improved maintainability of status rendering logic

## [1.11.5]

- Moved puzzle status message templates into shared constants for centralized management
- Updated app status rendering to use template constants instead of inline hardcoded strings
- Preserved existing user-visible status behavior while making templates easier to maintain

## [1.11.4]

- Status bar now shows the loaded puzzle name when using New Game or Load Game
- Gameplay status messages now include the active puzzle name for Check, Hint, and Solve outcomes
- Example success format: All values for "<puzzleName>" are correct!

## [1.11.3]

- Removed excessive padding and margins to maximize game focus
- Reduced vertical gaps throughout layout (app gap, game-shell gap, control-panel gap)
- Reduced top/bottom body padding from 2rem to 0.4rem
- Increased cell sizes from 48px to 50px to fill recovered space
- Made version display subtle with reduced opacity
- Status message area preserved for gameplay feedback

## [1.11.2]

- Simplified action buttons layout by converting from flex to 2-column grid (Check, Hint)
- Added responsive desktop media queries for 980px+ screens: board on left, controls fixed-width on right
- Optimized button sizing for desktop: 3-column keypad, full-width action buttons, Erase spans full width
- Improved spacing and alignment for both mobile and desktop layouts

## [1.11.1]

- Optimized mobile layout by restructuring number keypad grid from flex to 5-column layout (buttons 1-5 top row, 6-9+Erase bottom row)
- Eliminates scrollbars on tall mobile screens by reducing vertical space consumption

## [1.11.0]

- Restructured layout to support responsive desktop view: board on left, controls on right (desktop width 980px+)
- Added Load Game button to allow users to load puzzles by ID (accepts formats: 001, puzzles/001, puzzles/001.yaml)
- Reorganized controls structure with separate #game-shell wrapper and #control-panel for better layout management
- Renamed "New Puzzle" button to "New Game" for consistency

## [1.10.4]

- Improved dark theme accessibility for colorblind users by increasing contrast and using more distinguishable colors for selected, related-line, related, same-num, and wrong cell states

## [1.10.3]

- Fixed theme picker not updating visual styles - now properly removes and replaces stylesheet link to force browser reload

## [1.10.2]

- Added theme system with theme picker UI
- Users can now switch between Default and Dark themes
- Theme preference is saved to localStorage and persists across sessions
- Created comprehensive theming documentation in `docs/theming.md` for future theme additions
- Added `js/theme.js` module for theme management (switching, persistence)
- Architecture supports easy addition of new themes without duplicating layout CSS

## [1.10.1]

- Fixed broken cell highlighting after stylesheet split in 1.9.0: restored all Okabe-Ito colors, added missing `related-line` class for row/column highlights, restored `#hint-btn` and `#version` styling in both default and dark themes, removed conflicting `pointer-events: none` from given cells

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
