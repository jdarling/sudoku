# Contributing to Sudoku

Thanks for your interest in contributing! There are two main ways to help:

## Contributing Puzzles

The easiest way to contribute is to add a new puzzle.

### Quick Start

1. Copy `data/samples.yaml` as a template
2. Create a new file in `data/puzzles/` with a unique three-digit name (e.g., `006.yaml`, `042.yaml`)
3. Fill in the puzzle details:
   ```yaml
   name: My Puzzle Title
   author: Your Name
   difficulty: easy # or medium, hard
   puzzle:
     rows:
       - "530070000"
       - "600195000"
       - "098000060"
       - "800060003"
       - "400803001"
       - "700050006"
       - "060000280"
       - "000009005"
       - "000040079"
   ```
4. Add your filename to `data/puzzles.json` (one line, in order)
5. Test locally: run `./up.sh` and open `http://localhost:8080?puzzle=006` to test your puzzle
6. Submit a pull request

### Puzzle Format

- **All puzzle values must be quoted strings** (e.g., `'098'` not `098`) to prevent YAML octal parsing
- `0` or `'0'` represents an empty cell
- Use `rows` format (9 rows of 9 digits) OR `blocks` format (3×3 blocks with named positions)
- See `data/samples.yaml` for complete examples of both formats

### Metadata

- `name` — Puzzle title (required, unique)
- `author` — Your name (required)
- `difficulty` — `easy`, `medium`, or `hard` (required)
- `schemaVersion` — Version of puzzle format (optional)
- `version` — Puzzle version number (optional)

## Contributing Code

Before starting a code change, read:

1. [AGENTS.md](AGENTS.md) — Architecture constraints and principles
2. [docs/design.md](docs/design.md) — How the system works
3. `standards/coding/` — Coding standards (JavaScript and Bash)

### Key Constraints

**All code must be:**

- **Pure functions** — No side effects, no global state access (except `currentState` in `app.js`)
- **Top-level** — Every function must be independently testable at module scope
- **Immutable state** — Use spread operators (`{ ...state, field: value }`)
- **Separated concerns** — Logic in `js/state.js`, rendering in `js/render.js`, orchestration in `js/app.js`
- **No else blocks** — Use guard clauses and early returns
- **Well-documented** — JSDoc comments on all functions with `@param` and `@returns`

**Code style:**

- Arrow functions: `const name = () => {}`
- Const by default, `let` only for reassignment
- Single quotes for strings (except YAML/JSON)
- Strict equality: `===` not `==`
- Semicolons at end of statements
- All braces, even for single statements: `if (x) { return; }`

### Making a Change

1. **Read the file** before editing (formatters may have changed it)
2. **Identify the right module:**
   - Logic → `js/state.js`
   - Rendering → `js/render.js`
   - Loading → `js/puzzles.js`
   - Orchestration → `js/app.js`
   - Constants → `js/constants.js`
3. **Write pure functions** — Test them in isolation
4. **Use multi-operation edits** to avoid multiple file writes
5. **Check against standards** before submitting

### Branching Workflow

- Keep `main` stable and release-ready
- Start feature work on `feat/v<major>.<minor>` branches (no patch in branch name)
- Example branch names: `feat/v1.12`, `feat/v2.0`
- Keep bug-fix patches for that line on the same branch until release
- Merge back to `main` only when the major.minor line is stable

### Example: Adding "Undo"

1. Add state field in `js/state.js`:

   ```javascript
   /**
    * @param {Object} state
    * @returns {Object} new state with history
    */
   const createStateFromPuzzle = (puzzleStr) => ({
     // ... existing fields
     history: [],
   });
   ```

2. Add undo function in `js/state.js`:

   ```javascript
   /**
    * @param {Object} state
    * @returns {Object} state rolled back to previous move
    */
   const undo = (state) => {
     if (state.history.length === 0) {
       return state;
     }
     return state.history[state.history.length - 1];
   };
   ```

3. Add handler in `js/app.js`:

   ```javascript
   const onUndo = () => {
     updateState(undo(currentState));
   };
   ```

4. Add button listener in `init()` in `js/app.js`
5. No other files should change

## Testing

Before submitting:

- [ ] All pure functions work in isolation with multiple test inputs
- [ ] All handlers are top-level and callable with synthetic events
- [ ] State is immutable (no mutations of input objects)
- [ ] No else blocks (guard clauses only)
- [ ] JSDoc comments on all functions
- [ ] No console.log left in code
- [ ] No new globals introduced
- [ ] Code matches standards in `standards/coding/`

### Testing Specific Puzzles

Use the `puzzle` query parameter to load and test specific puzzles directly:

```
http://localhost:8080?puzzle=001              # Load puzzles/001.yaml
http://localhost:8080?puzzle=042              # Load puzzles/042.yaml
http://localhost:8080?puzzle=username/001     # Load puzzles/username/001.yaml
```

This is useful for:

- **Testing new puzzles before committing** — Create `data/puzzles/999.yaml`, then visit `?puzzle=999`
- **Sharing puzzle links** — Send `http://example.com?puzzle=042` to someone to load that exact puzzle
- **Browser history** — Back/forward buttons work to switch between puzzles
- **Organizing puzzles** — Use subfolders for collections: `?puzzle=johndoe/easy-001`

The query parameter format accepts:

- **Short form**: `?puzzle=001` → loads `data/puzzles/001.yaml`
- **Full form**: `?puzzle=puzzles/custom/example.yaml` → loads that specific file
- **Subfolder form**: `?puzzle=username/001` → loads `data/puzzles/username/001.yaml`
- **No parameter**: No `?puzzle` → loads a random puzzle

## Issues and Feedback

- Found a bug? Create an issue with steps to reproduce
- Have a feature idea? Open an issue to discuss before implementing
- Want to improve documentation? Pull requests welcome!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
