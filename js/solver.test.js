/**
 * Tests for solver.js
 */

const runSolverTests = () => {
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

  let idx = resolveSymbol("idx");
  let isValid = resolveSymbol("isValid");
  let solve = resolveSymbol("solve");
  let getRelated = resolveSymbol("getRelated");
  let TOTAL_CELLS = resolveSymbol("TOTAL_CELLS");

  setTestFile("solver.js");

  test("idx(0, 0) equals 0", () => expect(idx(0, 0)).toBe(0));
  test("idx(0, 8) equals 8", () => expect(idx(0, 8)).toBe(8));
  test("idx(1, 0) equals 9", () => expect(idx(1, 0)).toBe(9));
  test("idx(4, 4) equals 40", () => expect(idx(4, 4)).toBe(40));
  test("idx(8, 8) equals 80", () => expect(idx(8, 8)).toBe(80));

  test("isValid allows number on empty board", () => {
    const board = new Array(TOTAL_CELLS).fill(0);
    return expect(isValid(board, 0, 1)).toBeTruthy();
  });

  test("isValid rejects duplicate row number", () => {
    const board = new Array(TOTAL_CELLS).fill(0);
    board[0] = 5;
    return expect(isValid(board, 4, 5)).toBeFalsy();
  });

  test("isValid rejects duplicate column number", () => {
    const board = new Array(TOTAL_CELLS).fill(0);
    board[0] = 7;
    return expect(isValid(board, 9, 7)).toBeFalsy();
  });

  test("isValid rejects duplicate box number", () => {
    const board = new Array(TOTAL_CELLS).fill(0);
    board[idx(0, 0)] = 3;
    return expect(isValid(board, idx(1, 1), 3)).toBeFalsy();
  });

  test("solve returns true for solvable board", () => {
    const board = new Array(TOTAL_CELLS).fill(0);
    board[idx(0, 0)] = 1;
    board[idx(0, 1)] = 2;
    board[idx(0, 2)] = 3;
    board[idx(1, 0)] = 4;
    board[idx(1, 1)] = 5;
    board[idx(1, 2)] = 6;
    board[idx(2, 0)] = 7;
    board[idx(2, 1)] = 8;
    return expect(solve(board)).toBeTruthy();
  });

  test("getRelated includes row, col and box peers", () => {
    const related = getRelated(0);
    return expect(
      related.has(1) && related.has(9) && related.has(10),
    ).toBeTruthy();
  });

  test("getRelated size includes self and peers", () => {
    const related = getRelated(0);
    return expect(related.size).toBe(21);
  });
};

runSolverTests();
