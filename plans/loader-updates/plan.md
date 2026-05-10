# Loader Updates — Implementation Plan

## Goal

Make URL puzzle loading robust and backward compatible after puzzle path migration, without hardcoded
ID-to-file maps. Define three explicit mechanics:

1. What happens when an unknown/invalid puzzle id is passed in
2. How puzzle ids should work in URLs going forward
3. How puzzle metadata index is generated for loader UX and resolution

---

## Problem Statement

Current flow normalizes query values into file paths too early (`dom.js`) and then fetches directly.
Legacy links like `?puzzle=002` become `puzzles/002.yaml`, which no longer exists after moving files
into difficulty subfolders.

This creates user-facing load failures instead of deterministic resolution behavior.

Current token parsing is also too permissive and needs hardening against malformed/path-like inputs.

In parallel, the current puzzle index is path-only and too limited for richer load UI behavior.
We need an index generator that extracts metadata from puzzle YAML files so the loader can support
better filtering, display, and selection workflows.

---

## Architecture Direction

### Separation of concerns

- `js/dom.js`: parse URL only; no file path inference
- `js/puzzles.js`: resolve query token -> canonical indexed puzzle path
- `js/app.js`: orchestrate load behavior and fallback messaging

### Single source of truth

- `data/puzzles.json` is the canonical index of loadable puzzle files
- URL tokens are resolved against this index at runtime

For loader metadata and search UX, introduce a generated metadata index built from puzzle YAML files.

No static mapping table from old ids to new paths.

---

## Mechanic 1 — Unknown Puzzle ID Behavior

When `puzzle` query param does not result in a user-selected puzzle:

1. Show status: `Can't load puzzle "<id>".`
2. Render a blank Sudoku board (all cells empty, no givens)
3. Do not auto-load another puzzle
4. Keep the app interactive so the user can choose next action (`New Puzzle`, `Load Game`, etc.)
5. Clear any stale board hash so URL does not imply a loaded puzzle state

This includes:

- no matches found for the incoming token
- user cancels loader selection flow after a non-exact token

---

## Mechanic 2 — URL Puzzle ID Rules

### Canonical outgoing format

Always write puzzle query as:

- `<id>`

Examples:

- `?puzzle=004`
- `?puzzle=021`

No `.yaml`, no `puzzles/` prefix in URLs.

### Accepted incoming formats (backward compatible)

Parser + matcher must accept:

- `002`
- `002.yaml`
- `puzzles/easy/002.yaml` (legacy)
- `easy/002.yaml` (legacy)
- URL-encoded equivalents

### Token sanitization and safety rules

Apply these transformations before matching:

1. URL-decode and trim
2. Strip leading `puzzles/` prefix (if present)
3. Strip trailing `.yaml` postfix (if present)
4. Normalize path separators and drop leading `/`
5. Remove path traversal segments such as `../` and `./`

Then enforce allowed token shape for matching:

- only digits for canonical id matching (for example `004`)

If sanitized token is empty or invalid, treat as non-exact and hand control to loader UI.

### Loader behavior for matched URL ids

1. If incoming URL token matches a single indexed puzzle, load that puzzle immediately
2. If board hash data is present and valid, apply it to the loaded puzzle board
3. Rewrite URL to canonical id format after successful load

### Loader behavior for non-exact URL ids

1. When URL token does not exactly match a single indexed identity, open the Load Puzzle modal
2. Prefill the loader filter input with the incoming token
3. Render filtered metadata rows from generated index
4. User explicitly selects puzzle from the filtered list
5. If user cancels without selecting, apply Mechanic 1 behavior

---

## Mechanic 3 — Puzzle Index Generator

Generate a richer JSON index from all puzzle YAML files under `data/puzzles/`.

### Generator purpose

1. Replace path-only index usage with metadata-first index entries
2. Support richer loader table content
3. Enable incoming URL id to prefill loader filter and show narrowed candidates

### Input

- All YAML puzzle files recursively under `data/puzzles/`

### Output

