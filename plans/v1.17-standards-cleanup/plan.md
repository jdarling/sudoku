# Standards Cleanup Plan

Fixes identified during standards review (May 2026).
Compression/decompression in `state.js` is explicitly excluded — the BigInt approach is intentional.

---

## Fix 1 — Guard clauses in `loadNewGame` (`app.js`)

**Problem:** Two `else` blocks violate the no-else rule.

**Location:** `js/app.js`, `loadNewGame`

### `incomingBoard` branch
Current:
```js
if (validationError) {
  showUnknownPuzzleFallback(incomingBoard);
} else {
  // success path
}
```
Fix: return early after fallback, remove `else`.

### `incomingToken` / `exactMatch` branch
Current:
```js
if (exactMatch) {
  // load it
} else {
  const selectedFilename = await openLoadModalForSelection(incomingToken);
  if (!selectedFilename) {
    showUnknownPuzzleFallback(incomingToken);
  } else {
    await loadPuzzleByFilename(selectedFilename);
  }
}
```
Fix: invert to `if (!exactMatch)`, handle no-match with a guard return, then continue with exactMatch path. Flatten inner `if/else` the same way.

**Files changed:** `js/app.js`

---

## Fix 2 — Dead `relatedCells` parameter in `getCellHighlightClass` (`state.js`)

**Problem:** Parameter is documented as unused and exists only for backwards compatibility. The function has zero production callers — only test call sites use it.

**Fix:** Remove the `relatedCells` parameter from the function signature. Update all 5 call sites in `js/state.test.js` to drop the argument.

**Files changed:** `js/state.js`, `js/state.test.js`

---

## Fix 3 — `isCoarsePointerDevice()` called inside `render.js` (separation of concerns)

**Problem:** `render.js` calls `isCoarsePointerDevice()` in two places (`createCell`, `focusCell`). Device detection is not a rendering concern — it belongs in `dom.js` (where it's defined) and should be resolved at the boundary (`app.js`).

**Fix:**
- Compute once in `app.js` at `init()` time and store as a module-level constant.
- Pass a `coarsePointer` boolean into `renderGrid` → `createCell` (to control `readOnly`).
- Pass the same flag into `focusCell` (to control skip-focus).
- Remove the `isCoarsePointerDevice()` calls from `render.js`.

**Files changed:** `js/app.js`, `js/render.js`

---

## Fix 4 — Missing `@returns {void}` on void functions

**Problem:** Several functions have JSDoc blocks with no `@returns` tag. The standard requires it on all functions.

**Affected functions (non-exhaustive):**
- `app.js`: `setCurrentPuzzleName`, `updateState`, `applyBoardStateFromHash`, `loadGame`, `loadFetchedPuzzle`, `showUnknownPuzzleFallback`, `clearBoard`, `applyHighlightFeatures`
- `render.js`: `renderVersion`
- `components/`: `configureOptionsModal`, `renderPresetButtons`, `configureLoadModal`, and other void handlers

**Fix:** Add `@returns {void}` to each.

**Files changed:** `js/app.js`, `js/render.js`, `js/components/*.js`

---

## Order of execution

1. Fix 2 (simplest — remove dead param, update tests)
2. Fix 1 (guard clauses in `loadNewGame`)
3. Fix 3 (pass coarsePointer flag through render boundary)
4. Fix 4 (JSDoc — last, purely additive)

Run tests after each fix: `node tests/run-node-tests.js --report-only-failures --report-status`

## Version bump

All fixes are non-breaking internal cleanups → bump to `1.17.0` and tag `v1.17.0-standards-cleanup`.
