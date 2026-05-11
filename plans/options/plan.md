# Settings Panel — Implementation Plan

## Goal

Add a persistent user preferences panel accessible from the main game page. Settings are
stored in localStorage and applied immediately across sessions. The panel also serves as the
home for theme selection, with each theme implemented independently.

---

## Architecture

Settings are stored separately from game state — not in the `currentState` object. This
keeps game state pure and makes settings easy to load before the game initializes.

```
localStorage["sudoku-settings"]  →  settings object
         │
         ▼
  js/options.js           Pure functions: load, save, update
         │
         ▼
  js/app.js               onSettingsChange() → updateState() → re-render
```

---

## Module API (`js/options.js`)

All pure functions:

```javascript
const createDefaultOptions = () => ({
  highlightMode: 'related-box',  // none | same | minimal | related-box | related-all
  theme: 'default',               // default | dark | terminal | sepia | ...
  autoCheck: false,               // highlight errors automatically
})

const loadOptions = () => { ... }     // read from localStorage, merge with defaults
const saveOptions = (options) => { ... }  // write to localStorage
const updateOption = (options, key, value) => ({ ...options, [key]: value })
```

---

## UI

- Add **Settings button** to `#top-right-icons` (alongside GitHub icon)
- Settings panel opens as a modal (`#settings-modal`) initially hidden
- Modal contains:
  - Theme selector (dropdown or visual swatches)
  - Highlight mode selector (radio or dropdown): off / cross-only / minimal / all
  - Auto-check toggle (checkbox)
- Close button and click-outside-to-dismiss

---

## localStorage Migration

Currently `sudoku-theme` is stored as a standalone key. When Settings Panel ships:

- Read `sudoku-theme` as fallback for users upgrading from old version
- Write theme into `sudoku-settings` going forward
- Remove `sudoku-theme` after migrating

---

## Themes

Each theme is a separate CSS file in `style/themes/`. They all follow the same color
variable structure as `default.css` and `dark.css`. Implement independently in any order.

### Already Implemented

- `default.css` — Light, Okabe-Ito colorblind-safe
- `dark.css` — Dark, Okabe-Ito colorblind-safe

### To Implement

**Terminal**

- Black background, bright green or amber text
- Monospace font for cells (optional)
- High contrast; colorblind-safe accent colors

**Sepia / Vintage**

- Cream/off-white background, warm brown tones
- Muted highlights in sepia variants
- Optional subtle texture via CSS pattern

**Forest**

- Warm green background, wood brown accents
- Forest greens for highlights
- Colorblind-safe standards maintained

**Ocean / Water**

- Light blue background, deeper blue contrast
- Teal highlights
- Optional subtle gradient for water feel

**Sunset**

- Orange → pink → purple gradient-inspired palette
- Warm highlights and accents
- Maintain contrast for playability

**High Contrast**

- Pure black and white with bold primary colors
- Thickest borders for clarity
- No subtle highlights; all states visually distinct

**Cyberpunk / Neon**

- Dark background with neon accents (cyan, magenta, electric blue)
- Glow effects on selected/highlighted cells
- Bold, sharp contrast

### Adding a New Theme (Pattern)

1. Copy `style/themes/default.css` as a starting point
2. Rename and update all color values
3. Add the theme name to the `<select>` in `index.html` and the settings modal
4. Confirm all game states are visually distinguishable

---

## Open Questions

1. **Settings button placement**
   In `#top-right-icons` (alongside GitHub icon) or a dedicated row in the control panel?
   Top-right feels consistent with desktop app conventions; control panel feels more mobile-
   friendly.

2. **Theme swatches vs dropdown**
   Visual color swatches let users preview themes without selecting; a dropdown is simpler.
   Which is preferred for initial implementation?

3. **Auto-check behavior**
   When auto-check is on, should wrong cells highlight in real-time as the user types, or
   only after each number placement? Real-time is more immediate but may feel intrusive.

4. **Settings modal or inline panel**
   Modal (overlay, click outside to close) vs. inline panel that slides in from the side?
   Modal is simpler; slide panel may feel more native on mobile.

5. **Settings icon**
   A gear (⚙) SVG in `#top-right-icons` is the conventional choice. Confirm style/size
   should match the existing GitHub icon (24×24px, inherits body color).

---

## Testing

- Verify all settings persist after page reload
- Test that changing each setting applies immediately without page refresh
- Confirm defaults load when localStorage is empty or corrupted
- Test migration: old `sudoku-theme` key correctly imported into `sudoku-settings`
- For each theme: verify all cell states (selected, related, same-num, wrong) are visually
  distinct and pass basic contrast checks
