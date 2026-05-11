# Changelog

All notable changes to this project are documented here.
Follow [semver](https://semver.org/): `major.minor.patch`.

- **patch** — bug fix
- **minor** — new feature, backward compatible (resets patch)
- **major** — breaking change (resets minor and patch)

---

## [1.17.0]

- Standards cleanup (v1.17-standards-cleanup): guard clauses in loadNewGame, removed dead relatedCells parameter, separated device detection from rendering, added missing JSDoc @returns tags.

## [1.16.5]

- **New Game flow now offers three options**: Cancel, Clear board to givens, or load Random puzzle.
- Clear board resets all user entries while preserving the original puzzle.
- Refactored modal system: decisionModal (generic N-button foundation) → confirmModal (binary specialization) and newGameDecisionModal (3-action modal).
- All 189 automated tests pass; architecture is clean and testable.

## [1.16.4]

- Added manual board entry from the Load Puzzle flow.
- You can now paste or type a board, validate it inline, and load it instantly.
- Board links now support shareable `?board=` URLs and restore correctly on reload.
- Loading behavior was tightened so modal transitions and scrolling are consistent.
- Expanded automated coverage for board parsing, validation, and URL handling.

## [1.16.3]

- Added Load by URL from the puzzle picker.
- URL loading now validates input, shows clear errors, and keeps puzzle source URLs intact.
- Query handling was unified so URL state stays clean and predictable.
- Added tests for URL query building and URL/YAML validation.

## [1.16.2]

- Added generated metadata indexing for puzzles.
- Puzzle lookup and filtering now use metadata (id, name, level, author, description).
- Legacy and canonical URL matching became more reliable.
- Added IDs for previously colliding puzzle files.

## [1.16.1]

- Hardened puzzle token parsing and sanitization for URL inputs.
- Canonical IDs now load directly and rewrite URLs consistently.
- Legacy puzzle links are supported and auto-normalized.
- Ambiguous tokens open the Load Puzzle chooser instead of guessing.
- Hash restore now preserves fixed given cells.

## [1.16.0]

- Invalid puzzle links now fail gracefully with a clear message and a fresh blank board.

## [1.15.1]

- Added 50 new puzzles across all difficulty levels.
- Updated indexing so all puzzles are discoverable.
- Fixed URL parsing for difficulty-based puzzle paths.

## [1.15.0]

- Reorganized puzzles by difficulty folders.
- Updated loading and indexing to use the new folder structure.

## [1.14.2]

- Updated highlight terminology from box to block.
- Improved options UI with per-feature highlight toggles.
- Refined highlight styling logic for better consistency.

## [1.14.1]

- Improved subtle highlight styling across all themes.
- Refined theme style configuration and precedence behavior.
- Moved given-cell styling to the render layer.

## [1.14.0]

- Added 5 related-cell highlight modes with richer visual feedback.
- Added highlight mode controls in Options.
- Highlighting now reflects current board state more accurately.

## [1.13.5]

- Improved modal accessibility by restoring focus correctly on close.

## [1.13.4]

- Updated docs to match the current architecture and UI.

## [1.13.3]

- Replaced prompt-based loading with a full puzzle selection modal.
- Added live filtering, row selection, and styled confirm dialogs.
- Moved theme controls into an Options modal.

## [1.13.2]

- Added 7 new selectable themes.

## [1.13.1]

- Increased win celebration confetti density and coverage.

## [1.13.0]

- Reordered mobile controls for faster gameplay.
- Desktop control order remains unchanged.

## [1.12.27]

- Added confirmation before starting a new game.

## [1.12.26]

- Moved Solve back to the top control group.
- Improved mobile control layout for Solve/New/Load.
- Added confirmation before solving.

## [1.12.25]

- Moved Solve to a separate row to reduce accidental taps.

## [1.12.24]

- Startup random-load failures now show clear status feedback.

## [1.12.23]

- Updated docs with the preferred concise Node test command.

## [1.12.22]

- Added Node test runner flags for concise and status-only reporting.

## [1.12.21]

- Added a constants test stub to the shared test registry.

## [1.12.20]

- Simplified puzzle-loading flow by consolidating shared load logic.

## [1.12.19]

- Refactored random-puzzle loading for clearer orchestration.

## [1.12.18]

- Improved random-puzzle error handling with clearer failure paths.

## [1.12.17]

- Fixed hash restore to use the normal state update path.

## [1.12.16]

- Standardized random-load error messaging.

## [1.12.15]

- Consolidated number-entry logic into one shared state function.
- Added tests for the new number-entry path.

## [1.12.14]

- Removed redundant update alias and simplified related tests.

## [1.12.13]

- Inlined keyboard helper logic into DOM handlers.
- Registered intentional browser-coupled test stubs in shared config.

## [1.12.12]

- Scoped DOM tests to pure helper logic only.

## [1.12.11]

- Unified status message formatting through a single helper path.

## [1.12.10]

- Moved DOM handlers to top-level configured functions.
- Simplified app event wiring and added DOM handler test coverage.

## [1.12.9]

- Refactored init event wiring into named DOM handler factories.

## [1.12.8]

- New Game now avoids immediately repeating the current puzzle when possible.
- Added tests for exclusion and fallback behavior.

## [1.12.7]

- Added shared utility helpers and tests.
- Updated app logic to reuse shared utilities.
- Unified browser test loading with shared test config.

## [1.12.6]

- Renamed and simplified app helpers for readability.

## [1.12.5]

- Consolidated duplicated puzzle-loading code paths.

## [1.12.4]

- Fixed Load Game reset behavior so stale board state is not carried forward.
- Kept URL-based state restore intact and added regression test coverage.

## [1.12.3]

- Removed debug logging from pure state logic.
- Expanded tests for solver and conflict edge cases.

## [1.12.2]

- Maintenance release kickoff.

## [1.12.1]

- Centralized status messages and URL/hash helpers.
- Improved state/DOM separation and added state tests.
- Normalized repository line endings to LF.

## [1.12.0]

- Start of the 1.12 feature line.

## [1.11.10]

- Confetti now appears only on true puzzle completion.

## [1.11.9]

- Added non-blocking confetti celebration on win.
- Prevented repeat celebration triggers.

## [1.11.8]

- Reordered mobile controls for gameplay priority.
- Desktop layout stayed the same.

## [1.11.7]

- Removed legacy status mapping code and dead constants.

## [1.11.6]

- Simplified status formatting logic with no behavior change.

## [1.11.5]

- Moved status templates into shared constants.

## [1.11.4]

- Status messages now include the active puzzle name.

## [1.11.3]

- Tightened spacing to keep the game board front and center.
- Increased board cell size slightly and toned down version display.

## [1.11.2]

- Improved responsive layout and control alignment on mobile and desktop.

## [1.11.1]

- Optimized mobile keypad layout to reduce scrolling.

## [1.11.0]

- Added responsive desktop game layout.
- Added Load Game by puzzle ID.
- Renamed New Puzzle to New Game.

## [1.10.4]

- Improved dark theme contrast for better colorblind accessibility.

## [1.10.3]

- Fixed theme switching so visual styles refresh immediately.

## [1.10.2]

- Added theme system with a picker and saved user preference.
- Added theme management module and documentation for future themes.

## [1.10.1]

- Fixed highlight and button styling regressions after stylesheet split.

## [1.10.0]

- Added favicon and app icon support across platforms.

## [1.9.0]

- Split styling into layout and theme layers for maintainability.

## [1.8.1]

- Check now reports status only; Hint owns wrong-cell highlighting.
- Entering a number clears hint highlights.

## [1.8.0]

- Added in-app version display in the footer.
- Added centralized version constant and workflow documentation.

## [1.7.0]

- Reduced accidental mobile keyboard pop-ups while keeping cell selection.

## [1.6.0]

- Added Hint button to highlight incorrect entries.

## [1.5.1]

- Fixed Check for partial-but-correct boards.
- Check now validates entered values against the solution.

## [1.5.0]

- Improved colorblind-safe palette and clearer related-cell highlights.

## [1.4.0]

- Increased visual distinction for related selected cells.

## [1.3.2]

- Fixed Solve so auto-filled cells remain editable.

## [1.3.1]

- Replaced unsolveable puzzle 005 with a valid one.

## [1.3.0]

- You can now select and highlight given cells.

## [1.2.0]

- Fixed hash-change rerender/focus issues.
- Compressed board hash URLs significantly.

## [1.1.2]

- Fixed stale hash values when loading a new board.

## [1.1.1]

- Fixed multiple early stability issues (immutability, hash loop, focus recursion).
- Confirmed baseline puzzle solve behavior.

## [1.1.0]

- Added automated test suite and shared test infrastructure.

## [1.0.1]

- Added hosted app link to README.

## [1.0.0]

- Initial release: core Sudoku play, loading, solving, and checking.
