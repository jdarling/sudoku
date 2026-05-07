/**
 * Tests for state.js pure functions.
 */

const runStateTests = () => {
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

  let createStateFromPuzzle = resolveSymbol("createStateFromPuzzle");
  let selectCell = resolveSymbol("selectCell");
  let placeNumber = resolveSymbol("placeNumber");
  let solveBoard = resolveSymbol("solveBoard");
  let checkSolution = resolveSymbol("checkSolution");
  let getWrongCells = resolveSymbol("getWrongCells");
  let encodeBoard = resolveSymbol("encodeBoard");
  let decodeBoard = resolveSymbol("decodeBoard");
  let TOTAL_CELLS = resolveSymbol("TOTAL_CELLS");

  if (typeof module !== "undefined" && module.exports) {
    const fs = require("fs");
    const vm = require("vm");
    const path = require("path");

    const context = { console, Math, Set };
    vm.createContext(context);

    const constantsCode = fs.readFileSync(
      path.join(__dirname, "constants.js"),
      "utf8",
    );
    vm.runInContext(constantsCode, context);

    const solverCode = fs.readFileSync(
      path.join(__dirname, "solver.js"),
      "utf8",
    );
    vm.runInContext(solverCode, context);

    const stateCode = fs.readFileSync(path.join(__dirname, "state.js"), "utf8");
    vm.runInContext(
      `${stateCode}\nthis.__stateExports = { createStateFromPuzzle, selectCell, placeNumber, solveBoard, checkSolution, getWrongCells, encodeBoard, decodeBoard, TOTAL_CELLS };`,
      context,
    );

    ({
      createStateFromPuzzle,
      selectCell,
      placeNumber,
      solveBoard,
      checkSolution,
      getWrongCells,
      encodeBoard,
      decodeBoard,
      TOTAL_CELLS,
    } = context.__stateExports);
  }

  setTestFile("state.js");

  test("createStateFromPuzzle builds board and given arrays", () => {
    const puzzle = "123456789".repeat(9);
    const state = createStateFromPuzzle(puzzle);
    return expect(
      state.board.length === TOTAL_CELLS && state.given[0] && state.given[80],
    ).toBeTruthy();
  });

  test("selectCell returns new state with selected index", () => {
    const state = { selected: -1 };
    const next = selectCell(state, 12);
    return expect(next.selected).toBe(12);
  });

  test("placeNumber does not mutate given cell", () => {
    const state = {
      board: [5, 0, 0],
      given: [true, false, false],
      status: "",
      statusType: "",
    };
    const next = placeNumber(state, 0, 9);
    return expect(next.board[0]).toBe(5);
  });

  test("placeNumber updates non-given cell and clears status", () => {
    const state = {
      board: [5, 0, 0],
      given: [true, false, false],
      status: "x",
      statusType: "error",
    };
    const next = placeNumber(state, 1, 7);
    return expect(
      next.board[1] === 7 && next.status === "" && next.statusType === "",
    ).toBeTruthy();
  });

  test("solveBoard fills board with solution and marks all given", () => {
    const state = {
      board: [0, 0, 0],
      solution: [1, 2, 3],
      given: [false, false, false],
      selected: 2,
      status: "",
      statusType: "",
    };
    const next = solveBoard(state);
    return expect(
      next.board[2] === 3 && next.given.every(Boolean) && next.selected === -1,
    ).toBeTruthy();
  });

  test("checkSolution returns win state when board matches solution", () => {
    const state = {
      board: [1, 2, 3],
      solution: [1, 2, 3],
      status: "",
      statusType: "",
    };
    const next = checkSolution(state, true);
    return expect(next.statusType).toBe("win");
  });

  test("checkSolution returns unchanged state when showErrors is false", () => {
    const state = {
      board: [1, 2, 0],
      solution: [1, 2, 3],
      status: "",
      statusType: "",
    };
    const next = checkSolution(state, false);
    return expect(next).toBe(state);
  });

  test("getWrongCells returns user cells that conflict by Sudoku rules", () => {
    const state = {
      board: [1, 1].concat(new Array(TOTAL_CELLS - 2).fill(0)),
      solution: new Array(TOTAL_CELLS).fill(0),
      given: [true, false].concat(new Array(TOTAL_CELLS - 2).fill(false)),
    };
    const wrong = getWrongCells(state);
    return expect(wrong).toEqual([1]);
  });

  test("encodeBoard returns 81-char digit string", () => {
    const board = new Array(TOTAL_CELLS).fill(0);
    board[0] = 9;
    const encoded = encodeBoard(board);
    return expect(
      encoded.length === TOTAL_CELLS && encoded[0] === "9",
    ).toBeTruthy();
  });

  test("decodeBoard restores given cells from original board", () => {
    const encoded = "9".repeat(TOTAL_CELLS);
    const given = new Array(TOTAL_CELLS).fill(false);
    const original = new Array(TOTAL_CELLS).fill(0);
    given[0] = true;
    original[0] = 4;
    const decoded = decodeBoard(encoded, given, original);
    return expect(decoded[0] === 4 && decoded[1] === 9).toBeTruthy();
  });

  test("decodeBoard returns null for invalid length", () => {
    const decoded = decodeBoard("123", [], []);
    return expect(decoded).toBe(null);
  });
};

runStateTests();
