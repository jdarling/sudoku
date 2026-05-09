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

  test("solve returns null for unsolveable board", () => {
    const board = new Array(TOTAL_CELLS).fill(0);
    board[idx(0, 1)] = 1;
    board[idx(0, 2)] = 2;
    board[idx(0, 3)] = 3;
    board[idx(0, 4)] = 4;
    board[idx(0, 5)] = 5;
    board[idx(0, 6)] = 6;
    board[idx(0, 7)] = 7;
    board[idx(0, 8)] = 8;
    board[idx(1, 0)] = 9;
    return expect(solve(board)).toBe(null);
  });

  test("solve returns original board when already complete", () => {
    const solvedBoard =
      "534678912672195348198342567859761423426853791713924856961537284287419635345286179"
        .split("")
        .map(Number);
    const result = solve([...solvedBoard]);
    return expect(result).toEqual(solvedBoard);
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
