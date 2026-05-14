# Component Refactor Plan

## 1. Current State: Taxonomy & Hierarchy

### Folder: js/components/

- **modal.js** — Generic modal open/close/focus util (no state)
- **decisionmodal.js** — Multi-action modal (uses modal.js)
- **confirmmodal.js** — Yes/No modal (wraps decisionmodal.js)
- **newgamedecisionmodal.js** — 3-action modal (wraps decisionmodal.js)
- **optionsmodal.js** — Options/settings modal (uses modal.js)
- **loadmodal.js** — Puzzle picker modal (uses modal.js, table.js)
- **urlloadmodal.js** — Load-from-URL modal (uses modal.js)
- **boardentrymodal.js** — Manual board entry modal (uses modal.js)
- **scoreboardmodal.js** — Scorecard display modal
- **table.js** — Filterable table renderer (used by loadmodal.js)

#### Observations

- All UI is modal-based; no reusable input controls (dropdown, textbox, textarea, etc.)
- Most modals own their own state, rendering, and event handlers (mixing concerns)
- Table is pure render util, but not a true component
- No hierarchy or composition beyond modal wrappers

---

## 2. Target Taxonomy: Clean Separation of Concerns

### Proposed Structure (with lowercase filenames and stacked folders)

**components/**

- **inputs/** (reusable, stateless, pure)
  - `button.js` — Standard button
  - `inputtext.js` — Single-line text input
  - `textarea.js` — Multi-line text input
  - `select.js` — Dropdown/select
- **modals/** (composite modal controls)
  - `modal.js` — Base modal open/close/focus util
  - `decisionmodal.js` — Multi-action modal (composes modal, button)
  - `confirmmodal.js` — Yes/No modal (composes decisionmodal)
  - `newgamedecisionmodal.js` — 3-action modal (composes decisionmodal)
  - `optionsmodal.js` — Settings/options modal (composes modal, select, button)
  - `loadmodal.js` — Puzzle picker modal (composes modal, table, button, inputtext)
  - `urlloadmodal.js` — Load-from-URL modal (composes modal, inputtext, button)
  - `boardentrymodal.js` — Manual board entry modal (composes modal, textarea, button)
  - `scoreboardmodal.js` — Scorecard display modal (composes modal, table, button)
- **table/**
  - `table.js` — Pure table renderer

### Hierarchy

- **Inputs**: Used everywhere, no state, no DOM queries
- **Modals**: Stateless or stateful, composed from inputs and table, no business logic in base/composite modals
- **Feature logic**: Lives in orchestrating modules, not in modal/input/table primitives

---

## 3. Refactor Phases

### Phase 1: Primitives Extraction

- Extract primitives from donor modals (move to inputs/ as you extract):
  - Button: Extract from optionsmodal.js (preset/action buttons), decisionmodal.js (modal actions), confirmmodal.js (Yes/No), and loadmodal.js (select/cancel).
  - InputText: Extract from loadmodal.js (filter input), urlloadmodal.js (URL input), optionsmodal.js (theme select if text-based).
  - TextArea: Extract from boardentrymodal.js (manual board entry textarea).
  - Select: Extract from optionsmodal.js (theme dropdown/select).
- Each primitive must render a full DOM element (not just a factory), be composable, and accept props/config for reuse.
- Place each primitive in its own file in inputs/ as soon as it is extracted.
- Add a dedicated test file for each primitive (e.g., button.test.js, inputtext.test.js) in the same phase.
- Refactor table.js to pure stateless renderer and move to table/.
- Refactor modal.js to pure open/close/focus util and move to modals/.

### Phase 2: Composite Modals

- Refactor DecisionModal, ConfirmModal, NewGameDecisionModal to stateless composites using primitives (move to modals/ as refactored).
- Refactor ScoreboardModal to stateless composite (move to modals/).
- Add or update test files for each composite (e.g., decisionmodal.test.js).

### Phase 3: Feature Modals

- Refactor OptionsModal, LoadModal, UrlLoadModal, BoardEntryModal to stateful orchestrators using new composites/primitives (move to modals/ as refactored).
- Ensure all state/event logic is at feature level only.
- Add or update test files for each feature modal (e.g., optionsmodal.test.js).

### Phase 4: Integration & Cleanup

**Clarify event/DOM ownership:**

- App-level orchestration (app.js) is responsible for wiring global and modal entry/exit event listeners, as well as passing dependencies to feature modals.
- Feature modals may own their own local DOM lookup and state for internal controls, but must not perform global event binding or cross-modal orchestration.
- Primitives and composites must not perform any DOM queries or event binding; they are pure and stateless.

---

## 4. Deliverables

- New folder structure under js/components/
- All primitives, composites, and features as top-level modules
- No business logic or state in primitives/composites
- All state/event logic in feature modules only
- Tests updated for all new modules

---

## 5. Notes

- All functions must be top-level, pure where possible
- No else blocks; use guard clauses
- Use JSDoc on all functions
- Use single quotes, semicolons, strict equality
- No direct DOM queries in primitives/composites
- All new input controls (dropdown, textbox, textarea) must be reusable

---

## 6. Next Steps

- Begin with Phase 1: Extract primitives from existing modal code (see donor mapping above).
- Document each primitive with usage examples.
- Ensure all new code is covered by tests.

---

## 7. Version Direction

- User must specify major/minor version direction before coding. Current version is 1.17.3. Unless otherwise directed, this refactor will target 1.18.x (minor bump, not breaking), but user may choose 2.0 if breaking changes are expected.

---

## 8. Expanded Phase 4: Integration & Cleanup

- Update all script references in index.html and tests/check-app-init.js to match new paths.
- Refactor app.js to use new primitives and composites, removing legacy modal/input logic.
- Update or add documentation in readme.md and docs/design.md to reflect new structure and usage.
- Remove any dead code or obsolete helpers from js/components/ and related files.
- Ensure all tests pass and update/add tests for new structure as needed.

---

## 7. Path Migration & Synchronization Strategy

### Problem

Moving component files into nested folders (e.g., modals/, inputs/) will break script loading in both the browser (index.html) and the app-init test harness (tests/check-app-init.js), as both currently hardcode flat paths for all component scripts.

### Evidence

- index.html: `<script src="js/components/xyz.js">` (lines 413–422) — all paths flat
- tests/check-app-init.js: `loadScript(path.join(__dirname, "../js/components/xyz.js"), ...)` (lines 250–327) — all paths flat

### Impact

If files are moved without synchronizing these paths, the app will fail to load and tests will fail to initialize.

### Migration Strategy

1. **Phase-aligned Moves:**
   - For each refactor phase that moves or renames files, update both index.html and check-app-init.js in the same commit/step.
   - Never move or rename a file without updating all script references in both places.
2. **Temporary Aliasing (if needed):**
   - During large migrations, consider temporarily duplicating files (old and new paths) and loading both, then removing the old after all references are updated and tested.
3. **Test-First:**
   - After each path update, run both browser and node init tests to confirm no breakage before proceeding to the next phase.
4. **Documentation:**
   - Document each path change in the changelog and in commit messages for traceability.

### Example (Phase 1: Move modal.js to modals/modal.js)

1. Move js/components/modal.js → js/components/modals/modal.js
2. Update `<script src="js/components/modal.js">` → `<script src="js/components/modals/modal.js">` in index.html
3. Update `loadScript(path.join(__dirname, "../js/components/modal.js"), ...)` → `loadScript(path.join(__dirname, "../js/components/modals/modal.js"), ...)` in check-app-init.js
4. Run tests, verify, then proceed

---
