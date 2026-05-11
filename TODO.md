# Sudoku Game - Future Roadmap

## Overview

This document tracks planned enhancements to the Sudoku game. Features are organized by complexity level to help contributors select tasks appropriate to their skill level. Each feature includes architectural notes to ensure consistency with project standards.

**Pick a complexity level that matches your experience:**

- **Low Complexity** — Good for getting familiar with the codebase
- **Medium Complexity** — Solid understanding of the architecture required
- **High Complexity** — Advanced work, milestone-level features with multiple sub-tasks

---

# Complexity: Low

Perfect for contributors learning the codebase. These features involve simple additions without major architectural changes.

## Dynamic Puzzle Fetching on "New Game"

**Complexity:** Low  
**Description:** When user clicks "New Game" button, fetch the latest `puzzles.json` to check for new puzzles (instead of using embedded puzzle list). Falls back to embedded list if fetch fails.

**Current Behavior:**

- `puzzles.json` is loaded once on page load
- "New Game" always selects from the same list

**Proposed Behavior:**

- "New Game" button triggers fresh fetch of `puzzles.json`
- If fetch succeeds, randomly select from updated list
- If fetch fails or timeout (offline), fall back to last cached list
- Show subtle feedback: "Fetching new puzzle..." (brief toast message)

**Implementation Notes:**

- Create `js/puzzles.js` function:
  ```javascript
  const fetchLatestPuzzles = async () => {
    try {
      const response = await fetch("data/puzzles.json", {
        cache: "no-store", // Always bypass cache
      });
      if (!response.ok) throw new Error("Fetch failed");
      return await response.json();
    } catch (error) {
      // Fall back to previously cached list
      return previousPuzzlesList;
    }
  };
  ```
- Call from `onNewGame()` handler in `js/app.js`
- Update `previousPuzzlesList` after successful fetch
- Add optional loading indicator (spinning icon, brief delay)

**Testing:**

- Test fetch succeeds and loads new puzzles
- Test fetch fails gracefully (offline, timeout, 404)
- Verify fallback uses previously cached list
- Confirm new puzzles are correctly selected and loaded

---

# Complexity: Medium

Moderate difficulty. These features involve extending state management or rendering logic while maintaining the current architecture.

## Share Functionality

**Complexity:** Medium  
**Description:** Allow users to share the puzzle in its current state (including any progress). Multiple sharing options: copy link, QR code, email, text/SMS.

**Implementation Notes:**

- Extend URL encoding (already supports puzzle + progress state)
- Current URL format: `index.html?puzzle=<ID>&board=<ENCODED_STATE>`
- Add "Share" button to `#action-row` or new `#share-row`
- Create `js/share.js` module with:
  - `generateShareLink(puzzleId, boardState)` → full URL
  - `generateQRCode(url)` → QR code image or canvas
  - `generateEmailLink(url)` → mailto URL
  - `generateSMSLink(url)` → sms: URL
- Display share options in modal or expandable menu

**Share Options:**

1. **Copy Link**
   - Copy full URL to clipboard
   - Feedback: "Link copied!" message
   - Simple `navigator.clipboard.writeText()`

2. **QR Code**
   - Generate QR code containing share URL
   - Display in modal for user to screenshot or scan
   - Library option: `qrcode.js` (lightweight, no npm)
   - Fallback: Plain URL if QR generation fails

3. **Email**
   - Generate `mailto:` link with pre-filled subject/body
   - Subject: "Check out my Sudoku puzzle"
   - Body: "I'm working on this puzzle! [LINK]"
   - Opens user's email client

4. **Text/SMS**
   - Generate `sms:` link with pre-filled message
   - Message: "Check this out: [SHORTENED_LINK]"
   - Optional: integrate URL shortener if share URL too long for SMS
   - Fallback: Copy link if SMS not supported on platform

**Testing:**

- Verify copied links open game with correct puzzle + progress state
- Test QR code generates and encodes URL correctly
- Confirm email/SMS links open appropriate apps
- Test on mobile and desktop

**Detailed Plan:**

- See `plans/share/plan.md`

---

## Scorecard Functionality

**Complexity:** Medium  
**Description:** Add a per-game scorecard that tracks assistance usage and solve behavior, then computes a transparent final score.

**Track Separately:**

- Check button uses
- Hint button uses
- Immediate-error displays
- Error-cell displays
- Total moves
- Support-check count (current)
- Maximum support-check count after first successful placed number

**Implementation Notes:**

- Add scorecard state object in `js/state.js` with pure update functions
- Increment counters from action handlers in `js/dom.js`
- Update scorecard support-check counters when options checkboxes change
- Reset scorecard on new/load puzzle flows in `js/app.js`
- Freeze scorecard on terminal outcomes (solve/complete)
- Render scorecard metrics and final score via `js/render.js`
- Keep formulas deterministic and clamp final score to [0, 100]

**Detailed Plan:**

- See `plans/scorecard/plan.md`

**Testing:**

- First-move gating works correctly
- Max support-checks ignores changes before first move
- Each action increments intended counter exactly once
- Resets happen on all load/new flows
- Frozen scorecard remains unchanged
- Score formula clamps correctly

