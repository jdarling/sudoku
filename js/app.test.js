/**
 * Tests for app.js non-DOM helper/orchestration functions.
 * Note: Only runs in Node.js due to complex DOM mocking requirements.
 */

const runAppTests = () => {
  if (typeof window !== "undefined") {
    return;
  }

  const fs = require("fs");
  const vm = require("vm");
  const path = require("path");
  const { setTestFile, test, expect } = require("../tests/testharness.js");

  const context = {
    console,
    Math,
    Set,
    URLSearchParams,
    window: {
      location: {
        pathname: "/index.html",
        search: "",
        hash: "",
      },
      history: {
        replaceState: () => {},
      },
      addEventListener: () => {},
    },
    document: {
      getElementById: () => ({ addEventListener: () => {} }),
      querySelectorAll: () => ({ forEach: () => {} }),
    },
    renderGrid: () => {},
    markWrongCells: () => {},
    setStatus: () => {},
    focusCell: () => {},
    onCellFocus: () => {},
    onCellKeydown: () => {},
    onCellInput: () => {},
    encodeBoard: (board) => board.join(""),
    decodeBoard: () => null,
    placeNumber: (state, idx, num) => {
      const next = { ...state, board: [...state.board] };
      next.board[idx] = num;
      return next;
    },
    checkSolution: (state) => state,
    selectCell: (state, selected) => ({ ...state, selected }),
    getPuzzle: async () => ({
      filename: "puzzles/001.yaml",
      puzzle: "0".repeat(81),
    }),
    getRandomPuzzle: async () => ({
      filename: "puzzles/001.yaml",
      puzzle: "0".repeat(81),
    }),
    createStateFromPuzzle: () => ({
      puzzle: new Array(81).fill(0),
      board: new Array(81).fill(0),
      given: new Array(81).fill(false),
      selected: -1,
      status: "",
      statusType: "",
    }),
    solveBoard: (state) => state,
    TOTAL_CELLS: 81,
    ARROW_MOVES: {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: 9,
      ArrowUp: -9,
    },
  };
  vm.createContext(context);

  const appCode = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");
  const sanitizedAppCode = appCode.replace(
    /\ninit\(\)\.catch\([\s\S]*?\);\s*$/,
    "\n",
  );
  vm.runInContext(
    `${sanitizedAppCode}\nthis.__appExports = { updateHash, handleNumberKey, handleDeleteKey, handleArrowKey, getPuzzleFromQuery, getBoardFromHash, updateQuery, loadPuzzleByFilename, __setCurrentState: (state) => { currentState = state; }, __getCurrentState: () => currentState };`,
    context,
  );

  const {
    updateHash,
    handleNumberKey,
    handleDeleteKey,
    handleArrowKey,
    getPuzzleFromQuery,
    getBoardFromHash,
    updateQuery,
    loadPuzzleByFilename,
    __setCurrentState,
    __getCurrentState,
  } = context.__appExports;

  setTestFile("app.js");

  test("getPuzzleFromQuery returns null without puzzle param", () => {
    context.window.location.search = "";
    return expect(getPuzzleFromQuery()).toBe(null);
  });

  test("getPuzzleFromQuery normalizes short puzzle id", () => {
    context.window.location.search = "?puzzle=001";
    return expect(getPuzzleFromQuery()).toBe("puzzles/001.yaml");
  });

  test("getPuzzleFromQuery appends yaml extension for slash paths", () => {
    context.window.location.search = "?puzzle=user/001";
    return expect(getPuzzleFromQuery()).toBe("user/001.yaml");
  });

  test("getBoardFromHash returns null when board missing", () => {
    context.window.location.hash = "#foo=bar";
    return expect(getBoardFromHash()).toBe(null);
  });

  test("getBoardFromHash returns 81-char board value", () => {
    const board = "1".repeat(81);
    context.window.location.hash = `#board=${board}`;
    return expect(getBoardFromHash()).toBe(board);
  });

  test("updateQuery preserves existing hash", () => {
    let replacedUrl = "";
    context.window.location.search = "?a=1";
    context.window.location.hash = "#board=123";
    context.window.history.replaceState = (_a, _b, url) => {
      replacedUrl = url;
    };
    updateQuery("puzzles/005.yaml");
    return expect(replacedUrl).toInclude("#board=123");
  });

  test("updateHash writes encoded board to hash", () => {
    __setCurrentState({ board: [1, 2, 3] });
    context.window.location.hash = "";
    updateHash();
    return expect(context.window.location.hash).toBe("board=123");
  });

  test("handleArrowKey returns null when out of bounds", () => {
    __setCurrentState({ selected: 0 });
    return expect(handleArrowKey(-1)).toBe(null);
  });

  test("handleArrowKey selects valid next cell", () => {
    __setCurrentState({ selected: 5 });
    const next = handleArrowKey(1);
    return expect(next.selected).toBe(6);
  });

  test("handleDeleteKey clears selected cell", () => {
    __setCurrentState({
      selected: 2,
      board: [1, 2, 3],
      given: [false, false, false],
    });
    const next = handleDeleteKey();
    return expect(next.board[2]).toBe(0);
  });

  test("handleNumberKey checks solution when board becomes full", () => {
    let checkCalled = false;
    context.placeNumber = () => ({
      board: [1, 2, 3],
      given: [false, false, false],
    });
    context.checkSolution = (state) => {
      checkCalled = true;
      return state;
    };
    __setCurrentState({
      selected: 1,
      board: [1, 0, 3],
      given: [false, false, false],
    });
    handleNumberKey(2);
    return expect(checkCalled).toBeTruthy();
  });

  test("loadPuzzleByFilename passes original puzzle to decodeBoard", async () => {
    let thirdArg;
    context.getPuzzle = async () => ({
      filename: "puzzles/001.yaml",
      puzzle: "0".repeat(81),
    });
    context.createStateFromPuzzle = () => ({
      puzzle: [4].concat(new Array(80).fill(0)),
      board: new Array(81).fill(0),
      given: [true].concat(new Array(80).fill(false)),
      selected: -1,
      status: "",
      statusType: "",
    });
    context.window.location.hash = `#board=${"9".repeat(81)}`;
    context.decodeBoard = (_encoded, _given, original) => {
      thirdArg = original;
      return new Array(81).fill(0);
    };

    await loadPuzzleByFilename("puzzles/001.yaml");

    return expect(Array.isArray(thirdArg) && thirdArg[0] === 4).toBeTruthy();
  });

  test("loadPuzzleByFilename applies decoded board when available", async () => {
    context.getPuzzle = async () => ({
      filename: "puzzles/001.yaml",
      puzzle: "0".repeat(81),
    });
    context.createStateFromPuzzle = () => ({
      puzzle: new Array(81).fill(0),
      board: new Array(81).fill(0),
      given: new Array(81).fill(false),
      selected: -1,
      status: "",
      statusType: "",
    });
    context.window.location.hash = `#board=${"8".repeat(81)}`;
    context.decodeBoard = () => {
      const board = new Array(81).fill(0);
      board[1] = 7;
      return board;
    };

    await loadPuzzleByFilename("puzzles/001.yaml");
    const state = __getCurrentState();

    return expect(state.board[1]).toBe(7);
  });
};

runAppTests();
