/**
 * Test Configuration
 * Central registry of all test files to load in both Node and browser.
 * Add new test files here and they'll automatically load everywhere.
 * Paths are relative to the tests/ folder.
 */

const TEST_FILES = [
  "testharness.test.js",
  "../js/constants.test.js",
  "../js/utils.test.js",
  "../js/solver.test.js",
  "../js/styler.test.js",
  "../js/state.test.js",
  "../js/puzzles.test.js",
  "../js/scorecard.test.js",
  "../js/render.test.js",
  "../js/theme.test.js",
  "../js/dom.test.js",
  "../js/app.test.js",
  "../js/options.test.js",
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { TEST_FILES };
}
