/**
 * dom.js tests.
 *
 * Browser-coupled DOM functions (event handlers, window.location, history) cannot
 * be tested outside a real browser without mocks. Only pure utility functions are
 * tested here.
 */

const runDomTests = () => {
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

  setTestFile("dom.js");

  let buildPuzzleQueryString = resolveSymbol("buildPuzzleQueryString");

  test("buildPuzzleQueryString returns empty string with no args", () => {
    return expect(buildPuzzleQueryString()).toBe("");
  });

  test("buildPuzzleQueryString returns puzzle query for puzzleId", () => {
    return expect(buildPuzzleQueryString({ puzzleId: "004" })).toBe(
      "?puzzle=004",
    );
  });

  test("buildPuzzleQueryString encodes special chars in puzzleId", () => {
    return expect(buildPuzzleQueryString({ puzzleId: "a b" })).toBe(
      "?puzzle=a%20b",
    );
  });

  test("buildPuzzleQueryString returns puzzleUrl query for puzzleUrl", () => {
    return expect(
      buildPuzzleQueryString({ puzzleUrl: "https://example.com/puzzle.yaml" }),
    ).toBe("?puzzleUrl=https%3A%2F%2Fexample.com%2Fpuzzle.yaml");
  });

  test("buildPuzzleQueryString prefers puzzleId over puzzleUrl when both provided", () => {
    return expect(
      buildPuzzleQueryString({
        puzzleId: "004",
        puzzleUrl: "https://example.com/puzzle.yaml",
      }),
    ).toBe("?puzzle=004");
  });

  test("buildPuzzleQueryString returns empty string when both null", () => {
    return expect(
      buildPuzzleQueryString({ puzzleId: null, puzzleUrl: null }),
    ).toBe("");
  });
};

runDomTests();
