/**
 * Node.js test runner for all registered JS tests.
 */

const path = require("path");
const {
  clearTestRegistry,
  runAllRegisteredTests,
  printTestResults,
} = require("./testharness.js");

clearTestRegistry();

require(path.join(__dirname, "testharness.test.js"));
require(path.join(__dirname, "../js/solver.test.js"));
require(path.join(__dirname, "../js/state.test.js"));
require(path.join(__dirname, "../js/puzzles.test.js"));
require(path.join(__dirname, "../js/app.test.js"));

(async () => {
  const summary = await runAllRegisteredTests();
  printTestResults(summary);
  process.exit(summary.totalFailed > 0 ? 1 : 0);
})();
