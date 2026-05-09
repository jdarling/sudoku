/**
 * String interpolation utilities.
 */

/**
 * Formats a template string by replacing placeholders with values.
 * Replaces {key} with values[key] for all keys in the values object.
 * @param {string} template - Template with placeholders like {key}
 * @param {Object} values - Object with placeholder values
 * @returns {string} Formatted string with all placeholders replaced
 */
const formatString = (template, values) => {
  if (!template) {
    return template;
  }

  let message = template;
  Object.keys(values).forEach((key) => {
    message = message.split(`{${key}}`).join(String(values[key]));
  });
  return message;
};

/**
 * Extracts puzzle ID from a filename path.
 * Converts "puzzles/001.yaml" or "username/001.yaml" to "001".
 * @param {string} filename - Puzzle filename
 * @returns {string} Puzzle ID or "unknown" if empty
 */
const extractPuzzleId = (filename) => {
  if (!filename) {
    return 'unknown';
  }

  return filename.replace(/\.yaml$/, '').replace(/^puzzles\//, '');
};

/**
 * Normalizes user puzzle input to standard format: "puzzles/XXX.yaml"
 * Accepts formats: "001", "puzzles/001", "puzzles/001.yaml", "username/001"
 * @param {string} inputValue - User input value
 * @returns {string|null} Normalized filename or null if invalid
 */
const normalizePuzzleId = (inputValue) => {
  if (!inputValue || typeof inputValue !== 'string') {
    return null;
  }

  const trimmed = inputValue.trim();
  if (!trimmed) {
    return null;
  }

  let withoutExt = trimmed;
  if (trimmed.endsWith('.yaml')) {
    withoutExt = trimmed.slice(0, -5);
  }

  let puzzleId = withoutExt;
  if (withoutExt.startsWith('puzzles/')) {
    puzzleId = withoutExt.slice(8);
  }

  if (!/^\d+$/.test(puzzleId)) {
    return null;
  }

  return `puzzles/${puzzleId}.yaml`;
};

/**
 * Formats a status message with a puzzle name.
 * @param {string} statusMessage - Base status message key from STATUS_MESSAGES
 * @param {string} puzzleName - Puzzle display name
 * @param {Object} statusMessages - STATUS_MESSAGES constant
 * @returns {string} Formatted message or original if no template found
 */
const formatPuzzleStatus = (statusMessage, puzzleName, statusMessages) => {
  if (!statusMessage || !puzzleName) {
    return statusMessage;
  }

  const template = statusMessages[statusMessage];
  if (template) {
    return formatString(template, { puzzleName });
  }

  return statusMessage;
};

/**
 * Resolves a style config key to a canonical STYLE_CONFIGS key.
 * @param {string} preset - Preset key or alias
 * @returns {string} Canonical key
 */
const resolveStyleConfigKey = (preset) => {
  if (typeof preset !== 'string') {
    return 'Related Block';
  }
  if (STYLE_CONFIGS[preset]) {
    return preset;
  }
  if (STYLE_CONFIG_ALIASES[preset]) {
    return STYLE_CONFIG_ALIASES[preset];
  }
  return 'Related Block';
};

/**
 * Returns style features for a preset key with alias and fallback support.
 * @param {string} preset - Preset key or alias
 * @returns {string[]} Feature list for the resolved preset
 */
const getStyleConfigFeatures = (preset) => {
  const key = resolveStyleConfigKey(preset);
  return STYLE_CONFIGS[key] || STYLE_CONFIGS['Related Block'];
};
