/**
 * Tests for dom.js handler logic.
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

  let configureDomEventHandlers = resolveSymbol("configureDomEventHandlers");
  let onCellFocus = resolveSymbol("onCellFocus");
  let onNumberButtonClick = resolveSymbol("onNumberButtonClick");
  let onLoadGameClick = resolveSymbol("onLoadGameClick");
  let onHashChange = resolveSymbol("onHashChange");
  let createStateFromPuzzle = resolveSymbol("createStateFromPuzzle");
  let encodeBoard = resolveSymbol("encodeBoard");

  const installDeps = (deps) => {
    configureDomEventHandlers({
      getState: deps.getState || (() => null),
      applyState: deps.applyState || (() => {}),
      setStatus: deps.setStatus || (() => {}),
      applyTheme: deps.applyTheme || (() => {}),
      loadRandomPuzzle: deps.loadRandomPuzzle || (() => {}),
      loadPuzzleByFilename: deps.loadPuzzleByFilename || (() => {}),
      loadNewGame: deps.loadNewGame || (() => {}),
      applyBoardStateFromHash: deps.applyBoardStateFromHash || (() => {}),
    });
  };

  setTestFile("dom.js");

  test("onCellFocus selects focused cell", () => {
    const state = createStateFromPuzzle("0".repeat(81));
    let selected = -1;
    installDeps({
      getState: () => state,
      applyState: (next) => {
        selected = next.selected;
      },
    });

    onCellFocus({ currentTarget: { dataset: { cellIndex: "7" } } });
    return expect(selected).toBe(7);
  });

  test("onNumberButtonClick applies number to selected cell", () => {
    const state = { ...createStateFromPuzzle("0".repeat(81)), selected: 0 };
    let nextState = null;
    installDeps({
      getState: () => state,
      applyState: (next) => {
        nextState = next;
      },
    });

    onNumberButtonClick({ currentTarget: { dataset: { n: "5" } } });
    return expect(nextState && nextState.board[0] === 5).toBeTruthy();
  });

  test("onNumberButtonClick ignores clicks without selected cell", () => {
    const state = { ...createStateFromPuzzle("0".repeat(81)), selected: -1 };
    let applyCount = 0;
    installDeps({
      getState: () => state,
      applyState: () => {
        applyCount += 1;
      },
    });

    onNumberButtonClick({ currentTarget: { dataset: { n: "5" } } });
    return expect(applyCount).toBe(0);
  });

  test("onLoadGameClick reports invalid puzzle id", () => {
    const oldPrompt = globalThis.prompt;
    let statusMessage = "";

    globalThis.prompt = () => "abc";
    installDeps({
      setStatus: (msg) => {
        statusMessage = msg;
      },
    });

    onLoadGameClick();
    globalThis.prompt = oldPrompt;
    return expect(statusMessage).toBe("Invalid puzzle ID format.");
  });

  test("onLoadGameClick loads normalized puzzle id", () => {
    const oldPrompt = globalThis.prompt;
    let loadedFilename = "";

    globalThis.prompt = () => "001";
    installDeps({
      loadPuzzleByFilename: (filename) => {
        loadedFilename = filename;
      },
    });

    onLoadGameClick();
    globalThis.prompt = oldPrompt;
    return expect(loadedFilename).toBe("puzzles/001.yaml");
  });

  test("onHashChange applies decoded board for active game", () => {
    const oldWindow = globalThis.window;
    const board = createStateFromPuzzle("0".repeat(81)).board;
    const encoded = encodeBoard(board);
    let applied = false;

    globalThis.window = {
      location: {
        hash: `#board=${encoded}`,
      },
    };

    installDeps({
      getState: () => ({ statusType: "", board: [] }),
      applyBoardStateFromHash: (decoded) => {
        applied = Array.isArray(decoded) && decoded.length === 81;
      },
    });

    onHashChange();
    globalThis.window = oldWindow;
    return expect(applied).toBeTruthy();
  });
};

runDomTests();
