# Scorecard Functionality — Implementation Plan

## Goal

Add a per-game scorecard that tracks player assistance usage and move behavior using separate indicators.

The scorecard is intended to reward cleaner solves (fewer assists/errors) while preserving transparency by keeping every tracked metric visible.

---

## Requirements Captured

Track these values separately for each game:

- Puzzle identity for the run (`puzzleId`, `puzzleHash`)
- Support options ever used during the run
- Number of Check button uses
- Number of Hint button uses
- Number of immediate-error displays
- Number of error-cell displays
- Total number of moves

---

## Clarified Definitions

### First move

First move means the first successful non-zero placement into a non-given cell.

- Attempts blocked by given cells do not count
- Selection-only actions do not count
- Clear actions (`0`) do not trigger first-move state

### Move

A move is a successful user board mutation on a non-given cell:

- Place digit 1-9 in editable cell
- Overwrite existing user-entered value with a different non-zero value
- Clear an already placed user-entered value (`0`)

### Support checks

Support checks are all currently selected options in `highlightFeatures`.

For score recording:

- Track which support options were used at any time during the run

Rationale: support options materially change solve behavior, so the run must record the exact options used.

Scorecard scope rule:

- A scorecard is scoped to one board run
- Each new board run starts a fresh scorecard
- Support options used are accumulated for the run

### Error display events

Use event-level counting, not render-level counting:

- Count when an action causes error information to become shown
- Do not increment repeatedly on unrelated rerenders

### Metric Update Contract

Each metric uses this contract:

- Trigger: which action path can update it
- Boundary: when in that action path it is evaluated
- Update: increment behavior
- Exclusions: explicit non-updating cases

`checkClickCount`

- Trigger: Check button handler
- Boundary: handler entry after guard clauses pass
- Update: `+1` per accepted click
- Exclusions: early-return guard paths

`hintClickCount`

- Trigger: Hint button handler
- Boundary: handler entry after guard clauses pass
- Update: `+1` per accepted click
- Exclusions: early-return guard paths

`moveCount`

- Trigger: number placement/overwrite/clear on editable cell
- Boundary: after move attempt resolves
- Update: `+1` per successful board mutation
- Exclusions: given-cell edits, no-op writes of same value, rejected inputs

`immediateErrorShownCount`

- Trigger: post-move immediate-error evaluation path
- Boundary: after deriving next visual/error state
- Update: `+1` once per hidden->visible transition
- Exclusions: state stays visible, state stays hidden, rerender-only updates

`errorCellShownCount`

- Trigger: Check/Hint result evaluation path
- Boundary: after deriving next visual/error state
- Update: `+1` once per hidden->visible transition
- Exclusions: state stays visible, state stays hidden, rerender-only updates

`errorShownCount`

- Trigger: `recordErrorShown(scorecard, errorType)`
- Boundary: inside `recordErrorShown`
- Update: always `+1` for each valid error event
- Exclusions: invalid `errorType` values

`supportOptionsUsed`

- Trigger: support option checkbox change path
- Boundary: after current feature list is read
- Update: union current options into `supportOptionsUsed`
- Exclusions: duplicate options already present (no additional entry)

`startedAt`

- Trigger: scorecard initialization path
- Boundary: when initial run context is applied
- Update: set once to current ISO datetime
- Exclusions: already-set `startedAt`

`firstMoveAt`

- Trigger: successful move path
- Boundary: after first successful move is confirmed
- Update: set once to current ISO datetime
- Exclusions: already-set `firstMoveAt`

`completedAt`

- Trigger: finalize/disqualify path
- Boundary: when run terminal state is applied
- Update: set to current ISO datetime
- Exclusions: action rejected by earlier guard clauses

---

## Architecture Alignment

Follow existing separation of concerns:

