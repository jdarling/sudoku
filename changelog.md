# Changelog

All notable changes to this project are documented here.
Follow [semver](https://semver.org/): `major.minor.patch`.

- **patch** — bug fix
- **minor** — new feature, backward compatible (resets patch)
- **major** — breaking change (resets minor and patch)

---

## [1.12.1]

- Removed duplicate STATUS_MESSAGES from app.js; now uses constants directly

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
