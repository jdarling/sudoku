/**
 * Node.js test runner for all registered JS tests.
 * Loads test files from testConfig.js for consistency with browser runner.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { TEST_FILES } = require("./testConfig.js");
const {
  clearTestRegistry,
  runAllRegisteredTests,
  printTestResults,
} = require("./testharness.js");

/**
 * Loads a browser-style script in Node and exposes selected symbols on globalThis.
 * Keeps all vm/fs usage in the runner, not in test files.
 * @param {string} scriptPath - Absolute path to script
 * @param {string[]} exportNames - Symbols to copy to globalThis
 */
const loadScript = (scriptPath, exportNames) => {
  const source = fs.readFileSync(scriptPath, "utf8");
  const expose = exportNames
    .map((name) => `globalThis.${name} = ${name};`)
    .join("\n");
  vm.runInThisContext(`${source}\n${expose}`, {
    filename: scriptPath,
  });
};

// Match browser runner: load app scripts before test files.
globalThis.jsyaml = {
  // Tests provide JSON payloads, so JSON.parse is sufficient here.
  load: (text) => JSON.parse(text),
};

loadScript(path.join(__dirname, "../js/constants.js"), [
  "GRID_SIZE",
  "TOTAL_CELLS",
  "BOX_SIZE",
  "VERSION",
  "STATUS_MESSAGES",
  "ENCODING_CHARS",
  "ARROW_MOVES",
  "AVAILABLE_THEMES",
  "DEFAULT_THEME",
]);
loadScript(path.join(__dirname, "../js/utils.js"), [
  "formatString",
  "extractPuzzleId",
  "normalizePuzzleId",
  "formatPuzzleStatus",
]);
loadScript(path.join(__dirname, "../js/solver.js"), [
  "idx",
  "isValid",
  "solve",
  "getRelated",
]);
loadScript(path.join(__dirname, "../js/state.js"), [
  "createStateFromPuzzle",
  "selectCell",
  "placeNumber",
  "solveBoard",
  "hasBoardConflicts",
  "checkSolution",
  "hintBoard",
  "getHintCells",
  "getWrongCells",
  "encodeBoard",
  "decodeBoard",
  "clearCellValue",
  "applyNumber",
  "moveSelection",
]);
loadScript(path.join(__dirname, "../js/puzzles.js"), [
  "parsePuzzleDoc",
  "getPuzzles",
  "getPuzzle",
  "getRandomPuzzle",
]);
loadScript(path.join(__dirname, "../js/dom.js"), [
  "configureDomEventHandlers",
  "onCellFocus",
  "onCellKeydown",
  "onCellInput",
  "onNumberButtonClick",
  "onNewGameClick",
  "onLoadGameClick",
  "onCheckButtonClick",
  "onHintButtonClick",
  "onSolveButtonClick",
  "onThemeChange",
  "onPopState",
  "onHashChange",
]);

clearTestRegistry();

TEST_FILES.forEach((testFile) => {
  require(path.join(__dirname, testFile));
});

(async () => {
  const summary = await runAllRegisteredTests();
  printTestResults(summary);
  process.exit(summary.totalFailed > 0 ? 1 : 0);
})();
