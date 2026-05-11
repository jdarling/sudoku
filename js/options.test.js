/**
 * Tests for options.js pure helpers.
 */

const runOptionsTests = () => {
  const { setTestFile, test, expect } =
    typeof window !== "undefined" ? window : require("../tests/testharness.js");

  const resolveSymbol = (symbolName) => {
    if (
      typeof window !== "undefined" &&
      typeof window[symbolName] !== "undefined"
    ) {
      return window[symbolName];
    }
    if (typeof globalThis[symbolName] !== "undefined") {
      return globalThis[symbolName];
    }
    try {
      return Function(
        `return typeof ${symbolName} !== "undefined" ? ${symbolName} : undefined;`,
      )();
    } catch (_error) {
      return undefined;
    }
  };

  const createDefaultOptions = resolveSymbol("createDefaultOptions");
  const sanitizeOptions = resolveSymbol("sanitizeOptions");
  const updateOption = resolveSymbol("updateOption");
  const formatElapsedTime = resolveSymbol("formatElapsedTime");
  const createMetricsDisplay = resolveSymbol("createMetricsDisplay");

  setTestFile("options.js");

  test("createDefaultOptions enables showStatsOnSolved by default", () => {
    const options = createDefaultOptions();
    return expect(options.showStatsOnSolved).toBe(true);
  });

  test("sanitizeOptions preserves valid showStatsOnSolved boolean", () => {
    const sanitized = sanitizeOptions({ showStatsOnSolved: false });
    return expect(sanitized.showStatsOnSolved).toBe(false);
  });

  test("sanitizeOptions defaults showStatsOnSolved when invalid", () => {
    const sanitized = sanitizeOptions({ showStatsOnSolved: "nope" });
    return expect(sanitized.showStatsOnSolved).toBe(true);
  });

  test("updateOption updates one key immutably", () => {
    const source = createDefaultOptions();
    const next = updateOption(source, "showStatsOnSolved", false);
    return expect(
      source.showStatsOnSolved === true && next.showStatsOnSolved === false,
    ).toBeTruthy();
  });

  test("formatElapsedTime formats under one minute", () => {
    const result = formatElapsedTime(
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:45.000Z",
    );
    return expect(result).toBe("0 minutes 45 seconds");
  });

  test("formatElapsedTime formats exactly one minute", () => {
    const result = formatElapsedTime(
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:01:00.000Z",
    );
    return expect(result).toBe("1 minute 0 seconds");
  });

  test("formatElapsedTime formats multiple minutes", () => {
    const result = formatElapsedTime(
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:03:22.000Z",
    );
    return expect(result).toBe("3 minutes 22 seconds");
  });

  test("createMetricsDisplay returns None for empty support options", () => {
    const display = createMetricsDisplay({
      puzzleId: "123",
      startedAt: "2026-01-01T00:00:00.000Z",
      completedAt: "2026-01-01T00:00:30.000Z",
      supportOptionsUsed: [],
    });

    return expect(
      display.puzzleId === "123" &&
        display.elapsedTime === "0 minutes 30 seconds" &&
        Array.isArray(display.supportOptionsUsed) &&
        display.supportOptionsUsed.length === 1 &&
        display.supportOptionsUsed[0] === "None",
    ).toBeTruthy();
  });

  test("createMetricsDisplay preserves numeric counters", () => {
    const display = createMetricsDisplay({
      moveCount: 9,
      checkClickCount: 2,
      hintClickCount: 1,
      immediateErrorShownCount: 3,
      errorCellShownCount: 4,
      errorShownCount: 7,
      supportOptionsUsed: ["selected row"],
      startedAt: "2026-01-01T00:00:00.000Z",
      completedAt: "2026-01-01T00:00:05.000Z",
    });

    return expect(
      display.moveCount === 9 &&
        display.checkClickCount === 2 &&
        display.hintClickCount === 1 &&
        display.immediateErrorShownCount === 3 &&
        display.errorCellShownCount === 4 &&
        display.errorShownCount === 7,
    ).toBeTruthy();
  });
};

runOptionsTests();
