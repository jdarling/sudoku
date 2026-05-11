# Candour JavaScript Coding Standards (Draft v2)

This document modernizes the original conventions while preserving the core intent.
It is JavaScript-specific and extends `./general.md`.

## 1) Core Rules

- Use `const` by default.
- Use `let` only when reassignment is required.
- Never use `var`.
- Always use semicolons.
- Always use strict equality (`===`, `!==`).
- Use single quotes in JS/TS (JSON stays double-quoted).
- Keep lines at 80 chars when practical; split for readability.
- Always use braces for conditionals and loops.

## 2) Naming and Structure

- Use descriptive lowerCamelCase names for variables/functions.
- Use UpperCamelCase for classes/components.
- Use UPPER_SNAKE_CASE for module-level constants.
- Avoid numbered variable names unless required by a protocol.
- Use singular/plural pairing (`entry` in `entries`).
- Keep function names verb-first when possible (`loadEntries`).

## 3) Control Flow

- Prefer guard clauses and helper functions over complex branches.
- Avoid `else` when a guard return clearly simplifies logic.
- Keep each function focused; split when responsibility expands.
- Do not mutate a variable into a different type.

## 4) Idempotent and Pure Functions (Required)

Functions must be pure and idempotent.

- Pure: no side effects (no DOM writes, no storage writes, no network calls, no global mutation).
- Idempotent for same input: calling the same function repeatedly with the same arguments returns an equivalent result.
- Never mutate input objects/arrays; always return new values.
- Keep orchestration side effects in boundary modules (for this project: `app.js`, DOM handlers, integration boundaries).
- Prefer deterministic inputs over hidden reads (`Date.now()`, `Math.random()`, module globals). If needed, pass them in as parameters.

Required pattern for state updates:

- Input: previous value + explicit arguments
- Output: new value
- No hidden dependencies

## 5) ES6+ Guidance (Required)

Use ES6 helpers and enhancements where they improve clarity.

- Prefer arrow functions for callbacks and small pure helpers.
- Use destructuring for objects/arrays.
- Use object shorthand and computed keys when useful.
- Use template literals for interpolation and multiline strings.
- Use spread/rest instead of manual object/array mutation when possible.
- Use default parameters over manual fallback logic.
- Use optional chaining (`?.`) and nullish coalescing (`??`) where appropriate.
- Prefer `Object.keys/values/entries` + array methods over manual loops when clearer.
- Prefer `for...of` for arrays when index is not needed.
- Prefer `Map`/`Set` when semantics match lookup/uniqueness.
- Use `async/await` over promise chains for flow control readability.

## 6) Collections and Iteration

- Use array helpers (`map`, `filter`, `reduce`, `find`, `some`, `every`) for transformations.
- Use `for` loops when performance-critical or index-dependent.
- Use `for...in` only for object key enumeration and guard with own-property checks.
- `i++` and `++i` are both acceptable; prefer consistency within the file.
- Avoid side effects inside transformations unless explicitly intended.

## 7) Imports/Modules

- Keep imports at top of file.
- Group imports in this order:
  1. Node/built-ins
  2. External packages
  3. Internal modules
- Prefer explicit named exports when practical.
- Avoid circular dependencies.

## 8) Comments

- Prefer self-documenting code first.
- Use comments for intent, invariants, and non-obvious behavior.
- Use `//` for regular comments.
- Use JSDoc for public functions, shared utilities, and complex interfaces.
- Keep tone formal and concise.

## 9) Error Handling and Logging

- Throw `Error` objects with actionable messages.
- Catch errors at boundaries and add context.
- Never swallow errors silently.
- Log structured data where possible.
- Do not log secrets, tokens, or sensitive PII.

## 10) Node and API Conventions

- Callback-first style (if used) must keep `(err, result)` shape.
- Prefer promises/`async` functions for new code.
- Validate input at API boundaries.
- Keep response shape consistent within an endpoint family.

## 11) Formatting and Tooling

- Formatting baseline from `.prettierrc` at repo root.
- Lint rules should enforce this document where feasible.
- If a rule conflicts with readability, prefer readability and document the exception.

## 12) Practical Exceptions

- Legacy files can be incrementally modernized during touch-up changes.
- Generated files follow generator output unless explicitly reformatted.
- Performance-sensitive paths may use lower-level patterns with comments.

## 13) Quick Examples

### Preferred

```js
const formatEntryTitle = ({ date, authorName = "Unknown" }) => {
  const day = date?.slice?.(0, 10) ?? "unknown-day";
  return `${day} - ${authorName}`;
};
```

```js
const toFeelingsMap = (feelings = []) => {
  return feelings.reduce((acc, { feeling, level = 0 }) => {
    return { ...acc, [feeling]: level };
  }, {});
};
```

### Avoid

```js
var x = "";
if (thing) x = 1;
else x = "none";
```

```js
const addMove = (scorecard) => {
  scorecard.moves += 1; // Mutates input (not allowed)
  return scorecard;
};
```

See also: `./general.md`
