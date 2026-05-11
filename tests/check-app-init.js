/**
 * App Initialization Checker
 * Tests if app.js can initialize without errors.
 * Captures all console errors and logs to stderr for debugging.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

/**
 * Loads a script into global context and exposes named exports.
 * @param {string} scriptPath - Absolute path to script
 * @param {string[]} exportNames - Names to expose globally
 */
const loadScript = (scriptPath, exportNames) => {
  const code = fs.readFileSync(scriptPath, "utf-8");
  const script = new vm.Script(code, {
    filename: scriptPath,
  });
  script.runInThisContext();
};

// Capture console output
const capturedLogs = [];
const capturedErrors = [];

const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => {
  capturedLogs.push(args.join(" "));
  originalLog(...args);
};

console.error = (...args) => {
  capturedErrors.push(args.join(" "));
  originalError(...args);
};

console.warn = (...args) => {
  capturedErrors.push(args.join(" "));
  originalWarn(...args);
};

// Set up minimal DOM
const mockElement = {
  addEventListener: () => {},
  value: "",
  textContent: "",
  className: "",
  appendChild: () => {},
  removeChild: () => {},
  remove: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
  innerHTML: "",
  style: {},
  dataset: {},
  rel: "",
  href: "",
  setAttribute: () => {},
  type: "div",
};

globalThis.document = {
  getElementById: () => ({ ...mockElement }),
  querySelector: () => ({ ...mockElement }),
  querySelectorAll: () => [],
  createElement: () => ({ ...mockElement }),
  activeElement: null,
  head: { appendChild: () => {} },
};

globalThis.window = {
  innerWidth: 1024,
  innerHeight: 768,
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
  location: {
    hash: "",
    search: "",
    href: "http://localhost/",
  },
  addEventListener: () => {},
  dispatchEvent: () => {},
  scrollTo: () => {},
};

globalThis.localStorage = globalThis.window.localStorage;

// js-yaml mock
globalThis.jsyaml = {
  load: (text) => JSON.parse(text),
};

// Load app scripts in order
try {
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
  ]);

  loadScript(path.join(__dirname, "../js/render.js"), [
    "createCell",
    "createRow",
    "renderGrid",
    "focusCell",
    "setStatus",
    "createConfettiPiece",
    "launchWinCelebration",
    "renderVersion",
    "getConfettiLayer",
    "getWinConfettiPieceCount",
  ]);

  loadScript(path.join(__dirname, "../js/theme.js"), [
    "getActiveTheme",
    "getSavedTheme",
    "applyTheme",
    "initTheme",
    "saveTheme",
  ]);

  loadScript(path.join(__dirname, "../js/settings.js"), [
    "loadSettings",
    "saveSettings",
    "createSettingsObj",
    "updateSetting",
  ]);

  loadScript(path.join(__dirname, "../js/options.js"), [
    "loadOptions",
    "saveOptions",
    "createOptionsObj",
    "updateOption",
    "normalizeHighlightFeatures",
  ]);

  loadScript(path.join(__dirname, "../js/scorecard.js"), [
    "mutateScorecard",
    "combineHighlightFeatures",
    "createPuzzleHash",
    "createInitialScorecard",
    "recordSupportChecksChange",
    "recordMove",
    "recordCheckClick",
    "recordHintClick",
    "recordErrorShown",
    "finalizeScorecard",
  ]);

  loadScript(path.join(__dirname, "../js/dom.js"), [
    "setAppQuery",
    "updateQuery",
    "updateHash",
    "clearBoardHash",
    "getBoardFromHash",
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

  loadScript(path.join(__dirname, "../js/components/modal.js"), [
    "openModal",
    "closeModal",
    "isModalOpen",
  ]);

  loadScript(path.join(__dirname, "../js/components/confirmmodal.js"), [
    "initConfirmModal",
    "openConfirmModal",
    "closeConfirmModal",
    "onConfirmYesClick",
    "onConfirmNoClick",
    "onConfirmModalKeydown",
  ]);

  loadScript(path.join(__dirname, "../js/components/decisionmodal.js"), [
    "initDecisionModal",
    "openDecisionModal",
    "closeDecisionModal",
    "onDecisionButtonClick",
    "onDecisionModalKeydown",
  ]);

  loadScript(path.join(__dirname, "../js/components/loadmodal.js"), [
    "initLoadModal",
    "openLoadModal",
    "closeLoadModal",
    "renderLoadModal",
    "onLoadModalFilterInput",
    "onLoadModalTableClick",
    "onLoadModalTableDblClick",
    "onLoadModalCancelClick",
    "onLoadModalSelectClick",
    "onLoadModalKeydown",
  ]);

  loadScript(path.join(__dirname, "../js/components/urlloadmodal.js"), [
    "initUrlLoadModal",
    "openUrlLoadModal",
    "closeUrlLoadModal",
    "onUrlLoadInput",
    "onUrlLoadConfirmClick",
    "onUrlLoadCancelClick",
    "onUrlLoadModalKeydown",
  ]);

  loadScript(path.join(__dirname, "../js/components/boardentrymodal.js"), [
    "initBoardEntryModal",
    "openBoardEntryModal",
    "closeBoardEntryModal",
    "onBoardEntryInput",
    "onBoardEntryConfirmClick",
    "onBoardEntryCancelClick",
    "onBoardEntryModalKeydown",
  ]);

  loadScript(path.join(__dirname, "../js/components/newgamedecisionmodal.js"), [
    "initNewGameDecisionModal",
    "openNewGameDecisionModal",
  ]);

  loadScript(path.join(__dirname, "../js/components/optionsmodal.js"), [
    "initOptionsModal",
    "openOptionsModal",
    "closeOptionsModal",
    "renderPresetButtons",
    "getPresetKeys",
    "syncFeatureCheckboxes",
    "onOptionsClick",
    "onOptionsThemeChange",
    "onOptionsHighlightFeatureChange",
    "applyPreset",
    "onOptionsPresetButtonClick",
    "onOptionsCloseClick",
    "onOptionsModalKeydown",
  ]);

  loadScript(path.join(__dirname, "../js/app.js"), ["init"]);

  // Try to call init()
  if (typeof init === "function") {
    console.log("✓ App scripts loaded successfully");
    console.log("Attempting to initialize app...");

    // Wrap init in try-catch to capture any async errors
    try {
      const result = init();
      if (result && typeof result.then === "function") {
        result
          .then(() => {
            console.log("✓ App initialized successfully");
            process.exit(capturedErrors.length > 0 ? 1 : 0);
          })
          .catch((err) => {
            console.error("✗ App initialization failed:", err.message);
            console.error(err.stack);
            process.exit(1);
          });
      } else {
        console.log("✓ App initialized successfully");
        process.exit(capturedErrors.length > 0 ? 1 : 0);
      }
    } catch (err) {
      console.error("✗ App initialization failed:", err.message);
      console.error(err.stack);
      process.exit(1);
    }
  } else {
    console.error("✗ init function not found after loading app.js");
    process.exit(1);
  }
} catch (err) {
  console.error("✗ Failed to load scripts:", err.message);
  console.error(err.stack);
  process.exit(1);
}