- `js/scorecard.js`: pure scorecard unit (creation, mutation, lifecycle, identity/context keys)
- `js/state.js`: game-board state only; no scorecard logic
- `js/dom.js`: action handlers that trigger state transitions
- `js/app.js`: orchestration, reset points, and scorecard storage wiring
- `js/render.js`: visual scorecard rendering only
- `js/options.js` / `js/components/optionsmodal.js`: notify state when support checks change

No DOM calls from state functions.

Scorecard is a distinct support unit and must not be implemented as `state.js` helper logic.

---

## Proposed State Shape

Store scorecard as a dedicated run object in app state/orchestration:

```javascript
scorecard: {
  puzzleId: string,
  puzzleHash: string,
  startedAt: string,
  firstMoveAt: string,
  completedAt: string,
  isFrozen: boolean,
  isDisqualified: boolean,
  disqualifyReason: string,

  moveCount: number,
  checkClickCount: number,
  hintClickCount: number,
  immediateErrorShownCount: number,
  errorShownCount: number,
  errorCellShownCount: number,
  supportOptionsUsed: string[],
}
```

### Scorecard Mutation Type Contract

`mutateScorecard(scorecard, mutations)` accepts a partial `ScorecardMutation` object.

```javascript
ScorecardMutation: {
  puzzleId?: string,
  puzzleHash?: string,
  startedAt?: string,
  firstMoveAt?: string,
  completedAt?: string,
  isFrozen?: boolean,
  isDisqualified?: boolean,
  disqualifyReason?: string,
  moveCount?: number,
  checkClickCount?: number,
  hintClickCount?: number,
  immediateErrorShownCount?: number,
  errorShownCount?: number,
  errorCellShownCount?: number,
  supportOptionsUsed?: string[],
}
```

Allowed value transitions:

- `startedAt`: `'' -> <iso-string>` exactly once
- `firstMoveAt`: `'' -> <iso-string>` exactly once
- `completedAt`: `'' -> <iso-string>`, then `<iso-string> -> <iso-string>`
- `disqualifyReason`: `'' -> 'solve-used'` when disqualified

Rejected mutations:

- `startedAt`: `<iso-string> -> <iso-string>`
- `startedAt`: `<iso-string> -> ''`
- `firstMoveAt`: `<iso-string> -> ''`
- `firstMoveAt`: `<iso-string> -> <iso-string>`
- `completedAt`: `<iso-string> -> ''`
- `disqualifyReason`: non-empty -> `''` while `isDisqualified === true`

### Scorecard Member Reference

Each member is tracked because it describes a different dimension of run quality.

- `startedAt`: Run start datetime (ISO 8601 string). Useful for elapsed-time calculations and historical ordering.
- `puzzleId`: Puzzle identifier for the run. Useful for user-facing reference.
- `puzzleHash`: Stable hash of `puzzleId` + starting board digits. Useful for exact starting-state identity and anti-tamper context.
- `firstMoveAt`: First committed non-zero move datetime (ISO 8601 string). Useful for first-move gating rules.
- `completedAt`: Run completion/disqualification datetime (ISO 8601 string). Useful for lifecycle audit and duration.
- `isFrozen`: Lock flag after terminal outcome. Useful to prevent post-finish stat drift.
- `isDisqualified`: Eligibility flag for scorecard validity. Useful to mark invalid runs.
- `disqualifyReason`: Machine-readable disqualification code. Useful for consistent UI messaging and analytics.
- `moveCount`: Total successful board mutations.
- `checkClickCount`: Number of times Check was clicked.
- `hintClickCount`: Number of times Hint was clicked.
- `immediateErrorShownCount`: Number of times immediate-error feedback was shown.
- `errorShownCount`: Total number of error displays shown (aggregate of immediate + error-cell events).
- `errorCellShownCount`: Number of times error-cell highlights were shown.
- `supportOptionsUsed`: Unique list of support option names used in the run.

---

## Pure Functions To Add (`js/scorecard.js`)