- A JSON file suitable to replace path-only `data/puzzles.json` loader usage
- One entry per puzzle with fields:
  - `id`
  - `path`
  - `name`
  - `level`
  - `author`
  - `description`

### Field rules

1. `id`: globally unique puzzle identifier (for example `004`)
2. `path`: canonical relative YAML path (for example `puzzles/easy/001.yaml`)
3. `name`: from YAML `name`
4. `level`: from YAML `level` field; fall back to `difficulty` if `level` is absent
5. `author`: from YAML `author`
6. `description`: from YAML `description` field; fall back to `summary` if `description` is absent; empty string if neither present

### Alias precedence and conflict rules

- `level` precedence: `level` is primary, `difficulty` is fallback
- `description` precedence: `description` is primary, `summary` is fallback
- If both alias fields are present with different non-empty values, generator fails with exit code `3` and reports the file path and conflicting field names

### Validation behavior

1. Generator fails when required fields (`id`, `path`, `name`, `level`) are missing
2. Generator attempts global `id` uniqueness; if collisions exist, print:
   `WARNING: ID collisions <id> on puzzles [list of puzzle files]`
3. On any id collision, generator exits with code `2` for CI detection
4. Generator fails on duplicate `path`
5. Output is deterministic (stable ordering)

### Exit codes

Use low, explicit exit codes:

1. `1`: generic generator failure
2. `2`: id collision detected
3. `3`: schema/validation failure (required metadata missing or invalid)
4. `4`: input/output failure (file read/write issues)

## Proposed API Changes

### `js/dom.js`

- Keep `getPuzzleFromQuery()` as a parser returning raw decoded token
- Stop generating filesystem paths here

### `js/puzzles.js`

Add pure helper(s):

- `toCanonicalPuzzleId(entry) -> "id"`
- `findPuzzleMatches(token, indexedEntries) -> { exactMatch, matches }`

Where matching behavior is:

- if sanitized token exactly matches a single index `id`, load puzzle directly and apply valid board hash state
- if sanitized token exactly matches a legacy path identity, load that puzzle and canonicalize URL to id
- if no `exactMatch`, hand control to user (open loader with prefilled filter)
- if user does not select a puzzle, apply Mechanic 1 behavior

Matcher should use generated metadata index entries, not raw path strings.

### `js/app.js`

In `loadNewGame()`:

1. Read raw query token
2. Load index once
3. Match via `findPuzzleMatches`
4. Branch by exact/non-exact outcome
5. On exact match, load puzzle and apply valid board hash
6. On non-exact, open load modal with prefilled filter
7. If loader closes without selection, apply Mechanic 1 behavior
8. Call `updateQuery()` with canonical id only after successful puzzle load

### Generator script

Add a generator script to build puzzle metadata index from YAML inputs.

Suggested location:

- `scripts/generate-puzzle-index.js`

Suggested output:

- `data/puzzles.index.json`

---

## Functional Requirements

1. Legacy links do not hard-fail when an equivalent indexed puzzle exists
2. Unknown ids show `Can't load puzzle "<id>".` and render a blank board
3. When URL token matches a single puzzle, app loads puzzle and restores valid board hash layout
4. All successful loads end with canonical id-only URL format
5. Any non-exact id does not auto-resolve; control is returned to the user via loader UI
6. No module violates architecture boundaries
7. Generated puzzle index contains `id`, `path`, `name`, `level`, `author`, `description` for every puzzle
8. Loader can prefill filter from incoming URL token and present matching selectable rows
9. URL token sanitization strips `puzzles/`, `.yaml`, and traversal segments before matching
10. Generator exits with code `2` on id collisions and prints collision warning lines

---

## Test Plan

### Unit tests (`js/puzzles.test.js`)

Add matcher tests for:

- exact canonical token match
- canonical path match
- basename id match set
- unknown token -> no exact match and empty/limited filtered candidates
- non-exact token -> no exact match and filtered candidate list returned
- matcher inputs against metadata index entries (not just path strings)
- sanitization of `puzzles/` prefix and `.yaml` postfix
- traversal-like token handling (for example `../004`, `puzzles/../easy/004.yaml`)