**Related:** May integrate with PWA for native share API

---

# Complexity: High

Advanced work requiring significant architectural additions or new systems. These features may involve new modules, service workers, or substantial refactoring.

## Milestone: Puzzle Editor (edit.html)

**Complexity:** High (milestone-level, multiple sub-features)  
**Description:** Separate page (`edit.html`) for creating and editing Sudoku puzzles. Not linked from main `index.html`. Accessible via direct URL only.

**Architecture:**

- Completely separate HTML file; no shared game logic
- Reuse `js/solver.js` for validation/difficulty rating
- Create new module `js/editor.js` for editor-specific logic
- Styling: Reuse `style/themes/` for consistency
- Puzzle output format: YAML (same as `data/puzzles.yaml`)

**Detailed Plan:**

- See `plans/puzzle-editor/plan.md`

### Editor UI & Board Input

**Description:** Interactive grid where user can click to place numbers (1-9) or leave blank for puzzle clues. Show real-time validation feedback.

**Implementation:**

- Create `edit.html` with identical game board HTML structure
- Add number input keypad (1-9 + Erase, like main game)
- Display current puzzle state as the user edits
- Add "Validate Puzzle" button to check for issues
- Show error messages: "No solution", "Multiple solutions", "Duplicate in row/column/box"

**Testing:**

- Verify grid correctly captures user input
- Test validation against solver
- Confirm clue requirements (minimum clues for unique solution)

### Puzzle Validation & Difficulty Rating

**Description:** Analyze completed puzzle to ensure exactly one solution exists. Optionally rate difficulty (Easy/Medium/Hard/Expert).

**Implementation:**

- Use `js/solver.js` `countSolutions(board)` to verify unique solution
- Implement difficulty rating based on solver hints needed:
  - `Easy` — Solvable with only naked singles
  - `Medium` — Requires hidden singles
  - `Hard` — Requires naked pairs/triples or more
  - `Expert` — Requires advanced techniques
- Display rating in editor UI
- Prevent save if validation fails

**Testing:**

- Test with known unique solution puzzles
- Test edge cases (0 clues, too many clues, no solution)
- Verify difficulty ratings are reasonable

### Save & Export

**Description:** Save edited puzzles in YAML format or to browser localStorage for quick access.

**Implementation:**

- Add "Save" button → prompts for puzzle name
- Generate YAML output matching `data/samples.yaml` format:
  ```yaml
  difficulty: Medium
  name: "My Puzzle"
  clues: |
    ..3.2...8.....
    ...
  ```
- Option to download file or copy to clipboard
- Option to save to browser localStorage (session-only or persistent)

**Testing:**

- Verify YAML output is valid
- Test roundtrip: edit → save → load in main game → display correctly
- Confirm localStorage persistence

### Load & Edit Existing Puzzles

**Description:** Load YAML puzzle files to edit existing puzzles or remix them.

**Implementation:**

- Add "Load Puzzle" button → file upload or paste YAML
- Parse YAML and populate editor grid
- Allow user to modify clues and re-validate
- Show original and modified puzzle states side-by-side (optional)

**Testing:**

- Test parsing valid YAML files
- Test graceful error handling for malformed input
- Verify editor state updates correctly

---

## Puzzle Scanner

**Complexity:** High  
**Description:** Allow users to scan physical Sudoku puzzles using their device camera or upload images. Uses OCR (Optical Character Recognition) to automatically extract puzzle clues from the image and populate the game board. Works in both the play view (for solving on-the-go) and the editor (for creating puzzles).

**Use Cases:**

1. **Players** — Photograph a puzzle from a newspaper/magazine/book and play it in the app
2. **Editors** — Scan hand-written or printed puzzles to digitize them for distribution

**Detailed Plan:**

- See `plans/scanner/plan.md`

**Core Features:**

### Camera Capture & Image Upload

- Add "Scan Puzzle" button to UI (both index.html and edit.html)
- Option 1: Real-time camera feed with photo capture
- Option 2: File upload (JPG, PNG) as fallback
- Display captured image in modal for preview/confirmation
- Allow user to adjust crop/rotation if needed

### OCR Processing

- Extract grid structure (9x9 layout) from image
- Recognize individual cell values (1-9) and empty cells
- Handle various formatting: printed, handwritten, different fonts, noise
- Return standardized puzzle data (array of 81 values)

**Implementation Notes:**