- `mutateScorecard(scorecard, mutations)`
- `combineHighlightFeatures(featureSetA, featureSetB)`
- `createPuzzleHash({ puzzleId, startingBoardDigits })`
- `createInitialScorecard({ highlightFeatures, puzzleId, startingBoardDigits, startedAt })`
- `recordSupportChecksChange(scorecard, highlightFeatures, nowIso)`
- `recordMove(scorecard, { isClear, nowIso })`
- `recordCheckClick(scorecard)`
- `recordHintClick(scorecard)`
- `recordErrorShown(scorecard, errorType)`
- `finalizeScorecard(scorecard, nowIso)`

`recordErrorShown(scorecard, errorType)` contract:

- Valid `errorType` values are: `'immediate' | 'error-cell'`
- Mapping:
  - `'immediate'` -> increment `immediateErrorShownCount` and `errorShownCount`
  - `'error-cell'` -> increment `errorCellShownCount` and `errorShownCount`
- `errorShownCount` is aggregate only; it must equal immediate + error-cell event counts.

All functions return a new immutable `scorecard` object.

`mutateScorecard(scorecard, mutations)` is the single low-level scorecard update primitive.

- Input: current scorecard + partial mutation object
- Output: latest scorecard instance (new object)
- Rule: never mutate the original scorecard object
- Guard: first check `scorecard.isFrozen`; if true, return scorecard unchanged

Higher-level scorecard helpers (`recordMove`, `recordCheckClick`, etc.) should build mutation objects and delegate object creation to `mutateScorecard`.

Boundary rule:

- Scorecard functions operate only on `scorecard`
- App orchestration stores the latest scorecard instance and creates next app state from it
- Never pass full app `state` into scorecard helpers

Ownership rule:

- `js/scorecard.js` owns all scorecard behavior
- `js/state.js` owns only board/game transformations
- Shared fields in app state are storage/orchestration only, not behavioral ownership

This keeps scorecard logic independently testable without requiring a full game-state fixture.

`combineHighlightFeatures(featureSetA, featureSetB)` returns the OR-combination (set union) of two highlight feature sets.

- Input: two highlight feature collections
- Output: deduplicated union of both collections
- Rule: feature history is cumulative for the run

This preserves the complete set of features used during a run even if users toggle options repeatedly.

`createPuzzleHash({ puzzleId, startingBoardDigits })` returns a stable deterministic puzzle hash.

- Input: `puzzleId` + canonical starting board digits for the run (givens layout)
- Output: stable hash string (`puzzleHash`)
- Rule: same `puzzleId` + same starting board digits must always produce the same hash

Hash approach (browser):

- Use `crypto.subtle.digest('SHA-256', ...)` on canonical input string: `<puzzleId>|<startingBoardDigits>`
- Encode as lowercase hex
- Optional display form: first 12-16 chars for UI, full hash for storage/audit

Why this approach:

- Fast in browser for fixed small input (81 chars + id)
- One-way and not practically reversible
- Built-in Web Crypto API, no extra dependency

Use guard clauses; no else blocks.

---

## Event Wiring Plan

### Check button

In `onCheckButtonClick`:

1. Read current scorecard, call `recordCheckClick(scorecard)`, store returned latest scorecard instance
2. Run `checkSolution(state, true)`
3. If resulting state shows error-cell highlights, call `recordErrorShown(scorecard, 'error-cell')`

### Hint button

In `onHintButtonClick`:

1. Read current scorecard, call `recordHintClick(scorecard)`, store returned latest scorecard instance
2. Run `hintBoard(state)`
3. If resulting state shows error-cell highlights, call `recordErrorShown(scorecard, 'error-cell')`

### Move events

At number placement / clear pathways (`applyNumber`, `placeNumber`, `clearCellValue` routes):

- Read current scorecard, call `recordMove(scorecard, { ... })`, store returned latest scorecard instance on successful move transition
- Trigger first-move timestamp once

### Support check toggle changes

When highlight feature checkboxes change in options modal:

