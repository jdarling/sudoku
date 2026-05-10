#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const EXIT_GENERIC = 1;
const EXIT_ID_COLLISION = 2;
const EXIT_SCHEMA = 3;
const EXIT_IO = 4;

const ROOT_DIR = path.resolve(__dirname, "..");
const PUZZLES_DIR = path.join(ROOT_DIR, "data", "puzzles");
const OUTPUT_FILE = path.join(ROOT_DIR, "data", "puzzles.json");

/**
 * Creates a typed error with an explicit exit code.
 * @param {string} message - Error message
 * @param {number} exitCode - Process exit code
 * @returns {Error} Error instance with exitCode
 */
const createExitError = (message, exitCode) => {
  const error = new Error(message);
  error.exitCode = exitCode;
  return error;
};

/**
 * Removes simple YAML string quotes when present.
 * @param {string} raw - Raw scalar value
 * @returns {string} Unquoted scalar
 */
const unquoteYamlScalar = (raw) => {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

/**
 * Parses top-level scalar key/value pairs from a YAML document.
 * This intentionally reads only unindented scalar lines.
 * @param {string} text - YAML document contents
 * @returns {Object} Map of top-level scalar keys to values
 */
const parseTopLevelScalars = (text) => {
  const result = {};
  const lines = text.split(/\r?\n/);

  lines.forEach((line) => {
    if (!line || line === "---") {
      return;
    }
    if (/^\s/.test(line)) {
      return;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      return;
    }

    const key = match[1];
    const value = unquoteYamlScalar(match[2] || "");
    result[key] = value;
  });

  return result;
};

/**
 * Recursively discovers .yaml files under a root directory.
 * @param {string} rootDir - Directory to scan
 * @returns {string[]} Absolute YAML file paths
 */
const discoverYamlFiles = (rootDir) => {
  const stack = [rootDir];
  const files = [];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (error) {
      throw createExitError(
        `Failed to read directory ${currentDir}: ${error.message}`,
        EXIT_IO,
      );
    }

    entries.forEach((entry) => {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        return;
      }
      if (entry.isFile() && entry.name.endsWith(".yaml")) {
        files.push(fullPath);
      }
    });
  }

  return files.sort((a, b) => a.localeCompare(b));
};

/**
 * Builds one puzzle metadata index entry from a YAML file.
 * @param {string} absolutePath - Absolute path to puzzle YAML
 * @returns {Object} Metadata index entry
 */
const buildEntryFromFile = (absolutePath) => {
  let text;
  try {
    text = fs.readFileSync(absolutePath, "utf8");
  } catch (error) {
    throw createExitError(
      `Failed to read puzzle file ${absolutePath}: ${error.message}`,
      EXIT_IO,
    );
  }

  const scalars = parseTopLevelScalars(text);
  const relativeFromPuzzles = path
    .relative(PUZZLES_DIR, absolutePath)
    .replace(/\\/g, "/");
  const pathValue = `puzzles/${relativeFromPuzzles}`;
  const stem = path.basename(absolutePath, ".yaml");

  const yamlId = scalars.id || "";
  const id = yamlId || stem;
  const name = scalars.name || "";
  const levelPrimary = scalars.level || "";
  const levelFallback = scalars.difficulty || "";
  const author = scalars.author || "";
  const descriptionPrimary = scalars.description || "";
  const descriptionFallback = scalars.summary || "";

  if (levelPrimary && levelFallback && levelPrimary !== levelFallback) {
    throw createExitError(
      `Alias conflict in ${pathValue}: level and difficulty differ`,
      EXIT_SCHEMA,
    );
  }

  if (
    descriptionPrimary &&
    descriptionFallback &&
    descriptionPrimary !== descriptionFallback
  ) {
    throw createExitError(
      `Alias conflict in ${pathValue}: description and summary differ`,
      EXIT_SCHEMA,
    );
  }

  const level = levelPrimary || levelFallback;
  const description = descriptionPrimary || descriptionFallback || "";

  if (!id || !pathValue || !name || !level) {
    throw createExitError(
      `Missing required metadata in ${pathValue}: required fields are id, path, name, level`,
      EXIT_SCHEMA,
    );
  }

  return {
    id,
    path: pathValue,
    name,
    level,
    author,
    description,
  };
};

/**
 * Builds all metadata entries from puzzle YAML files.
 * @returns {Object[]} Metadata index entries
 */
const buildIndexEntries = () => {
  const yamlFiles = discoverYamlFiles(PUZZLES_DIR);

  const entries = yamlFiles.map((absolutePath) =>
    buildEntryFromFile(absolutePath),
  );

  const seenPaths = new Set();
  entries.forEach((entry) => {
    if (seenPaths.has(entry.path)) {
      throw createExitError(
        `Duplicate path in generated index: ${entry.path}`,
        EXIT_SCHEMA,
      );
    }
    seenPaths.add(entry.path);
  });

  entries.sort((a, b) => {
    if (a.id === b.id) {
      return a.path.localeCompare(b.path);
    }
    return a.id.localeCompare(b.id);
  });

  return entries;
};

/**
 * Detects global ID collisions in metadata entries.
 * @param {Object[]} entries - Metadata entries
 * @returns {Map<string, string[]>} Map of collided ids to puzzle paths
 */
const findIdCollisions = (entries) => {
  const idToPaths = new Map();

  entries.forEach((entry) => {
    if (!idToPaths.has(entry.id)) {
      idToPaths.set(entry.id, []);
    }
    idToPaths.get(entry.id).push(entry.path);
  });

  const collisions = new Map();
  idToPaths.forEach((pathsForId, id) => {
    if (pathsForId.length < 2) {
      return;
    }
    collisions.set(
      id,
      [...pathsForId].sort((a, b) => a.localeCompare(b)),
    );
  });

  return collisions;
};

/**
 * Writes entries to the canonical puzzle index file.
 * @param {Object[]} entries - Metadata entries
 */
const writeIndex = (entries) => {
  const text = `${JSON.stringify(entries, null, 2)}\n`;
  try {
    fs.writeFileSync(OUTPUT_FILE, text, "utf8");
  } catch (error) {
    throw createExitError(
      `Failed to write output file ${OUTPUT_FILE}: ${error.message}`,
      EXIT_IO,
    );
  }
};

const main = () => {
  const entries = buildIndexEntries();
  const collisions = findIdCollisions(entries);

  if (collisions.size > 0) {
    const ids = [...collisions.keys()].sort((a, b) => a.localeCompare(b));
    ids.forEach((id) => {
      const puzzlePaths = collisions.get(id);
      console.warn(
        `WARNING: ID collisions ${id} on puzzles [${puzzlePaths.join(", ")}]`,
      );
    });
    process.exit(EXIT_ID_COLLISION);
  }

  writeIndex(entries);
  const relativeOutput = path.relative(ROOT_DIR, OUTPUT_FILE).replace(/\\/g, "/");
  console.log(`Generated ${entries.length} puzzle index entries -> ${relativeOutput}`);
};

try {
  main();
} catch (error) {
  const exitCode =
    typeof error.exitCode === "number" ? error.exitCode : EXIT_GENERIC;
  console.error(error.message);
  process.exit(exitCode);
}
