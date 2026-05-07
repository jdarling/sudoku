/**
 * Tests that validate the behavior of the test harness itself.
 */

/**
 * Creates an isolated test harness instance in Node.js.
 * @returns {Object|null} Isolated harness exports, or null outside Node.js
 */
const createIsolatedHarness = () => {
  if (typeof module === "undefined" || !module.exports) {
    return null;
  }

  const fs = require("fs");
  const path = require("path");
  const vm = require("vm");

  const harnessPath = path.join(__dirname, "testharness.js");
  const harnessCode = fs.readFileSync(harnessPath, "utf8");

  const moduleShim = { exports: {} };
  const context = {
    module: moduleShim,
    exports: moduleShim.exports,
    console: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  };

  vm.createContext(context);
  vm.runInContext(harnessCode, context, { filename: "testharness.js" });

  return moduleShim.exports;
};

/**
 * Verifies aggregate counts and message generation for pass/fail/error cases.
 * @returns {Promise<boolean|Object>} Assertion outcome
 */
const verifyOutcomeRecording = async () => {
  const isolated = createIsolatedHarness();
  if (!isolated) {
    return true;
  }

  const {
    clearTestRegistry,
    setTestFile,
    test,
    expect,
    runAllRegisteredTests,
  } = isolated;

  clearTestRegistry();
  setTestFile("isolated-outcomes.js");

  test("assert pass", () => expect(2 + 2).toBe(4));
  test("assert fail", () => expect(2 + 2).toBe(5));
  test("boolean pass", () => true);
  test("boolean fail", () => false);
  test("throws error", () => {
    throw new Error("boom");
  });

  const summary = await runAllRegisteredTests();
  const onlyFile = summary.files[0];

  const hasAssertionFailure = onlyFile.tests.some(
    (item) => !item.pass && item.message.includes("assert fail"),
  );
  const hasThrownError = onlyFile.tests.some(
    (item) => !item.pass && item.message.includes("throws error: boom"),
  );

  return (
    summary.total === 5 &&
    summary.totalPassed === 2 &&
    summary.totalFailed === 3 &&
    onlyFile.passed === 2 &&
    onlyFile.failed === 3 &&
    hasAssertionFailure &&
    hasThrownError
  );
};

/**
 * Verifies tests are grouped by file name.
 * @returns {Promise<boolean>} True when grouping is correct
 */
const verifyFileGrouping = async () => {
  const isolated = createIsolatedHarness();
  if (!isolated) {
    return true;
  }

  const { clearTestRegistry, setTestFile, test, runAllRegisteredTests } =
    isolated;

  clearTestRegistry();
  setTestFile("group-a.js");
  test("a1", () => true);
  setTestFile("group-b.js");
  test("b1", () => true);

  const summary = await runAllRegisteredTests();
  const hasGroupA = summary.files.some(
    (item) => item.fileName === "group-a.js",
  );
  const hasGroupB = summary.files.some(
    (item) => item.fileName === "group-b.js",
  );

  return summary.files.length === 2 && hasGroupA && hasGroupB;
};

/**
 * Verifies async tests are awaited and counted correctly.
 * @returns {Promise<boolean>} True when async behavior is correct
 */
const verifyAsyncHandling = async () => {
  const isolated = createIsolatedHarness();
  if (!isolated) {
    return true;
  }

  const {
    clearTestRegistry,
    setTestFile,
    test,
    expect,
    runAllRegisteredTests,
  } = isolated;

  clearTestRegistry();
  setTestFile("isolated-async.js");

  test("async assertion pass", async () => {
    return expect("ok").toBe("ok");
  });

  test("async boolean fail", async () => {
    return false;
  });

  const summary = await runAllRegisteredTests();
  return summary.totalPassed === 1 && summary.totalFailed === 1;
};

/**
 * Registers test-harness self-tests in the shared test registry.
 */
const runHarnessSelfTests = () => {
  const harnessApi =
    typeof window !== "undefined" ? window : require("./testharness.js");
  const { setTestFile, test, expect } = harnessApi;

  setTestFile("testharness.js");

  test("records pass/fail/error outcomes correctly", async () => {
    const isValid = await verifyOutcomeRecording();
    return expect(isValid).toBeTruthy();
  });

  test("groups tests by file name", async () => {
    const isValid = await verifyFileGrouping();
    return expect(isValid).toBeTruthy();
  });

  test("awaits async test functions", async () => {
    const isValid = await verifyAsyncHandling();
    return expect(isValid).toBeTruthy();
  });
};

runHarnessSelfTests();