- Read current scorecard
- Combine current features with cumulative history via `combineHighlightFeatures`
- Update `supportOptionsUsed`
- Store returned latest scorecard instance

### Immediate/error visual displays

Count transitions into visibility states, not every render cycle.

- Immediate errors: when a move/input transition causes immediate-error highlight visibility to change from hidden -> visible, call `recordErrorShown(scorecard, 'immediate')` once for that transition.
- Error cells: when Check/Hint transition causes error-cell highlight visibility to change from hidden -> visible, call `recordErrorShown(scorecard, 'error-cell')` once for that transition.

---

## Lifecycle Rules

Reset scorecard on:

- New random puzzle
- Puzzle load from list
- Puzzle load from URL
- Puzzle load from board input
- Any action that starts a new board run

Board-run rule:

- A scorecard belongs to one board run only
- Starting a new board always creates a cleared scorecard
- A new board run must create a new `puzzleHash`

Freeze scorecard on terminal states:

- Puzzle solved
- Full solve action used (`Solve` button)

Solved freeze boundary:

- In orchestration (`js/app.js`), after applying an action and deriving next board state, if solved is detected for that next state, call `finalizeScorecard(scorecard, nowIso)` in the same update cycle before storing/rendering next state.
- Solve-button path remains disqualify first, then finalize/freeze in that same action cycle.

When frozen:

- Keep counters unchanged
- Keep indicators unchanged

Disqualification rule:

- Clicking `Solve` immediately disqualifies the run from scorecard usage
- Set `isDisqualified = true`
- Set `disqualifyReason = 'solve-used'`
- No aggregate score is recorded for this run
- Keep this run marked as scorecard-invalid

Persistence/security rule:

- Do not persist scorecard data in URL query/hash for now
- Rationale: URL/hash values are trivially user-editable and not trustworthy for score history
- Future: revisit persistence when authenticated identity/login exists

---

## Indicator Interpretation

There is no single `finalScore` value.

Reasoning:

- A single static total hides trade-offs between indicators (for example low moves but very high hint use).
- Weighting choices are subjective and can obscure indicator meaning.
- The project goal is transparent, explainable indicators rather than one opaque number.

All scorecard fields are individual indicators of success/failure and should be reviewed together.

---

## Testing Plan

Add focused tests in `js/scorecard.test.js`, `js/dom.test.js`, and any relevant render tests.

Required cases:

- `createPuzzleHash` is deterministic for identical `puzzleId` + starting board digits
- Recorded puzzle identity remains stable (`puzzleHash`) for identical starting input
- First move triggers once on first successful non-zero editable placement
- `combineHighlightFeatures` returns a correct deduplicated union for any two feature sets
- `supportOptionsUsed` retains features previously used even when later toggled off
- Check/Hint click counters increment exactly once per click
- Immediate/error displays count only on visibility transitions
- `recordErrorShown` accepts only `'immediate' | 'error-cell'` and maps to the correct counter field
- `errorShownCount` is incremented on every valid `recordErrorShown` call as the aggregate total
- Move counter ignores blocked edits to given cells
- Move counter increments when clearing an already placed user-entered value
- Reset behavior on each load path
- Frozen scorecard does not change on post-complete events
- Solve action immediately disqualifies the run and clears score eligibility
- Puzzle-solved path finalizes/freezes in the same orchestration update cycle where solved is detected
- Scorecard helpers are unit-testable with scorecard-only fixtures (no full app state required)

Run tests with:

`node tests/run-node-tests.js --report-only-failures --report-status`

---

## Reference

Implementation file for this feature plan:

- `plans/scorecard/plan.md`

---

# Phase 2: Scorecard Display Modal on Game Completion

## Goal

When a player solves a puzzle, optionally show a modal that displays the collected scorecard metrics. This allows players to review their performance after completion.

Add a new checkbox option "Show stats on solved" to the options menu. When enabled and the puzzle is solved, display a stats modal with all scorecard metrics in a clear, readable format.