### URL parser tests (`js/dom.test.js`)

Introduce isolated tests for:

- empty/no puzzle param
- raw token passthrough
- URL-decoded token handling

### Orchestration tests (`js/app.test.js` or focused integration harness)

Cover:

- matched token loads puzzle and applies valid board hash
- `not-found` renders blank board
- status messaging on not-found/non-selected
- URL rewritten to canonical token after successful load
- stale board hash cleared on `not-found`
- load modal opens with prefilled filter for non-exact token
- canceling loader after non-exact token renders blank board + error message

### Generator tests

Cover:

- recursive YAML discovery under `data/puzzles/`
- required field extraction and defaults for optional description
- duplicate `id` collision warning text format and exit code `2`
- duplicate `path` failure mode
- deterministic sorted output

---

## Implementation Decision Table

This section is normative for implementation. If any earlier wording conflicts with this table,
this table wins.

### Generated index contract

1. Primary generated file path:

- `data/puzzles.json`

2. Optional debug artifact allowed during development only:

- `data/puzzles.index.json`

3. Runtime loader source of truth:

- `data/puzzles.json`

4. JSON shape:

- top-level array of objects
- each object has exactly: `id`, `path`, `name`, `level`, `author`, `description`

5. Field types:

- `id`: string
- `path`: string
- `name`: string
- `level`: string
- `author`: string
- `description`: string

6. Optional field fallback:

- if description is missing in YAML, write `""`

### Id derivation and validation

1. Id derivation source (in priority order):

- if YAML puzzle has an explicit `id` field, use that value
- otherwise use filename stem (for example `data/puzzles/easy/004.yaml` -> `004` or `jerem-puzzle-001.yaml` -> `jerem-puzzle-001`)

2. Global uniqueness rule:

- `id` must be unique across all indexed puzzles

3. Collision behavior:

- print one warning line per collided id:
  `WARNING: ID collisions <id> on puzzles [list of puzzle files]`
- exit with code `2`

### Token sanitization algorithm

Apply in this exact order:

1. URL-decode token once
2. trim surrounding whitespace
3. replace `\\` with `/`
4. remove leading `/`
5. remove all `../` and `./` path segments
6. if token starts with `puzzles/`, remove that prefix
7. if token ends with `.yaml`, remove that suffix
8. trim again

Validation after sanitization:

1. Canonical id match allowed only for regex `^[0-9]+$`
2. Empty result is invalid and treated as non-exact
3. Any remaining slash means it is not a canonical id

### Matching precedence

1. Exact canonical id match (sanitized token vs entry `id`)
2. Exact legacy path match (raw decoded token normalized to path form vs entry `path`)
3. Otherwise non-exact

Notes:

1. Step 2 is backward compatibility only
2. No fuzzy auto-match and no partial auto-match

### Loader modal contract

1. For non-exact token:

- open Load Puzzle modal
- prefill filter input with original incoming token (not sanitized token)

2. Modal outcomes:

- selected: return selected puzzle entry
- canceled/closed: return no selection

3. On no selection:

- apply Mechanic 1 behavior exactly

### Board hash contract

1. Exact match load path:

- load matched puzzle
- decode and validate board hash
- if valid, apply to loaded puzzle state
- if invalid, ignore hash and keep fresh puzzle board

2. Non-exact path before user selection:

- do not apply board hash

3. Cancel/no selection:

- clear stale board hash
- render blank board

### Url rewrite contract

1. Rewrite query only after successful puzzle selection/load
2. Rewritten canonical form:

- `?puzzle=<id>`

3. Never rewrite URL on non-exact token until user selection succeeds

### Ci and script contract

1. Generator command:

- `node scripts/generate-puzzle-index.js`

2. CI requirement:

- run generator before tests
- any non-zero exit fails CI job

3. Recommended local sequence:

- run generator
- run `node tests/run-node-tests.js --report-only-failures --report-status`

---

## Test Scenarios

