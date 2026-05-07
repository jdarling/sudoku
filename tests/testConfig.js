/**
 * Test Configuration
 * Central registry of all test files to load in both Node and browser.
 * Add new test files here and they'll automatically load everywhere.
 * Paths are relative to the tests/ folder.
 */

const TEST_FILES = [
  "testharness.test.js",
  "../js/solver.test.js",
  "../js/state.test.js",
  "../js/puzzles.test.js",
  "../js/app.test.js",
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { TEST_FILES };
}