---

## Requirements Captured

- Add new checkbox setting `showStatsOnSolved` to options
- Persist this preference across game sessions (existing settings storage)
- When puzzle reaches solved state AND `showStatsOnSolved === true`, display scorecard modal
- Modal displays all scorecard metrics in a readable layout
- Modal includes elapsed time calculation (from `startedAt` to `completedAt`)
- Modal includes a "Close" button to dismiss
- Modal does not appear if puzzle was disqualified via Solve button
- User can disable the modal via the checkbox without restarting game

---

## Architecture Alignment

Follow existing separation of concerns:

- `js/options.js`: read/write `showStatsOnSolved` setting to persisted options
- `js/components/scoreboardmodal.js` (new): scorecard modal component following existing modal pattern
- `js/render.js`: render scoreboard modal when triggered
- `js/app.js`: orchestration to trigger modal display when solved + option enabled
- `js/state.js`: no changes required
- `js/scorecard.js`: no changes required (Phase 1 data already available)

Modal follows existing component pattern used by `optionsmodal.js`, `confirmmodal.js`, etc.

No DOM calls from state functions.

---

## Proposed State Shape

Add to app settings (existing `settings` object):

```javascript
settings: {
  // ... existing settings ...
  showStatsOnSolved: boolean, // default: true
}
```

No changes to scorecard state shape (Phase 1 unchanged).

App state orchestration to track when to show modal:

```javascript
ui: {
  // ... existing ui state ...
  showScorecardModal: boolean, // true when modal should be visible
  modalScorecard: scorecard | null, // reference to scorecard data for modal display
}
```

---

## New Component: Scorecard Modal (`js/components/scoreboardmodal.js`)

The scorecard modal is a new stateless component following the existing modal architecture.

**Shape:**

```javascript
/**
 * Create a scorecard modal element.
 * @param {Object} scorecard - The completed scorecard with metrics
 * @param {Function} onClose - Callback when Close button is clicked
 * @returns {HTMLElement} - Modal DOM element
 */
const createScorecardModal = (scorecard, onClose) => {
  // Build modal with scorecard metrics displayed
};
```

**Display format:**

- Title: "Game Complete — Your Stats"
- Two-column layout or stacked card display:
  - **Game Info:** Puzzle ID, elapsed time (from `startedAt` to `completedAt`)
  - **Performance Metrics:**
    - Moves: `moveCount`
    - Check uses: `checkClickCount`
    - Hint uses: `hintClickCount`
  - **Feedback Indicators:**
    - Immediate errors: `immediateErrorShownCount`
    - Error cell highlights: `errorCellShownCount`
    - Total errors: `errorShownCount`
  - **Support Features Used:** comma-separated list of `supportOptionsUsed` (or "None" if empty)
- "Close" button at bottom

**Time calculation:**

- Compute elapsed milliseconds: `new Date(scorecard.completedAt) - new Date(scorecard.startedAt)`
- Format as human-readable duration: "2 minutes 34 seconds" or "45 seconds"

**Styling:**

- Follow existing modal CSS patterns from `style/layout.css`
- Use `modal` class + theme-aware styling
- Ensure readability with adequate spacing and font sizes

---

## UI Changes

### Options Modal

Add checkbox to `js/components/optionsmodal.js`:

- Label: "Show stats on solved"
- Input type: checkbox
- Linked to `settings.showStatsOnSolved`
- Default: checked (`true`)
- Position: logical grouping (near other gameplay preference options)

Update existing options-change handler to update this setting when toggled.

---

## Pure Functions To Add (`js/options.js`)

- `formatElapsedTime(startedAtIso, completedAtIso)` → human-readable duration string
- `createMetricsDisplay(scorecard)` → formatted object with all metrics for modal display

### `formatElapsedTime(startedAtIso, completedAtIso)`

