# Agents and AI Assistance — Guidelines

This document explains how to work with AI agents (like Copilot) on this project. It ensures consistency with project standards and architectural principles.

## Before You Start

1. **Read the architecture** — Understand [docs/design.md](docs/design.md)
2. **Know the standards** — Coding standards are in `standards/coding/`
3. **One change at a time** — Use the todo list to break work into clear steps
4. **Verify the current state** — Always read files before editing; formatters may have changed them

## Architecture Constraints

An agent must respect these non-negotiable principles:

### Pure Functions

- All business logic must be pure: no side effects, no global state access
- Functions must take inputs and return outputs
- Use spread operators for immutable state (`{ ...state, selected: 3 }`)
- Test the same function in isolation multiple times, get the same result

**Bad:**

```javascript
const updateBoard = (index, num) => {
  currentState.board[index] = num; // Mutation!
  render(); // Side effect!
};
```

**Good:**

```javascript
const placeNumber = (state, index, num) => ({
  ...state,
  board: [...state.board.slice(0, index), num, ...state.board.slice(index + 1)],
});
```

### Top-Level Functions

- All methods must be at module scope, not nested inside other functions
- Every function must be independently testable
- No closures capturing external state (except module-level constants)

**Bad:**

```javascript
const init = () => {
  const onCellClick = (event) => {
    // Nested function — can't test!
    // ...
  };
  document.addEventListener("click", onCellClick);
};
```

**Good:**

```javascript
const onCellClick = (event) => {
  // Top-level, testable
};

const init = () => {
  document.addEventListener("click", onCellClick);
};
```

### Separation of Concerns

Each module owns one concern:

- **`solver.js`** — Only Sudoku logic (validation, solving, related cells). No state, no rendering.
- **`state.js`** — Only state transformations. Pure functions returning new state. No DOM.
- **`render.js`** — Only DOM updates. Take state and update the page. No logic.
- **`puzzles.js`** — Only puzzle loading and parsing. No game state, no DOM.
- **`app.js`** — Only orchestration. Coordinate state updates and side effects.

**Never mix concerns:**

- Don't call render from state functions
- Don't put logic in render functions
- Don't create state in render functions
- Don't solve puzzles in app orchestration

### No Else Blocks

Use guard clauses instead:

**Bad:**

```javascript
if (state.selected >= 0) {
  updateState(selectCell(state, index));
} else {
  return;
}
```

**Good:**

```javascript
if (state.selected < 0) {
  return;
}
updateState(selectCell(state, index));
```

## Coding Standards

Follow standards in `standards/coding/`:

### JavaScript

- **Arrow functions** — `const name = () => {}`
- **Const by default** — Use `let` only for reassignment
- **Guard clauses** — No else blocks, return early
- **JSDoc comments** — All functions, @param, @returns
- **Strict equality** — `===` not `==`
- **Semicolons** — End every statement
- **Single quotes** — `'string'` not `"string"` (except YAML/JSON)
- **All braces** — Even single-statement blocks: `if (x) { return; }`

### Bash

- `set -o errexit -o pipefail -o nounset` + ERR trap
- Two-space indentation
- `camelCase` for locals, `UPPER_SNAKE_CASE` for globals
- Guard clauses, return early

## File Organization

```
sudoku/
├── js/                 # Application code
│   ├── constants.js    # Config only
│   ├── solver.js       # Pure logic only
│   ├── state.js        # Pure state functions
│   ├── render.js       # DOM only
│   ├── puzzles.js      # Loading only
│   └── app.js          # Orchestration only
├── data/
│   ├── puzzles.json    # Index of filenames
│   ├── puzzles/        # Individual puzzle files
│   └── samples.yaml    # Documented examples
├── style/              # CSS
├── docs/               # Documentation
└── standards/          # Coding standards
```

### Adding a New Module

Before creating a new file:

1. What problem does it solve?
2. Which existing module could it belong to? (Prefer extending existing files)
3. Is it logic, rendering, loading, or orchestration?

**Example:** If adding difficulty filtering:

- **If it's a pure state function** → add to `state.js`
- **If it's rendering logic** → add to `render.js`
- **If it's loading logic** → add to `puzzles.js`
- **If it's orchestration** → add to `app.js`

Don't create a new module unless it truly solves a distinct problem that doesn't fit existing modules.

## Common Tasks

