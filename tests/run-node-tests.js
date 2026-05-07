/**
 * Node.js test runner for all registered JS tests.
 * Loads test files from testConfig.js for consistency with browser runner.
 */

const path = require("path");
const { TEST_FILES } = require("./testConfig.js");
const {
  clearTestRegistry,
  runAllRegisteredTests,
  printTestResults,
} = require("./testharness.js");

clearTestRegistry();

TEST_FILES.forEach((testFile) => {
  require(path.join(__dirname, testFile));
});

(async () => {
  const summary = await runAllRegisteredTests();
  printTestResults(summary);
  process.exit(summary.totalFailed > 0 ? 1 : 0);
})();