- Input: two ISO 8601 datetime strings
- Output: string like "2 minutes 34 seconds" or "45 seconds"
- Rule: always include minutes and seconds (even if minutes = 0: "0 minutes 34 seconds")
- Precision: whole seconds only (no milliseconds in display)

### `createMetricsDisplay(scorecard)`

- Input: scorecard object
- Output: object with all metrics formatted for display:
  ```javascript
  {
    puzzleId: string,
    elapsedTime: string (from formatElapsedTime),
    moveCount: number,
    checkClickCount: number,
    hintClickCount: number,
    immediateErrorShownCount: number,
    errorCellShownCount: number,
    errorShownCount: number,
    supportOptionsUsed: string[] (or ["None"]),
    startedAt: string (ISO),
    completedAt: string (ISO),
  }
  ```

All functions return new objects; no mutations.

---

## Event Wiring Plan

### Puzzle Solved Detection

In `js/app.js` orchestration:

1. After board state transitions to solved (same cycle as Phase 1 finalize):
2. Check `currentState.solved === true`
3. Check `settings.showStatsOnSolved === true`
4. Check `scorecard.isDisqualified === false` (do not show modal for disqualified runs)
5. If all true:
   - Update app UI state: `showScorecardModal = true`, `modalScorecard = scorecard`
   - Render the scorecard modal via `render.js`

### Close Button Handler

In `js/app.js`:

- `onCloseScorecardModal` handler sets `showScorecardModal = false` and re-renders
- Clicking close removes the modal but does NOT reset the scorecard (it remains completed)
- User can close and then view scorecard data later if needed (future phases)

### Toggle Option Handler

When user toggles "Show stats on solved" checkbox:

- Update `settings.showStatsOnSolved` in options modal handler
- Persist to settings storage (existing mechanism)
- No immediate UI change if puzzle already solved (modal has already been shown or skipped)

---

## Rendering (`js/render.js`)

Add rendering logic:

```javascript
/**
 * Render scorecard modal if showScorecardModal is true.
 * @param {Object} state - Full app state
 */
const renderScorecardModal = (state) => {
  if (!state.ui.showScorecardModal || !state.ui.modalScorecard) {
    // Remove modal if shown
    return;
  }
  // Create and insert modal into DOM
  const modal = createScorecardModal(
    state.ui.modalScorecard,
    onCloseScorecardModal,
  );
  // Insert into modal container or overlay
};
```

Call `renderScorecardModal` from main render orchestration (existing `render()` function calls).

---

## Testing Plan

Add focused tests in `js/components/scoreboardmodal.test.js` and integration tests in `js/dom.test.js` and `js/app.test.js`.

Required cases:

- `formatElapsedTime` correctly calculates and formats elapsed time for various durations:
  - Less than 1 minute: "0 minutes 45 seconds"
  - Exactly 1 minute: "1 minute 0 seconds"
  - Multiple minutes: "3 minutes 22 seconds"
  - Edge case: very large elapsed time (hour+)
- `createMetricsDisplay` formats all scorecard fields correctly
- `createMetricsDisplay` handles empty `supportOptionsUsed` array (displays "None")
- `createScorecardModal` creates a valid DOM element with all metrics visible
- `createScorecardModal` includes Close button that calls onClose callback
- Scorecard modal is shown when:
  - Puzzle solved AND
  - `showStatsOnSolved === true` AND
  - `scorecard.isDisqualified === false`
- Scorecard modal is NOT shown when:
  - Puzzle solved but `showStatsOnSolved === false`
  - Puzzle disqualified (Solve button used)
- Close button handler removes modal from DOM
- Elapsed time in modal matches calculated duration
- Settings checkbox "Show stats on solved" persists across page reload
- Toggling option checkbox updates settings correctly
- Modal styling integrates with existing modal CSS without conflicts
- Modal is accessible (proper focus management, keyboard dismiss if desired)

Run tests with:

`node tests/run-node-tests.js --report-only-failures --report-status`
