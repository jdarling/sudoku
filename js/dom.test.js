/**
 * Tests for pure helper functions in dom.js.
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
        `return typeof ${symbolName} !== 'undefined' ? ${symbolName} : undefined;`,
      )();
    } catch (_error) {
      return undefined;
    }
  };

  const handleNumberKey = resolveSymbol("handleNumberKey");
  const handleDeleteKey = resolveSymbol("handleDeleteKey");
  const handleArrowKey = resolveSymbol("handleArrowKey");
  const createStateFromPuzzle = resolveSymbol("createStateFromPuzzle");

  setTestFile("dom.js");

  test("handleNumberKey places a number in the selected cell", () => {
    const state = { ...createStateFromPuzzle("0".repeat(81)), selected: 0 };
    const next = handleNumberKey(state, 5);
    return expect(next.board[0]).toBe(5);
  });

  test("handleNumberKey returns new state without mutating input", () => {
    const state = { ...createStateFromPuzzle("0".repeat(81)), selected: 3 };
    const next = handleNumberKey(state, 7);
    return expect(state.board[3]).toBe(0);
  });

  test("handleDeleteKey clears the selected cell", () => {
    const base = createStateFromPuzzle("0".repeat(81));
    const withNumber = handleNumberKey({ ...base, selected: 4 }, 9);
    const cleared = handleDeleteKey({ ...withNumber, selected: 4 });
    return expect(cleared.board[4]).toBe(0);
  });

  test("handleDeleteKey returns new state without mutating input", () => {
    const base = createStateFromPuzzle("0".repeat(81));
    const state = {
      ...handleNumberKey({ ...base, selected: 2 }, 3),
      selected: 2,
    };
    handleDeleteKey(state);
    return expect(state.board[2]).toBe(3);
  });

  test("handleArrowKey moves selection by offset", () => {
    const state = { ...createStateFromPuzzle("0".repeat(81)), selected: 0 };
    const next = handleArrowKey(state, 1);
    return expect(next.selected).toBe(1);
  });

  test("handleArrowKey returns null for out-of-bounds move", () => {
    const state = { ...createStateFromPuzzle("0".repeat(81)), selected: 0 };
    const next = handleArrowKey(state, -1);
    return expect(next).toBe(null);
  });
};

runDomTests();
