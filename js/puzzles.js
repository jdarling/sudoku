/**
 * Derives a canonical puzzle id from a puzzle path.
 * @param {string} path - Puzzle path such as puzzles/easy/004.yaml
 * @returns {string} Derived id such as 004
 */
const derivePuzzleIdFromPath = (path) => {
  if (!path || typeof path !== "string") {
    return "";
  }

  const stem = path.split("/").pop() || "";
  return stem.replace(/\.yaml$/, "");
};

/**
 * Normalizes one puzzle index entry into the metadata shape used by the app.
 * @param {Object|string} entry - Raw index entry from JSON
 * @returns {Object|null} Normalized metadata entry or null when invalid
 */
const normalizePuzzleIndexEntry = (entry) => {
  if (typeof entry === "string") {
    const id = derivePuzzleIdFromPath(entry);
    return {
      id,
      path: entry,
      name: id,
      level: "",
      author: "",
      description: "",
    };
  }

  if (!entry || typeof entry !== "object") {
    return null;
  }

  const path = typeof entry.path === "string" ? entry.path : "";
  if (!path) {
    return null;
  }

  const derivedId = derivePuzzleIdFromPath(path);
  const id = typeof entry.id === "string" && entry.id ? entry.id : derivedId;

  return {
    id,
    path,
    name: typeof entry.name === "string" ? entry.name : "",
    level: typeof entry.level === "string" ? entry.level : "",
    author: typeof entry.author === "string" ? entry.author : "",
    description: typeof entry.description === "string" ? entry.description : "",
  };
};

/**
 * Builds a case-insensitive search string for one puzzle index entry.
 * Search spans all loader-visible metadata fields.
 * @param {Object} entry - Puzzle metadata entry
 * @returns {string} Lowercased concatenated search text
 */
const buildPuzzleSearchText = (entry) => {
  const fields = [
    entry.id,
    entry.name,
    entry.level,
    entry.author,
    entry.description,
    entry.path,
  ];
  return fields
    .filter((value) => typeof value === "string" && value)
    .join(" ")
    .toLowerCase();
};

/**
 * Normalizes a token into a comparable legacy puzzle path.
 * @param {string} token - Raw token from URL
 * @returns {string} Normalized path or empty string
 */
const normalizeLegacyPathToken = (token) => {
  if (!token || typeof token !== "string") {
    return "";
  }

  let normalized = decodeURIComponent(token).trim();
  normalized = normalized.replace(/\\/g, "/");
  normalized = normalized.replace(/^\//, "");
  normalized = normalized.replace(/\.\//g, "");
  normalized = normalized.replace(/\/\.\.(?=\/|$)/g, "");
  normalized = normalized.replace(/\/+/g, "/");

  if (!normalized) {
    return "";
  }

  if (!normalized.startsWith("puzzles/")) {
    normalized = `puzzles/${normalized}`;
  }
  if (!normalized.endsWith(".yaml")) {
    normalized = `${normalized}.yaml`;
  }

  return normalized;
};

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
 * Fetches the puzzle metadata index.
 * NOTE: This returns a manageable list of curated puzzles.
 * Do not use this to drive random selection at scale — use getRandomPuzzle() instead.
 * @returns {Promise<Object[]>} Array of metadata entries
 */
const getPuzzleIndex = async () => {
  const response = await fetch("data/puzzles.json");
  if (!response.ok) {
    throw new Error(`Failed to load puzzle index: ${response.statusText}`);
  }
  const rawIndex = await response.json();
  if (!Array.isArray(rawIndex)) {
    throw new Error("Failed to load puzzle index: invalid shape");
  }

  const entries = [];
  rawIndex.forEach((entry) => {
    const normalized = normalizePuzzleIndexEntry(entry);
    if (!normalized) {
      return;
    }
    entries.push(normalized);
  });

  return entries;
};

/**
 * Fetches puzzle paths from the metadata index.
 * @returns {Promise<string[]>} Array of puzzle filenames
 */
const getPuzzles = async () => {
  const entries = await getPuzzleIndex();
  return entries.map((entry) => entry.path);
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
 * @param {Object[]} entries - Array of metadata entries from index
 * @returns {Object} { exactMatch: filename|null, filtered: [entries] }
 */
const findPuzzleMatches = (token, entries) => {
  if (!token || !entries || entries.length === 0) {
    return { exactMatch: null, filtered: [] };
  }

  const sanitized = sanitizePuzzleToken(token);
  if (!sanitized) {
    return { exactMatch: null, filtered: [] };
  }

  const tokenLower = sanitized.toLowerCase();
  const canMatchCanonicalId =
    /^\d+$/.test(sanitized) && !sanitized.includes("/");
  let exactEntry = null;

  if (canMatchCanonicalId) {
    exactEntry =
      entries.find((entry) => entry.id.toLowerCase() === tokenLower) || null;
  }

  if (!exactEntry) {
    const normalizedPathToken = normalizeLegacyPathToken(token).toLowerCase();
    if (normalizedPathToken) {
      exactEntry =
        entries.find(
          (entry) => entry.path.toLowerCase() === normalizedPathToken,
        ) || null;
    }
  }

  const filtered = entries.filter((entry) => {
    return buildPuzzleSearchText(entry).includes(tokenLower);
  });

  return {
    exactMatch: exactEntry ? exactEntry.path : null,
    filtered,
  };
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
  const entries = await getPuzzleIndex();
  if (entries.length === 0) {
    throw new Error("No puzzles available");
  }

  let candidates = entries;
  if (excludeFilename && entries.length > 1) {
    candidates = entries.filter((entry) => entry.path !== excludeFilename);
  }

  const selected = candidates[Math.floor(Math.random() * candidates.length)];
  return getPuzzle(selected.path);
};
