# Theming Guide

This document explains how the theme system works and how to add new themes.

## Overview

The Sudoku app uses a modular theme system that separates layout (geometry, spacing) from colors (theming). This allows easy theme addition without duplicating structural CSS.

## Architecture

### File Organization

- `style/layout.css` — Structural styles (sizing, positioning, spacing) shared by all themes
- `style/themes/default.css` — Okabe-Ito colorblind-safe light theme
- `style/themes/dark.css` — Dark theme variant
- `js/theme.js` — Theme management (switching, persistence)
- `js/constants.js` — `AVAILABLE_THEMES` and `DEFAULT_THEME` constants

### Theme Switching Flow

1. User selects a theme from the dropdown
2. `app.js` calls `applyTheme(themeName)`
3. `js/theme.js` swaps the stylesheet link to the new theme
4. User preference is saved to `localStorage` (key: `sudoku-theme`)
5. On page reload, the saved theme is restored

## Color Specifications

### Default Theme (Okabe-Ito Colorblind-Safe Palette)

Colors are optimized for colorblind accessibility:

- **Background:** `#f5f0e8` (warm beige)
- **Text:** `#1a1a1a` (near-black)

#### Cell Highlighting

- **Given (pre-filled):** `#dcdcdc` (neutral grey)
- **Selected:** `#5b9bd5` white text (blue)
- **Related row/column:** `#b8d4ed` (medium blue)
- **Related box only:** `#deeaf6` (pale blue)
- **Same number:** `#f5c842` (amber)
- **Wrong entry:** `#f5d5c0` background, `#c0502a` text (vermillion)

#### Button Styling

- **Number buttons:** White background, light grey hover
- **Check button:** Blue border and text, pale blue hover
- **Hint button:** Gold border and text, light gold hover

#### Status Messages

- **Win:** Green (`#0a6e3f`) bold
- **Error:** Red (`#b03a2e`)

### Dark Theme

- **Background:** `#1a1a1a` (dark grey)
- **Text:** `#e8e4dc` (warm white)

#### Cell Highlighting

- **Given:** `#333` (medium grey)
- **Selected:** `#1e3a52` (dark blue)
- **Related row/column:** `#2a3a52` (darker blue)
- **Related box only:** `#2a2a2a` (very dark grey)
- **Same number:** `#1a3d2e` (dark green)
- **Wrong entry:** `#3d1f1a` background, `#e06c5a` text (orange)

#### Button Styling

- **Number buttons:** Dark background, darker hover
- **Check button:** Blue border and text
- **Hint button:** Gold border and text

#### Status Messages

- **Win:** Green (`#4caf82`) bold
- **Error:** Orange (`#e06c5a`)

## Adding a New Theme

### Step 1: Create Theme Stylesheet

Create `style/themes/yourtheme.css` with the following structure:

```css
/**
 * Your theme description.
 * Complements layout.css for geometry and spacing.
 */

body {
  background: #yourbg;
  color: #yourtext;
}

h1 {
  color: #yourheading;
}

#status {
  color: #yourstatustext;
}

#status.win {
  color: #yourwin;
  font-weight: 600;
}

#status.error {
  color: #yourerror;
}

table {
  border: 2.5px solid #yourborder;
}

td {
  border: 0.5px solid #yoursub;
}

td:nth-child(3n) {
  border-right-color: #yourborder;
}

tr:nth-child(3n) td {
  border-bottom-color: #yourborder;
}

input.cell {
  color: #yourtext;
}

input.cell.given {
  background: #yourgiven;
}

input.cell.selected {
  background: #yourselected;
  color: #yourselectedtext;
}

input.cell.related-line {
  background: #yourrelated-line;
}

input.cell.related {
  background: #yourrelated;
}

input.cell.same-num {
  background: #yoursamenum;
}

input.cell.wrong {
  background: #yourwrongbg;
  color: #yourwrongtext;
}

.num-btn {
  border-color: #yourbtnborder;
  background: #yourbtnbg;
  color: #yourbtntext;
}

.num-btn:hover {
  background: #yourbtnhover;
  border-color: #yourbtnhoverborder;
}

.num-btn.erase {
  color: #yourerase;
}

.action-btn {
  border-color: #yourbtnborder;
  background: #yourbtnbg;
  color: #yourbtntext;
}

.action-btn:hover {
  background: #yourbtnhover;
  border-color: #yourbtnhoverborder;
}

#check-btn {
  border-color: #yourcheckborder;
  color: #yourchecktxt;
}

#check-btn:hover {
  background: #yourcheckhoverbg;
}

#hint-btn {
  border-color: #yourhintborder;
  color: #yourhinttext;
}

#hint-btn:hover {
  background: #yourhinthoverbg;
}

#theme-row {
  color: #yourthemerowtext;
}

#theme-select {
  border-color: #yourselectionborder;
  background: #yourselectionbg;
  color: #yourselectiontext;
}

#theme-select:hover {
  border-color: #yourselectionhovreborder;
}

#version {
  font-size: 11px;
  color: #yourversiontext;
  font-family: system-ui, sans-serif;
  margin-top: 0.25rem;
}
```

### Step 2: Register Theme

Add your theme to `js/constants.js`:

```javascript
const AVAILABLE_THEMES = ["default", "dark", "yourtheme"];
```

### Step 3: Add Theme Option to Dropdown

Update `index.html` theme selector:

```html
<select id="theme-select">
  <option value="default">Default</option>
  <option value="dark">Dark</option>
  <option value="yourtheme">Your Theme</option>
</select>
```

### Step 4: Test

1. Open the app
2. Select your theme from the dropdown
3. Verify:
   - Cells highlight correctly with proper colors
   - Related cells (row, column, box) distinguish properly
   - Given cells are visible and styled
   - Wrong entries show in error color
   - Theme persists after page reload
   - Buttons are styled appropriately

## Important: Related Cell Highlighting

The `related-line` and `related` classes must have distinct colors so users can distinguish:

- **Row/Column highlights** (`related-line`): Row and column peers of selected cell
- **Box-only highlights** (`related`): Box peers that aren't in the same row/column

This distinction is critical for playability. Choose colors with sufficient contrast.

## Persistence

Themes are saved to `localStorage` using the key `sudoku-theme`. To test in a new browser:

1. Open Developer Tools → Application tab
2. Check `localStorage` for `sudoku-theme` key
3. Clear it to reset to default theme

## Testing Guidelines

When adding a theme:

1. **Contrast:** Ensure text is readable against all backgrounds
2. **Distinction:** Related-line and related colors must be clearly different
3. **Colorblind:** Rely on color + brightness, not color alone
4. **Mobile:** Test on small screens where cells are tightly packed
5. **Performance:** Keep CSS to layout and color (avoid animations in themes)

## Future Enhancements

Potential improvements:

- System theme detection (prefers-color-scheme)
- Custom color picker UI
- Theme export/import
- Accessibility preferences (high contrast mode)
- Per-theme font variants