- OCR Library: Consider [Tesseract.js](https://github.com/naptha/tesseract.js) (pure JS, no server required)
- Alternative: Cloud OCR API (Google Cloud Vision, AWS Textract) — requires backend
- Image processing: Preprocess image (grayscale, threshold, perspective correction) before OCR
- Error handling: Show confidence scores; flag low-confidence cells for manual review
- Create `js/scanner.js` module with:
  - `captureImage()` → access camera or file input
  - `preprocessImage(imageData)` → adjust contrast, rotation, perspective
  - `extractGridFromImage(imageData)` → detect grid boundaries and cell positions
  - `recognizeCellValues(cellImages)` → OCR on individual cells
  - `validatePuzzleData(values)` → ensure valid Sudoku structure
- Add UI elements:
  - Scan button in `#action-row` (play view)
  - Scan button in editor toolbar
  - Modal for camera feed or file upload
  - Preview with editable cells (allow manual correction of OCR errors)
  - Confidence indicator (visual feedback for uncertain cells)

### Cell Confidence & Manual Review

- Display OCR confidence for each cell
- Highlight low-confidence cells (> 20% error) for user review
- Allow user to manually correct recognized values before confirming
- Save corrected values and retrain if using ML-based OCR

**Testing:**

- Test with various puzzle images: printed, handwritten, different quality levels
- Test edge cases: rotated images, partial puzzles, poor lighting
- Verify OCR accuracy on different fonts and writing styles
- Test camera permissions (mobile/desktop)
- Confirm grid detection on puzzles with/without thick borders
- Test manual correction workflow
- Verify validated puzzle loads correctly in both play view and editor

**Performance Considerations:**

- OCR processing is CPU-intensive; may take 2-5 seconds per image
- Consider async processing or web worker to avoid UI freeze
- Cache OCR results (in case user wants to re-scan same puzzle)
- Option: Show progress indicator during processing

**Browser Compatibility:**

- Camera API: Requires HTTPS and permission grant
- Tesseract.js: Supported on modern browsers (Chrome, Firefox, Safari, Edge)
- Fallback: File upload works on all browsers

**Privacy:**

- All processing happens client-side (Tesseract.js)
- No image data sent to server
- Camera/file access requires explicit user permission

**Future Enhancements:**

- Batch scanning: Upload multiple puzzle images at once
- Learn from corrections: Improve recognition on repeated user corrections
- Difficulty rating integration: Analyze puzzle complexity after scanning
- Integration with Puzzle Editor: Scanned puzzles auto-populate editor for refinement

**Related:** Works with both Puzzle Editor and main game play view

---

## Progressive Web App (PWA) Offline Support

**Complexity:** High  
**Description:** Convert Sudoku game to a PWA that works offline. Users can play puzzles without internet; new puzzle fetching requires online connection.

**Implementation:**

1. **Web App Manifest** (`manifest.json`)

   ```json
   {
     "name": "Sudoku Puzzle Game",
     "short_name": "Sudoku",
     "icons": [...],
     "start_url": "/index.html",
     "display": "standalone",
     "theme_color": "#f5f0e8",
     "background_color": "#f5f0e8"
   }
   ```

   - Add to `index.html`: `<link rel="manifest" href="manifest.json">`
   - Include 192x192 and 512x512 icons in `data/icons/`

2. **Service Worker** (`js/sw.js`)
   - Cache all static assets on install
   - Cache strategy for puzzles.json: network-first with cache fallback
   - Offline indicator: Show UI badge when offline

3. **Offline Support**
   - Cache current puzzle set (data/puzzles.json + ~20 puzzle YAML files)
   - Cached puzzles available for offline play
   - Show "Offline Mode" indicator in UI
   - Prevent "New Puzzle" from fetching online if offline
   - Fall back to random cached puzzle instead

**Implementation Notes:**

- Register service worker in `js/app.js` on `init()`:
  ```javascript
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("js/sw.js");
  }
  ```
- Cache bust on version upgrade (include VERSION in cache key)
- Update install prompt handler for "Add to Home Screen" on mobile

**Testing:**

- Verify service worker installs and activates
- Test offline gameplay with cached puzzles
- Confirm online connection restores "New Puzzle" functionality
- Test on real mobile device (add-to-home-screen flow)

---

## Summary: Implementation Guide

Full list of features to tackle:

- Share Functionality
- PWA Offline Support
- Dynamic Puzzle Fetching
- Puzzle Editor (all sub-features)
- Puzzle Scanner (camera/OCR)

---

## Testing & Release Notes

For each feature, before marking complete:

- [ ] All pure functions tested in isolation
- [ ] All handlers are top-level and testable
- [ ] State is immutable (no mutations)
- [ ] No console.log in production code
- [ ] JSDoc comments on all functions
- [ ] Standards-compliant (see `standards/coding/`)
- [ ] No new globals introduced
- [ ] Version bumped in `js/constants.js`
- [ ] `changelog.md` updated with feature summary
- [ ] Git tag created for release

---

## Architecture Constraints (MUST MAINTAIN)

All new code must follow project standards:

1. **Pure Functions** — All business logic has no side effects
2. **Top-Level Functions** — No nested functions (except closures in event handlers)
3. **Separation of Concerns**:
   - `solver.js` — Only puzzle logic
   - `state.js` — Only state transformations
   - `render.js` — Only DOM updates
   - `app.js` — Only orchestration
4. **Immutable State** — Use spread operators, never mutate inputs
5. **Guard Clauses** — No else blocks, return early
6. **Strict Equality** — Always use `===`
7. **JSDoc Comments** — All functions documented

See `AGENTS.md` and `standards/coding/` for full details.
