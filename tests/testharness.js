/**
 * Test Harness
 * Minimal test framework with expect-like API
 * Works in Node.js and browser environments
 */

/**
 * Global test registry
 * @type {Object[]}
 */
let testRegistry = [];

/**
 * Current test file being registered
 * @type {string}
 */
let currentTestFile = "";

/**
 * Sets the current test file context.
 * @param {string} fileName - Name of the test file
 */
const setTestFile = (fileName) => {
  currentTestFile = fileName;
};

/**
 * Test assertion wrapper.
 * @typedef {Object} Assertion
 */
class Assertion {
  constructor(value) {
    this.value = value;
    this.pass = false;
    this.message = "";
  }

  /**
   * Assert value equals expected.
   * @param {*} expected - Expected value
   * @returns {Assertion} This assertion (for chaining)
   */
  toBe(expected) {
    this.pass = this.value === expected;
    this.message = this.pass
      ? `✓ value equals ${JSON.stringify(expected)}`
      : `✗ expected ${JSON.stringify(expected)}, got ${JSON.stringify(this.value)}`;
    return this;
  }

  /**
   * Assert value deeply equals expected.
   * @param {*} expected - Expected value
   * @returns {Assertion} This assertion
   */
  toEqual(expected) {
    this.pass = JSON.stringify(this.value) === JSON.stringify(expected);
    this.message = this.pass
      ? `✓ value equals ${JSON.stringify(expected)}`
      : `✗ expected ${JSON.stringify(expected)}, got ${JSON.stringify(this.value)}`;
    return this;
  }

  /**
   * Assert value is truthy.
   * @returns {Assertion} This assertion
   */
  toBeTruthy() {
    this.pass = !!this.value;
    this.message = this.pass
      ? `✓ value is truthy`
      : `✗ expected truthy, got ${JSON.stringify(this.value)}`;
    return this;
  }

  /**
   * Assert value is falsy.
   * @returns {Assertion} This assertion
   */
  toBeFalsy() {
    this.pass = !this.value;
    this.message = this.pass
      ? `✓ value is falsy`
      : `✗ expected falsy, got ${JSON.stringify(this.value)}`;
    return this;
  }

  /**
   * Assert value includes expected (for arrays, strings).
   * @param {*} expected - Expected value to include
   * @returns {Assertion} This assertion
   */
  toInclude(expected) {
    if (typeof this.value === "string") {
      this.pass = this.value.includes(String(expected));
    } else {
      const hasIncludes = typeof this.value === "object" && this.value !== null;
      this.pass =
        hasIncludes &&
        (Array.isArray(this.value)
          ? this.value.includes(expected)
          : this.value.has
            ? this.value.has(expected)
            : false);
    }
    this.message = this.pass
      ? `✓ value includes ${JSON.stringify(expected)}`
      : `✗ expected to include ${JSON.stringify(expected)}`;
    return this;
  }

  /**
   * Assert value has a property.
   * @param {string} prop - Property name
   * @returns {Assertion} This assertion
   */
  toHaveProperty(prop) {
    this.pass = this.value && prop in this.value;
    this.message = this.pass
      ? `✓ value has property ${prop}`
      : `✗ expected to have property ${prop}`;
    return this;
  }
}

/**
 * Creates an assertion object for a value.
 * @param {*} value - Value to test
 * @returns {Assertion} Assertion object
 */
const expect = (value) => {
  return new Assertion(value);
};

/**
 * Registers a single test case.
 * @param {string} description - Test description
 * @param {Function} fn - Test function that returns Assertion or boolean
 */
const test = (description, fn) => {
  if (!currentTestFile) {
    console.warn("test() called without setTestFile() - ignoring test");
    return;
  }

  let fileEntry = testRegistry.find((f) => f.fileName === currentTestFile);
  if (!fileEntry) {
    fileEntry = {
      fileName: currentTestFile,
      tests: [],
    };
    testRegistry.push(fileEntry);
  }

  fileEntry.tests.push({
    description,
    fn,
    pass: null,
    message: "",
  });
};

/**
 * Gets all registered tests.
 * @returns {Object[]} Array of test files with tests
 */
const getTestRegistry = () => {
  return testRegistry;
};

/**
 * Clears test registry (useful for testing).
 */
const clearTestRegistry = () => {
  testRegistry = [];
  currentTestFile = "";
};

/**
 * Runs all registered tests and computes summary.
 * @returns {Object} Summary with all test files and totals
 */
const runAllRegisteredTests = async () => {
  const allFiles = [];
  let totalPassed = 0;
  let totalFailed = 0;

  for (const file of testRegistry) {
    const results = [];

    for (const registeredTest of file.tests) {
      try {
        const outcome = registeredTest.fn();
        const result =
          outcome && typeof outcome.then === "function"
            ? await outcome
            : outcome;

        if (result instanceof Assertion) {
          results.push({
            pass: result.pass,
            message: `${registeredTest.description}: ${result.message}`,
          });
          continue;
        }

        if (typeof result === "boolean") {
          results.push({
            pass: result,
            message: `${result ? "✓" : "✗"} ${registeredTest.description}`,
          });
          continue;
        }

        results.push({
          pass: false,
          message: `✗ ${registeredTest.description}: test did not return Assertion or boolean`,
        });
      } catch (error) {
        results.push({
          pass: false,
          message: `✗ ${registeredTest.description}: ${error.message}`,
        });
      }
    }

    const passed = results.filter((t) => t.pass).length;
    const failed = results.filter((t) => !t.pass).length;

    allFiles.push({
      fileName: file.fileName,
      tests: results,
      passed,
      failed,
      total: results.length,
    });

    totalPassed += passed;
    totalFailed += failed;
  }

  return {
    files: allFiles,
    totalPassed,
    totalFailed,
    total: totalPassed + totalFailed,
  };
};

/**
 * Prints test results to console (Node.js).
 * @param {Object} summary - Test summary
 */
const printTestResults = (summary) => {
  summary.files.forEach((file) => {
    console.log(`\n${file.fileName}`);
    console.log("=".repeat(40));
    file.tests.forEach((test) => {
      console.log(test.message);
    });
    console.log(`${file.passed}/${file.total} passed`);
  });

  console.log("\n" + "=".repeat(40));
  console.log(`${summary.totalPassed}/${summary.total} tests passed`);
  if (summary.totalFailed > 0) {
    console.log(`${summary.totalFailed} failed`);
  }
  console.log("=".repeat(40) + "\n");
};

// Make functions available globally in browser
if (typeof window !== "undefined") {
  window.expect = expect;
  window.test = test;
  window.setTestFile = setTestFile;
  window.getTestRegistry = getTestRegistry;
  window.clearTestRegistry = clearTestRegistry;
  window.runAllRegisteredTests = runAllRegisteredTests;
  window.printTestResults = printTestResults;
}

// Export for Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    expect,
    test,
    setTestFile,
    getTestRegistry,
    clearTestRegistry,
    runAllRegisteredTests,
    printTestResults,
  };
}
