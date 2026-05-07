/**
 * Parses a YAML puzzle document into an 81-digit puzzle string.
 * Supports both rows and blocks formats.
 * @param {Object} doc - Parsed YAML document
 * @returns {string} 81-digit puzzle string
 */
const parsePuzzleDoc = (doc) => {
  if (doc.puzzle.rows) {
    return doc.puzzle.rows.join('');
  }

  const ORDER = [
    'top-left',
    'top-center',
    'top-right',
    'middle-left',
    'middle-center',
    'middle-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ];
  const blocks = doc.puzzle.blocks;
  const rows = ['', '', '', '', '', '', '', '', ''];
  ORDER.forEach((name, blockIndex) => {
    const blockRow = Math.floor(blockIndex / BOX_SIZE) * BOX_SIZE;
    blocks[name].forEach((digits, rowOffset) => {
      rows[blockRow + rowOffset] += digits;
    });
  });
  return rows.join('');
};

/**
 * Fetches the puzzle index.
 * NOTE: This returns a manageable list of curated puzzles.
 * Do not use this to drive random selection at scale — use getRandomPuzzle() instead.
 * @returns {Promise<string[]>} Array of puzzle filenames
 */
const getPuzzles = async () => {
  const response = await fetch('data/puzzles.json');
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
 * Fetches a random puzzle.
 * Currently selects from the local index — replace this implementation
 * with an API call (e.g. GET /api/puzzles/random) when a backend is available,
 * so the server handles selection without transferring the full index.
 * @returns {Promise<Object>} A random puzzle object
 */
const getRandomPuzzle = async () => {
  const filenames = await getPuzzles();
  const filename = filenames[Math.floor(Math.random() * filenames.length)];
  return getPuzzle(filename);
};