### Adding a Puzzle

1. Create `data/puzzles/NNN.yaml` (copy `data/samples.yaml` as template)
2. Add one line to `data/puzzles.json`
3. Test by running `./up.sh` and selecting "New Puzzle"

### Adding Game Logic

Example: "Add undo feature"

1. Add state field to object returned by `createStateFromPuzzle()` in `js/state.js`
2. Add pure function `undo(state) → newState` in `js/state.js`
3. Add handler `onUndo` in `js/app.js` that calls `updateState(undo(currentState))`
4. Add button and listener in `init()` in `js/app.js`
5. No other files should change

### Adding UI

Example: "Add difficulty filter dropdown"

1. Add HTML to `index.html`
2. Add CSS to `style/style.css`
3. Add pure filter function in `js/state.js` or `js/puzzles.js` (depends on what it filters)
4. Add event handler in `js/app.js`

### Bug Fixes

1. Identify which module owns the logic
2. Read the function implementation
3. Understand the bug via the pure function (no side effects to trace)
4. Fix the function
5. Test with examples

## Working with an Agent

### Before Requesting Changes

Provide context:

```
I want to add [feature]. It should:
- [requirement 1]
- [requirement 2]

This belongs in [module] because [reason].
Current constraint: [limitation if any].
```

### During Changes

- Agent should read current file state before editing
- Agent should check standards before writing code
- Agent should use multi-operation edits when possible
- Agent should not create new files without asking
- Agent should explain architectural decisions

### After Changes

- Agent should verify the change against standards
- Agent should check for consistency with existing patterns
- Agent should report what was done (no markdown summaries unless requested)
- Agent should run Node tests using `node tests/run-node-tests.js --report-only-failures --report-status` for concise terminal output
- Agent should not truncate test output with shell filters like `tail` or `grep`; use runner flags instead

## Escalation

If an agent suggests something that violates these principles, escalate:

1. State what principle is violated
2. Explain why the principle matters (testability, maintainability, etc.)
3. Ask for an alternative approach

**Example escalation:**

> The suggestion puts logic inside a render function. That violates separation of concerns and makes it untestable. Can we move the logic to `js/state.js` and call it from `js/app.js` instead?

## Testing Checklist

Before considering a change complete:

- [ ] All pure functions work in isolation with multiple test inputs
- [ ] All handlers are top-level and callable with synthetic events
- [ ] State is immutable (no mutations of input objects)
- [ ] No else blocks (guard clauses only)
- [ ] JSDoc comments on all functions
- [ ] No console.log left in code
- [ ] No new globals introduced
- [ ] Standards-compliant (lint-style checks pass)
- [ ] Node harness run with preferred command: `node tests/run-node-tests.js --report-only-failures --report-status`

## References

- **Architecture** — [docs/design.md](docs/design.md)
- **Coding Standards** — `standards/coding/general.md`, `standards/coding/javascript.md`, `standards/coding/bash.md`
- **Project Structure** — [readme.md](readme.md)
- **Puzzle Format** — `data/samples.yaml`

## Versioning (IMPORTANT)

The app version is a single `VERSION` constant in `js/constants.js` (semver: `major.minor.patch`).

**Increment rules:**

- **Bug fix / docs** → increment `patch` only (e.g. `1.0.0` → `1.0.1`)
- **New feature, backward compatible** → increment `minor`, reset `patch` to 0 (e.g. `1.0.1` → `1.1.0`)
- **Breaking change** → increment `major`, reset `minor` and `patch` to 0 (e.g. `1.1.0` → `2.0.0`)

The version is displayed in the bottom of the UI via `renderVersion()` in `render.js`, called once from `init()` in `app.js`.

## Commit and Tag Workflow (IMPORTANT)

Follow this cycle precisely:

1. **New work starts** → bump `VERSION` in `js/constants.js` and add a `## [x.y.z]` entry to `changelog.md` **before** any other commits for that version
2. **During work** → commit freely as logical chunks complete; no tagging yet
3. **User says “we’re done”** → commit any remaining uncommitted changes, then tag:

```bash
git tag -a v1.x.x -m "Version 1.x.x: description"
```

4. **Next work begins** → go back to step 1

**Never tag mid-feature.** Tags mark finished, stable versions only.

**Always update `changelog.md`** alongside `VERSION` at the start of each new version.
