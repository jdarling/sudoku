/**
 * Parses a YAML puzzle document into an 81-digit puzzle string.
 * Supports both rows and blocks formats.
 * @param {Object} doc - Parsed YAML document
 * @returns {string} 81-digit puzzle string
 */
const parsePuzzleDoc = (doc) => {
  if (doc.puzzle.rows) {
    return doc.puzzle.rows.join("");
  }

  const ORDER = [
    "top-left",
    "top-center",
    "top-right",
    "middle-left",
    "middle-center",
    "middle-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
  ];
  const blocks = doc.puzzle.blocks;
  const rows = ["", "", "", "", "", "", "", "", ""];
  ORDER.forEach((name, blockIndex) => {
    const blockRow = Math.floor(blockIndex / BOX_SIZE) * BOX_SIZE;
    blocks[name].forEach((digits, rowOffset) => {
      rows[blockRow + rowOffset] += digits;
    });
  });
  return rows.join("");
};

/**
 * Fetches the puzzle index.
 * NOTE: This returns a manageable list of curated puzzles.
 * Do not use this to drive random selection at scale — use getRandomPuzzle() instead.
 * @returns {Promise<string[]>} Array of puzzle filenames
 */
const getPuzzles = async () => {
  const response = await fetch("data/puzzles.json");
  if (!response.ok) {
    throw new Error(`Failed to load puzzle index: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Fetches and parses a puzzle by filename.
 * @param {string} filename - Puzzle filename relative to data/
 * @returns {Promise<Object>} Puzzle object with metadata, filename, and 81-digit puzzle string
 */
const getPuzzle = async (filename) => {
  const response = await fetch(`data/${filename}`);
  if (!response.ok) {
    throw new Error(
      `Failed to load puzzle ${filename}: ${response.statusText}`,
    );
  }
  const text = await response.text();
  const doc = jsyaml.load(text);
  return {
    filename,
    name: doc.name,
    author: doc.author,
    difficulty: doc.difficulty,
    puzzle: parsePuzzleDoc(doc),
  };
};

/**
 * Sanitizes a puzzle token for matching.
 * Strips puzzles/ prefix, .yaml suffix, URL-decodes, and removes path traversal segments.
 * @param {string} token - Raw puzzle token from URL or user input
 * @returns {string} Sanitized token safe for matching
 */
const sanitizePuzzleToken = (token) => {
  if (!token || typeof token !== "string") {
    return "";
  }

  let sanitized = token.trim();
  sanitized = decodeURIComponent(sanitized);
  sanitized = sanitized.replace(/^puzzles[\/\\]/, "");
  sanitized = sanitized.replace(/\.yaml$/, "");
  sanitized = sanitized.replace(/\\/g, "/");
  sanitized = sanitized.replace(/^\//, "");
  sanitized = sanitized.replace(/\/\.\.\//g, "/");
  sanitized = sanitized.replace(/^\.\.\//, "");
  sanitized = sanitized.replace(/\/\.\//, "/");
  sanitized = sanitized.replace(/^\.\//, "");

  return sanitized;
};

/**
 * Finds puzzle matches for a given token against the puzzle index.
 * Returns an exact match if the token matches a puzzle ID exactly,
 * and a list of filtered candidates for non-exact tokens.
 * @param {string} token - Raw puzzle token
 * @param {string[]} filenames - Array of puzzle filenames from index
 * @returns {Object} { exactMatch: filename|null, filtered: [filenames] }
 */
const findPuzzleMatches = (token, filenames) => {
  if (!token || !filenames || filenames.length === 0) {
    return { exactMatch: null, filtered: [] };
  }

  const sanitized = sanitizePuzzleToken(token);
  if (!sanitized) {
    return { exactMatch: null, filtered: [] };
  }

  const tokenLower = sanitized.toLowerCase();
  let exactMatch = null;
  const filtered = [];

  filenames.forEach((filename) => {
    const basename = filename.replace(/^puzzles\//, "").replace(/\.yaml$/, "");
    const basenameForId = basename.split("/").pop();

    if (basenameForId === tokenLower || basename === tokenLower) {
      exactMatch = filename;
    }

    if (basename.toLowerCase().includes(tokenLower)) {
      filtered.push(filename);
    }
  });

  return { exactMatch, filtered };
};

/**
 * Fetches a random puzzle.
 * Currently selects from the local index — replace this implementation
 * with an API call (e.g. GET /api/puzzles/random) when a backend is available,
 * so the server handles selection without transferring the full index.
 * @param {string|null} excludeFilename - Optional filename to avoid when possible
 * @returns {Promise<Object>} A random puzzle object
 */
const getRandomPuzzle = async (excludeFilename = null) => {
  const filenames = await getPuzzles();
  if (filenames.length === 0) {
    throw new Error("No puzzles available");
  }

  let candidates = filenames;
  if (excludeFilename && filenames.length > 1) {
    candidates = filenames.filter((filename) => filename !== excludeFilename);
  }

  const filename = candidates[Math.floor(Math.random() * candidates.length)];
  return getPuzzle(filename);
};
