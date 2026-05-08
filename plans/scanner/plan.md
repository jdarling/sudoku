# Puzzle Scanner — Implementation Plan

## Goal

Take any image (from camera, file upload, or canvas) and return a `number[81]` board array
where `0` means empty and `1–9` are the given clue values.

The module (`js/scanner.js`) has no knowledge of the game state, UI, or DOM beyond the
canvas API. It takes an image/canvas in, returns a board out. How the image gets there and
what happens with the board are handled by the caller.

---

## Pipeline Overview

```
Image / Canvas
     │
     ▼
1. Normalize       → grayscale + adaptive threshold → binary canvas
     │
     ▼
2. Find the grid   → edge detection → largest quadrilateral → 4 corner points
     │
     ▼
3. Correct angle   → perspective transform → clean top-down square canvas
     │
     ▼
4. Extract cells   → divide 9×9 → 81 trimmed cell canvases
     │
     ▼
5. Classify cells  → digit recognition per cell → number[81]
```

---

## Step 1 — Normalize

- Convert RGBA canvas to grayscale (luminance formula: 0.299R + 0.587G + 0.114B)
- Apply **adaptive threshold**: for each pixel, compare to the mean of its local neighborhood
  rather than a global cutoff — handles uneven lighting in phone photos
- Output: binary (black/white) canvas at original resolution

---

## Step 2 — Find the Grid

- Compute image gradients (simple Sobel filter) to detect edges
- Scan for the largest connected quadrilateral region
- Return 4 corner points: `[tl, tr, br, bl]` as `{x, y}` objects
- Strategy: find the outermost prominent rectangle that contains the puzzle

---

## Step 3 — Perspective Correction

- Map the 4 detected corners to a perfect square output canvas (e.g. 450×450px)
- Apply a perspective (projective) transform — handles photos taken at an angle
- Output: clean top-down canvas of just the grid, fixed size

---

## Step 4 — Extract Cells

- Divide the 450×450 corrected canvas into a 9×9 grid → 81 cell canvases (50×50px each)
- Trim a few pixels of border from each cell to remove grid lines from the sample area
- Output: `canvas[81]`, index order left-to-right, top-to-bottom (same as board array)

---

## Step 5 — Classify Each Cell

For each cell canvas:

1. Check if the cell contains ink (average pixel darkness below a threshold → non-empty)
2. If empty → return `0`
3. If non-empty → classify digit `1–9`

### Digit Classification Options

**Option A — Template Matching**

- Compare each cell against 9 reference digit images using normalized cross-correlation
- Simple, zero dependencies, works well on printed/clean puzzles
- Less tolerant of handwriting, unusual fonts, or skew

**Option B — Zone Feature Vectors**

- Divide each cell into a 4×4 zone grid (16 zones)
- Compute ink density per zone → 16-element feature vector
- Compare against reference vectors (one per digit) using nearest-neighbor distance
- More tolerant of font variation and minor distortion

**Recommendation:** Start with Option A (templates) since it is simpler to reason about and
test. Design the classifier as a swappable function so Option B can replace it later without
touching the rest of the pipeline.

---

## Module API (`js/scanner.js`)

All functions are pure (canvas/data in, data out, no side effects):

```javascript
/**
 * Main entry point. Accepts an HTMLImageElement, HTMLCanvasElement, or ImageData.
 * Returns a number[81] board where 0 = empty, 1-9 = clue digit.
 */
const scanImage = (source) => { ... }

// Internal pipeline steps (all exported for testing):
const toGrayscale = (canvas) => canvas
const adaptiveThreshold = (canvas, blockSize, offset) => canvas
const detectGridCorners = (canvas) => [tl, tr, br, bl]
const perspectiveTransform = (canvas, corners, outputSize) => canvas
const extractCells = (canvas) => canvas[81]
const isCellEmpty = (canvas, threshold) => boolean
const classifyDigit = (canvas, templates) => 1–9
```

---

## Test Strategy

### Synthetic test images (no real photos needed to start)

Generate known-value grids programmatically:

- Draw a Sudoku grid on a canvas with a fixed font
- Run through the pipeline
- Assert output matches the drawn values

This validates the full pipeline end-to-end before any real photos arrive.

### Real photo tests

Once reference images are added to `plans/scanner/images/`:

- Each image paired with a known expected board (JSON sidecar file)
- Test runner compares scanner output to expected board
- Track accuracy: cells correct / 81

### Per-step unit tests

Each pipeline function can be tested independently since they are all pure:

- `toGrayscale` — assert output is grayscale
- `adaptiveThreshold` — assert output is binary
- `detectGridCorners` — assert 4 points returned for a known synthetic image
- `extractCells` — assert 81 canvases returned at correct dimensions
- `classifyDigit` — assert correct digit for each reference template

---

## Open Questions

1. **Digit classification strategy**
   Start with template matching (Option A) or zone feature vectors (Option B)?
   Templates are simpler; feature vectors are more robust. Can swap later either way.

2. **External dependencies**
   Pure canvas API only (works browser + Node with canvas package), or open to a small
   image-processing library? A lightweight option like `@napi-rs/canvas` improves Node
   testing but is not required for browser use.

3. **Reference digit templates**
   Templates need to come from somewhere. Options:
   - Generate them synthetically (draw each digit 1–9 in a standard font programmatically)
   - Extract them from the first successfully detected puzzle (bootstrap from real data)
   - Ship a pre-built set of 50×50 binary digit images in `data/digit-templates/`

4. **Perspective transform implementation**
   A projective transform requires solving an 8-parameter homography matrix. This is
   straightforward linear algebra but ~60 lines of code. Confirm we want this vs. a simpler
   affine transform (which only corrects rotation/scale, not keystoning).

5. **Synthetic test image generation**
   Should the test image generator be a separate script (`tests/generate-test-images.js`)
   or built into the scanner test file? A separate script makes it reusable for generating
   new test cases when real photos are added.

6. **Node vs browser canvas**
   The pipeline uses the canvas API. For Node-based tests (current test runner is Node),
   we need either `canvas` npm package or a lightweight alternative. Confirm this is
   acceptable before adding it as a dev dependency.

---

## Reference Materials

Place reference images and supporting files in this folder:

```
plans/scanner/
├── plan.md          ← this file
├── images/          ← reference puzzle photos for testing
│   └── *.jpg / *.png
└── expected/        ← JSON sidecar files with known board values per image
    └── *.json
```
