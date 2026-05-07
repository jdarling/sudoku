# Tests Guide

This folder contains the project test harness, test runners, and harness self-tests.

Goal: keep tests simple, deterministic, and runnable in both Node.js and the browser loader.

## What lives here

- testharness.js
  - Minimal testing API.
  - Provides expect, test, setTestFile, clearTestRegistry, runAllRegisteredTests, printTestResults.

- run-node-tests.js
  - Node runner that loads all test files and exits with non-zero status when any test fails.

- index.html
  - Browser runner UI that loads test files in order and renders pass/fail results.

- testharness.test.js
  - Internal self-tests for the harness itself.
  - Verifies pass/fail/error accounting, file grouping, and async handling.

## How to run tests

Node:

```bash
node tests/run-node-tests.js
```

Browser:

1. Run the app server as usual.
2. Open /tests/index.html in the browser.
3. Expand sections to inspect individual test results.

## Harness API contract

Use these APIs from testharness.js:

- setTestFile(fileName)
  - Required before registering tests.
  - All following test calls are grouped under this file name.

- test(description, fn)
  - Registers one test case.
  - fn may return:
    - an Assertion object from expect(...)
    - a boolean
    - a Promise resolving to either of the above

- expect(value)
  - Assertions currently supported:
    - toBe
    - toEqual
    - toBeTruthy
    - toBeFalsy
    - toInclude
    - toHaveProperty

- runAllRegisteredTests()
  - Executes registered tests and returns summary:
    - files[] with per-file test messages and counts
    - totalPassed, totalFailed, total

## Expected test-file structure

All test files should use this pattern so they work in both environments:

```js
const runMyModuleTests = () => {
  const { setTestFile, test, expect } =
    typeof window !== "undefined" ? window : require("../tests/testharness.js");

  // Resolve symbols for browser (global/lexical) and Node (vm or require path)
  // Then register tests
  setTestFile("my-module.js");

  test("example", () => {
    return expect(true).toBeTruthy();
  });
};

runMyModuleTests();
```

## Adding a new test file

1. Create a new file named moduleName.test.js in the owning folder (usually js/).
2. Register tests with setTestFile at the top of the run function.
3. Add the file path to testConfig.js in the TEST_FILES array (relative to tests/ folder).
   - Both Node and browser runners automatically load from this single list.
4. Run Node tests to verify: `node tests/run-node-tests.js`
5. Verify browser results by opening tests/index.html

Note:

- app.test.js intentionally skips browser execution because it relies on Node-only mocking setup.

## Writing good tests for this codebase

- Prefer pure-function tests for state.js, solver.js, and puzzles.js.
- Keep handlers and orchestration tests focused on behavior and side effects at module boundaries.
- Use fixed inputs and explicit expected outputs.
- Avoid random data unless randomness is mocked.
- Keep each test description specific and behavior-focused.

## Harness self-tests

testharness.test.js should remain in the suite at all times. It is the guardrail that ensures:

- failures are counted as failures
- passes are counted as passes
- thrown errors are reported and counted
- async tests are awaited
- file grouping is correct

If this file fails, treat it as a framework-level failure and fix it before trusting other test results.

## Troubleshooting

Symptom: function is not a function in browser tests

- Cause: source symbol not attached to window in classic scripts.
- Fix: resolve symbols defensively in test files (window, globalThis, then lexical fallback).

Symptom: test does not appear in output

- Cause: setTestFile was not called before test registration.
- Fix: call setTestFile once before defining tests in that file.

Symptom: browser and Node counts differ

- Check runner file lists for parity.
- Confirm whether the test file intentionally skips one environment.

## Maintenance checklist for AI contributors

- Read this file before adding or refactoring tests.
- Preserve the dual-environment pattern unless there is a strong reason not to.
- Keep harness self-tests enabled.
- Update both runners when adding/removing test files.
- Run node tests before finishing changes.
