/**
 * Grid and puzzle constants.
 */
const GRID_SIZE = 9;
const TOTAL_CELLS = 81;
const BOX_SIZE = 3;

/**
 * Application version (semver: major.minor.patch).
 * Increment patch for bug fixes, minor for new features, major for breaking changes.
 * Resetting: minor reset resets patch; major reset resets both minor and patch.
 */
const VERSION = "1.16.5";

/**
 * Better status message lookup dictionary
 */
const STATUS_MESSAGES = {
  "All values are correct": 'All values for "{puzzleName}" are correct!',
  "Some cells are incorrect": 'Some values for "{puzzleName}" are incorrect.',
  "Puzzle solved!": 'Puzzle "{puzzleName}" solved!',
  "Puzzle is unsolveable": 'Puzzle "{puzzleName}" is unsolveable.',
  "Loaded puzzle": 'Loaded puzzle "{puzzleName}".',
  "Failed to load puzzle":
    'Failed to load puzzle "{puzzleName}": {errorMessage}',
};

/**
 * Characters used for encoding the board in the URL.
 * 64 characters allow encoding 6 bits per character, so 5 characters can encode 30 bits (enough for 27 cells).
 * The first 27 cells (3x3 block) are encoded in the URL for state persistence.
 */
const ENCODING_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
/**
 * Arrow key to offset mapping.
 */
const ARROW_MOVES = {
  ArrowRight: 1,
  ArrowLeft: -1,
  ArrowDown: GRID_SIZE,
  ArrowUp: -GRID_SIZE,
};

/**
 * Available themes.
 * Add new themes to this array for registration.
 */
const AVAILABLE_THEMES = [
  "default",
  "dark",
  "terminal",
  "sepia",
  "forest",
  "ocean",
  "sunset",
  "high-contrast",
  "cyberpunk",
];

/**
 * Default theme on first load.
 */
const DEFAULT_THEME = "default";

/**
 * Style configuration for highlight modes.
 * Each mode is a list of style features to apply.
 * Features: 'same value rows', 'same value cols', 'same value blocks', 'selected row', 'selected col', 'selected block', 'same value'.
 * styleSelectedCell and styleGivenCells are always applied.
 */
const HIGHLIGHT_FEATURES = [
  "same value rows",
  "same value cols",
  "same value blocks",
  "selected row",
  "selected col",
  "selected block",
  "same value",
  "immediate errors",
  "error cells",
];

const STYLE_CONFIGS = {
  None: [],
  Errors: ["immediate errors", "error cells"],
  Same: ["same value"],
  Minimal: ["selected row", "selected col"],
  "Related Block": [
    "selected block",
    "selected row",
    "selected col",
    "same value",
  ],
  "Related All": [
    "same value rows",
    "same value cols",
    "same value blocks",
    "selected row",
    "selected col",
    "same value",
  ],
};

/**
 * Backward-compatible aliases from legacy preset keys to current preset keys.
 */
const STYLE_CONFIG_ALIASES = {
  none: "None",
  errors: "Errors",
  same: "Same",
  minimal: "Minimal",
  "related-block": "Related Block",
  "related-all": "Related All",
  "related-box": "Related Block",
};
