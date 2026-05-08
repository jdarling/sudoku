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
  let hintBoard = resolveSymbol("hintBoard");
  let getHintCells = resolveSymbol("getHintCells");
  let getWrongCells = resolveSymbol("getWrongCells");
  let encodeBoard = resolveSymbol("encodeBoard");
  let decodeBoard = resolveSymbol("decodeBoard");
  let TOTAL_CELLS = resolveSymbol("TOTAL_CELLS");

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

  test("solveBoard fills board with solution and preserves givens", () => {
    const puzzle =
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    const state = createStateFromPuzzle(puzzle);
    const next = solveBoard(state);
    const hasZero = next.board.some((cell) => cell === 0);
    return expect(
      !hasZero &&
        next.given.every((isGiven, i) => isGiven === state.given[i]) &&
        next.selected === -1 &&
        next.statusType === "win",
    ).toBeTruthy();
  });

  test("solveBoard returns fully populated board with no zeros", () => {
    const puzzle =
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    const state = createStateFromPuzzle(puzzle);
    const solved = solveBoard(state);
    const hasZero = solved.board.some((cell) => cell === 0);
    return expect(hasZero).toBeFalsy();
  });

  test("solveBoard keeps non-given cells editable after solving", () => {
    const puzzle =
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    const state = createStateFromPuzzle(puzzle);
    const solved = solveBoard(state);
    const hasEditable = solved.given.some((isGiven) => !isGiven);
    const solvedCount = solved.board.filter((cell) => cell !== 0).length;
    return expect(hasEditable && solvedCount === TOTAL_CELLS).toBeTruthy();
  });

  test("checkSolution returns win state when board matches solution", () => {
    const puzzle =
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    const state = createStateFromPuzzle(puzzle);
    const solved = solveBoard(state);
    const next = checkSolution(solved, true);
    return expect(next.statusType).toBe("win");
  });

  test("checkSolution returns unchanged state when showErrors is false", () => {
    const puzzle =
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    const state = createStateFromPuzzle(puzzle);
    const next = checkSolution(state, false);
    return expect(next).toBe(state);
  });

  test("checkSolution returns success when partial board is still solveable", () => {
    const puzzle =
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    const state = createStateFromPuzzle(puzzle);
    const next = checkSolution(state, true);
    const isCorrect =
      next.status === "All values are correct" && next.statusType === "win";
    return expect(isCorrect).toBeTruthy();
  });

  test("checkSolution returns error when current entries conflict", () => {
    const puzzle =
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    const state = createStateFromPuzzle(puzzle);
    const conflictBoard = [...state.board];
    conflictBoard[2] = 5;
    const conflictedState = {
      ...state,
      board: conflictBoard,
    };
    const next = checkSolution(conflictedState, true);
    const isError =
      next.status === "Some cells are incorrect" && next.statusType === "error";
    return expect(isError).toBeTruthy();
  });

  test("getWrongCells returns user cells that conflict by Sudoku rules", () => {
    const state = {
      board: [1, 1].concat(new Array(TOTAL_CELLS - 2).fill(0)),
      given: [true, false].concat(new Array(TOTAL_CELLS - 2).fill(false)),
    };
    const wrong = getWrongCells(state);
    return expect(wrong).toEqual([1]);
  });

  test("getHintCells flags incorrect user entry from puzzle 002 setup", () => {
    const puzzle =
      "003020600900305001001806400008102900700000008006708200002609500800203009005010300";
    const state = createStateFromPuzzle(puzzle);
    const board = decodeBoard("AGhYfhg3VLUz2jjpRZZO-BPbDOVxAyHiQN6HFEUcD7SF8");
    const next = {
      ...state,
      board,
    };
    const wrong = getHintCells(next);
    return expect(wrong.includes(70)).toBeTruthy();
  });

  test("hintBoard sets hinting true and error status on conflict", () => {
    const puzzle =
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    const state = createStateFromPuzzle(puzzle);
    const conflictBoard = [...state.board];
    conflictBoard[2] = 5;
    const conflictedState = { ...state, board: conflictBoard };
    const next = hintBoard(conflictedState);
    return expect(
      next.hinting === true && next.statusType === "error",
    ).toBeTruthy();
  });

  test("placeNumber resets hinting to false", () => {
    const puzzle =
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    const state = { ...createStateFromPuzzle(puzzle), hinting: true };
    const next = placeNumber(state, 2, 4);
    return expect(next.hinting).toBe(false);
  });

  test("encodeBoard returns 45-char compressed string", () => {
    const board = new Array(TOTAL_CELLS).fill(0);
    board[0] = 9;
    const encoded = encodeBoard(board);
    return expect(encoded.length === 45).toBeTruthy();
  });

  test("decodeBoard round-trips through encodeBoard", () => {
    const board = new Array(TOTAL_CELLS).fill(0);
    board[0] = 9;
    board[40] = 5;
    const encoded = encodeBoard(board);
    const decoded = decodeBoard(encoded);
    return expect(
      Array.isArray(decoded) && decoded[0] === 9 && decoded[40] === 5,
    ).toBeTruthy();
  });

  test("decodeBoard returns null for null or empty input", () => {
    return expect(
      decodeBoard(null) === null && decodeBoard("") === null,
    ).toBeTruthy();
  });
};

runStateTests();
