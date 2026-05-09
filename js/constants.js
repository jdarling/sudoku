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
const VERSION = "1.12.9";

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
const AVAILABLE_THEMES = ["default", "dark"];

/**
 * Default theme on first load.
 */
const DEFAULT_THEME = "default";
