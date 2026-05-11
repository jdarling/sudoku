# Sudoku

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A lightweight browser-based Sudoku game with clean separation of concerns, pure function architecture, and community-contributed puzzles.

**🎮 [Play online](https://jdarling.github.io/sudoku/) (hosted on GitHub Pages)**

## Quick Start

### Run Locally (No Server)

1. Clone or download this repository
2. Open `index.html` in your browser

That's it. If your browser blocks fetech then you can always Run with Docker...

### Run with Docker (Recommended for Development)

```bash
./up.sh --port 8080
```

Then open http://localhost:8080

## How to Play

- **Select a cell** — Click any cell to select it (highlights in blue)
- **Enter a number** — Type 1-9 or click the number buttons
- **Move around** — Use arrow keys, or click other cells
- **Erase** — Press Backspace, Delete, or 0
- **Check your work** — Click "Check" to highlight errors
- **Get a hint** — Click "Hint" to reveal one correct cell
- **Get the solution** — Click "Solve" and confirm to auto-fill the board
- **Load a puzzle** — Click "Load Game" to pick from the available puzzles
- **Start over** — Click "New Game" and confirm to load a random puzzle
- **Change theme** — Click "Options" and choose a theme from the dropdown

### Visual Guide

| Color                | Meaning                                       |
| -------------------- | --------------------------------------------- |
| Blue background      | Currently selected cell                       |
| Gray background      | Same row, column, or 3×3 box as selected cell |
| Green background     | Contains same number as selected cell         |
| Light red background | Incorrect entry (shown after clicking Check)  |

### Loading Specific Puzzles

Use the `puzzle` query parameter to load a specific puzzle:

- `http://example.com?puzzle=001` — Load puzzle 001
- `http://example.com?puzzle=042` — Load puzzle 042
- `http://example.com?puzzle=username/001` — Load puzzle in a subfolder (for future organization)
- `http://example.com` — Load a random puzzle

This lets you:

- **Share puzzle links** — Send someone a direct link to a specific puzzle
- **Bookmark favorites** — Browser bookmarks preserve the puzzle
- **Navigate history** — Use back/forward buttons to switch puzzles
- **Organize puzzles** — Later, contributors can organize by username or theme

## Features

- **Pure functions** — All business logic is testable and dependency-free
- **Clean architecture** — Strict separation between data, rendering, and UI orchestration
- **Community puzzles** — Puzzles are YAML files; contributors can add new ones via PR
- **Two puzzle formats** — Write puzzles as rows or as 3×3 blocks—whatever's clearer
- **Async puzzle loading** — Puzzles load on demand, not all at once
- **Load puzzle modal** — Browse and filter all available puzzles; double-click to load
- **Themed UI** — Nine selectable themes (Default, Dark, Terminal, Sepia, Forest, Ocean, Sunset, High Contrast, Cyberpunk); preference is saved automatically
- **Styled modals** — New Game and Solve confirmations use a consistent modal instead of browser dialogs
- **Options panel** — Theme selection lives in the Options modal, not cluttering the main UI
- **No dependencies** — Pure vanilla JavaScript (except js-yaml for parsing puzzles)
- **Works everywhere** — Any modern browser (Chrome, Firefox, Safari, Edge)

## Project Structure

```
sudoku/
├── index.html              # Page structure
├── up.sh                   # Docker startup script
├── style/
│   ├── layout.css          # Layout, geometry, and modal styles
│   └── themes/             # One CSS file per theme
│       ├── default.css
│       ├── dark.css
│       └── ...             # terminal, sepia, forest, ocean, sunset, high-contrast, cyberpunk
├── js/
│   ├── constants.js        # Grid constants, theme list, status messages
│   ├── utils.js            # Shared pure utilities (string formatting, encoding)
│   ├── solver.js           # Sudoku constraint logic and backtracking solver
│   ├── state.js            # Pure state transformation functions
│   ├── render.js           # DOM rendering and view updates
│   ├── puzzles.js          # Puzzle loading and parsing
│   ├── theme.js            # Theme persistence and switching
│   ├── dom.js              # DOM event handlers and URL persistence
│   ├── app.js              # Application orchestration
│   └── components/         # Reusable UI modal components
│       ├── modal.js        # Generic open/close/isOpen for aria-based modals
│       ├── table.js        # Generic filterable table rendering
│       ├── loadmodal.js    # Load puzzle modal
│       ├── confirmmodal.js # Yes/No confirmation modal
│       └── optionsmodal.js # Options/settings modal
├── data/
│   ├── puzzles.json        # Index of available puzzles
│   ├── puzzles/            # Individual puzzle YAML files
│   │   ├── 001.yaml
│   │   ├── 002.yaml
│   │   └── ...
│   └── samples.yaml        # Documented example puzzles
├── docs/
│   └── design.md           # Architecture and design decisions
├── standards/
│   └── coding/             # Coding standards for contributions
├── tests/                  # Node.js and browser test harness
└── readme.md               # This file
```

## Contributing Puzzles

1. Copy `data/samples.yaml` as a guide
2. Create a new file in `data/puzzles/` with a unique name (e.g., `006.yaml`)
3. Write your puzzle in either `rows` or `blocks` format (see samples for examples)
4. Run `node tools/generate-puzzle-index.js` to regenerate `data/puzzles.json`
5. Submit a pull request

Example:

```yaml
name: My Puzzle
author: Your Name
difficulty: easy
puzzle:
  rows:
    - "530070000"
    - "600195000"
    - ...
```

All values must be quoted strings to avoid YAML parsing issues with leading zeros.

## Architecture Overview

See [docs/design.md](docs/design.md) for a detailed walkthrough of:

- **Module structure** — How responsibilities are split across files
- **State model** — How the puzzle and board state work
- **Core algorithms** — Constraint validation, backtracking solver, related cell lookup
- **Rendering strategy** — How the UI updates on state changes
- **Pure functions** — Why all methods are testable

## Browser Support

Works in any modern browser. Requires:

- ES6 (arrow functions, const/let, template literals)
- Fetch API
- DOM Level 3 Events

## For AI Assistants

This project has specific architectural constraints to maintain code quality and testability. See [AGENTS.md](AGENTS.md) for:

- Architecture principles (pure functions, top-level functions, separation of concerns)
- Coding standards and style guidelines
- File organization and module responsibilities
- Common tasks and workflows
- Testing checklist before considering changes complete

## Development

All code follows the standards in `standards/coding/`. Key points:

- JavaScript — Arrow functions, guard clauses, no else blocks, JSDoc comments
- Bash — Strict mode, guard clauses, clear error messages
- All functions are top-level and testable
- State is immutable (spread operators, new arrays/objects)
- No global state except the current game state in `app.js`

### Testing (Preferred CLI Output)

For day-to-day validation in terminal workflows, run:

```bash
node tests/run-node-tests.js --report-only-failures --report-status
```

This keeps output focused on failures while still printing a clear PASS/FAIL summary line.

When full per-test output is needed, run without flags:

```bash
node tests/run-node-tests.js
```