These concrete scenarios validate behavior end-to-end. Use these to verify implementation correctness.

**Assumption:** Generated index contains entries for:

- `id: 004`, `path: puzzles/easy/004.yaml`
- `id: 021`, `path: puzzles/hard/021.yaml` (YAML id field also contains legacy reference `04`)
- `id: 001a`, `path: puzzles/easy/jerem-puzzle-001.yaml` (explicit YAML id field)

### Scenario 1: Exact canonical id match

**Input:** `?puzzle=004`

**Flow:**

1. Parse token: `004`
2. Sanitize: `004` (no-op)
3. Match exact id against index
4. Find: id=`004` matches one entry

**Output:**

- Load puzzle from `puzzles/easy/004.yaml`
- Apply board hash if valid
- Rewrite URL to `?puzzle=004` (no change)
- Display puzzle ready to play

---

### Scenario 2: Legacy path input

**Input:** `?puzzle=puzzles/hard/021.yaml`

**Flow:**

1. Parse token: `puzzles/hard/021.yaml`
2. Sanitize: strip `puzzles/` prefix, strip `.yaml` suffix → `hard/021`
3. Match exact id: `hard/021` does not match any id
4. Match exact path: `puzzles/hard/021.yaml` matches one entry (id=`021`)

**Output:**

- Load puzzle from `puzzles/hard/021.yaml`
- Apply board hash if valid
- Rewrite URL to `?puzzle=021` (canonical form)
- Display puzzle ready to play

---

### Scenario 3: Non-exact token with multiple matches, user selects from loader

**Input:** `?puzzle=04`

**Flow:**

1. Parse token: `04`
2. Sanitize: `04` (no-op)
3. Match exact id: `04` does not match any id
4. Match exact path: `04` does not match any path
5. Non-exact → open Load Puzzle modal
6. Prefill filter with original token: `04`
7. Filter renders matches: `004` (id contains `04` substring) and `021` (metadata contains `04` as legacy reference)
8. User selects `004` from the filtered list
9. User confirms selection

**Output:**

- Load puzzle from `puzzles/easy/004.yaml`
- Apply board hash if valid
- Rewrite URL to `?puzzle=004`
- Close modal, display puzzle ready to play

---

### Scenario 4: Non-exact token, user cancels from loader

**Input:** `?puzzle=04`

**Flow:**

1. Parse token: `04`
2. Sanitize: `04` (no-op)
3. Match exact id: no match
4. Match exact path: no match
5. Non-exact → open Load Puzzle modal
6. Prefill filter with original token: `04`
7. User clicks Cancel or presses Escape

**Output:**

- Close modal
- Display blank Sudoku board (all empty, no givens)
- Show status message: `Can't load puzzle "04".`
- User can click New Puzzle or Load Game to proceed

---

### Scenario 5: Malicious/traversal attempt

**Input:** `?puzzle=../../../etc/passwd`

**Flow:**

1. Parse token: `../../../etc/passwd`
2. Sanitize:
   - URL-decode (no-op)
   - trim (no-op)
   - remove all `../` segments → empty string
3. Match exact id: empty string does not match any id
4. Match exact path: empty string does not match any path
5. Non-exact → open Load Puzzle modal
6. Prefill filter with original token: `../../../etc/passwd`
7. Filter renders matches: none (no puzzle id or name contains that string)
8. User cancels (no selection available)

**Output:**

- Close modal
- Display blank Sudoku board
- Show status message: `Can't load puzzle "../../../etc/passwd".`

---

### Scenario 6: Generator detects id collision

**Input:** Two YAML files both have `id: 001a` in their metadata

**Execution:** `node scripts/generate-puzzle-index.js`

**Flow:**

1. Scan `data/puzzles/` recursively
2. Extract metadata: both files produce id=`001a`
3. Check global uniqueness
4. Collision detected on id `001a`

**Output:**

- Print warning: `WARNING: ID collisions 001a on puzzles [file1.yaml, file2.yaml]`
- Exit with code `2`
- CI job fails (non-zero exit)
- `data/puzzles.json` is not generated/updated

