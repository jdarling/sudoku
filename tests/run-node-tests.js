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
 * Parses CLI flags for test output reporting modes.
 * @param {string[]} argv - Process args excluding node/script
 * @returns {{reportOnlyFailures: boolean, reportStatus: boolean, showHelp: boolean}}
 */
const parseRunnerArgs = (argv) => {
  const argSet = new Set(argv);
  return {
    reportOnlyFailures: argSet.has("--report-only-failures"),
    reportStatus: argSet.has("--report-status"),
    showHelp: argSet.has("--help") || argSet.has("-h"),
  };
};

/**
 * Prints usage text for runner flags.
 */
const printUsage = () => {
  console.log("Usage: node tests/run-node-tests.js [options]");
  console.log("");
  console.log("Options:");
  console.log(
    "  --report-only-failures  Print only failed test messages and summary",
  );
  console.log(
    "  --report-status         Print one-line PASS/FAIL status summary",
  );
  console.log("  -h, --help              Show this help text");
};

/**
 * Prints only failed test cases and per-file fail counts.
 * @param {Object} summary - Test summary
 */
const printFailureOnlyResults = (summary) => {
  summary.files.forEach((file) => {
    const failedTests = file.tests.filter((test) => !test.pass);
    if (failedTests.length === 0) {
      return;
    }

    console.log(`\n${file.fileName}`);
    console.log("=".repeat(40));
    failedTests.forEach((test) => {
      console.log(test.message);
    });
    console.log(`${file.failed}/${file.total} failed`);
  });

  console.log("\n" + "=".repeat(40));
  if (summary.totalFailed === 0) {
    console.log(
      `No failures. ${summary.totalPassed}/${summary.total} tests passed`,
    );
  } else {
    console.log(`${summary.totalFailed}/${summary.total} tests failed`);
    console.log(`${summary.totalPassed}/${summary.total} tests passed`);
  }
  console.log("=".repeat(40) + "\n");
};

/**
 * Prints one-line status summary for CI-style consumption.
 * @param {Object} summary - Test summary
 */
const printStatusLine = (summary) => {
  const status = summary.totalFailed > 0 ? "FAIL" : "PASS";
  console.log(
    `STATUS: ${status} (${summary.totalPassed}/${summary.total} passed, ${summary.totalFailed} failed)`,
  );
};

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
  "STYLE_CONFIGS",
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
loadScript(path.join(__dirname, "../js/styler.js"), [
  "getCellsWithSameNumber",
  "styleCell",
  "styleRow",
  "styleCol",
  "styleBlock",
  "styleSameValueRows",
  "styleSameValueCols",
  "styleSameValueBlocks",
  "styleSameValueCells",
  "styleSelectedRow",
  "styleSelectedCol",
  "styleSelectedBlock",
  "styleSelectedCell",
  "styleGivenCells",
  "buildStyles",
]);
loadScript(path.join(__dirname, "../js/state.js"), [
  "createStateFromPuzzle",
  "createStateFromBoard",
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
  "applyDecodedBoard",
  "clearCellValue",
  "applyNumber",
  "moveSelection",
  "isInBox",
  "getCellHighlightClass",
]);
loadScript(path.join(__dirname, "../js/puzzles.js"), [
  "parsePuzzleDoc",
  "getPuzzleIndex",
  "getPuzzles",
  "getPuzzle",
  "getRandomPuzzle",
  "sanitizePuzzleToken",
  "findPuzzleMatches",
  "buildPuzzleSearchText",
  "validatePuzzleUrl",
  "validatePuzzleDoc",
  "parseBoardInput",
  "validateBoardInput",
]);
loadScript(path.join(__dirname, "../js/dom.js"), [
  "buildPuzzleQueryString",
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
  "onPopState",
  "onHashChange",
]);

clearTestRegistry();

TEST_FILES.forEach((testFile) => {
  require(path.join(__dirname, testFile));
});

(async () => {
  const args = parseRunnerArgs(process.argv.slice(2));
  if (args.showHelp) {
    printUsage();
    process.exit(0);
  }

  const summary = await runAllRegisteredTests();
  if (args.reportOnlyFailures) {
    printFailureOnlyResults(summary);
  } else {
    printTestResults(summary);
  }

  if (args.reportStatus) {
    printStatusLine(summary);
  }

  process.exit(summary.totalFailed > 0 ? 1 : 0);
})();