---

### Scenario 7: Non-exact token matching single puzzle uniquely

**Assumption:** Index modified so only `004` contains `04` substring (no legacy id on `021`).

**Input:** `?puzzle=04`

**Flow:**

1. Parse token: `04`
2. Sanitize: `04` (no-op)
3. Match exact id: `04` does not match any id
4. Match exact path: `04` does not match any path
5. Non-exact → open Load Puzzle modal
6. Prefill filter with original token: `04`
7. Filter renders matches: `004` only (only puzzle with `04` in id or metadata)
8. User selects `004` from the filtered list
9. User confirms selection

**Output:**

- Load puzzle from `puzzles/easy/004.yaml`
- Apply board hash if valid
- Rewrite URL to `?puzzle=004`
- Close modal, display puzzle ready to play

---

### Scenario 8: Legacy bare id token `002` resolves directly

**Assumption:** Index contains `id: 002`, `path: puzzles/easy/002.yaml`.

**Input:** `?puzzle=002`

**Flow:**

1. Parse token: `002`
2. Sanitize: `002` (no-op)
3. Match exact id against index
4. Find: id=`002` matches one entry
5. Load matched puzzle and apply board hash if valid

**Output:**

- Load puzzle from `puzzles/easy/002.yaml`
- Rewrite URL to `?puzzle=002` (canonical form)
- Display puzzle ready to play

---

### Scenario 9: Unknown id token `999` shows not-found state

**Input:** `?puzzle=999`

**Flow:**

1. Parse token: `999`
2. Sanitize: `999` (no-op)
3. Match exact id: no match
4. Match exact path: no match
5. Non-exact -> open Load Puzzle modal with prefilled filter `999`
6. Filter returns no results
7. User cancels modal

**Output:**

- Close modal
- Display blank Sudoku board (all empty, no givens)
- Show status message: `Can't load puzzle "999".`

---

## Implementation Steps

1. Introduce matcher helpers in `js/puzzles.js` (pure functions only)
2. Refactor `getPuzzleFromQuery()` to return raw token only
3. Update `loadNewGame()` orchestration to use matcher outcomes
4. Update `updateQuery()` contract to enforce canonical id-only output
5. Implement puzzle metadata index generator
6. Add token sanitization utility for URL puzzle ids
7. Integrate loader data source with generated index
8. Add/expand tests in puzzles/dom/app and generator test modules
9. Run Node harness: `node tests/run-node-tests.js --report-only-failures --report-status`

---

## Risks and Mitigations

- Risk: matcher adds complexity to startup path
  - Mitigation: pure deterministic helper with small surface + unit coverage
- Risk: non-exact flow could feel noisy to users
  - Mitigation: prefilled loader filter narrows candidates and preserves user control
- Risk: path-like URL token abuse
  - Mitigation: strict sanitization and allowed-shape validation before matching
- Risk: future reorganization of puzzle files
  - Mitigation: index-driven matching avoids hardcoded path rules
- Risk: index generator drifts from YAML schema changes
  - Mitigation: schema validation and failing fast in generator pipeline

---

## Acceptance Criteria

1. Visiting with `?puzzle=002` where token matches a single indexed puzzle loads that puzzle, applies valid board hash (if present), and updates URL to canonical id format
2. Visiting with unknown `?puzzle=999` shows `Can't load puzzle "999".` and displays a blank board
3. Visiting with `?puzzle=puzzles/easy/001.yaml` works and rewrites to `?puzzle=001`
4. No hardcoded old->new puzzle path map exists in source
5. Generated index exists with complete metadata per puzzle entry
6. When URL token is non-exact for direct load (for example `04`), Load Puzzle opens with token prefilled in filter
7. Canceling loader after non-exact token shows blank board + `Can't load puzzle "<id>".`
8. On id collisions, generator prints `WARNING: ID collisions <id> on puzzles [list of puzzle files]` and exits with code `2`
9. Test suite passes with added coverage for matcher and generator behavior
