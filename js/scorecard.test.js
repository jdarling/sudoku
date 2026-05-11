/**
 * Tests for scorecard.js pure functions.
 */

const runScorecardTests = () => {
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

  const combineHighlightFeatures = resolveSymbol("combineHighlightFeatures");
  const createPuzzleHash = resolveSymbol("createPuzzleHash");
  const createInitialScorecard = resolveSymbol("createInitialScorecard");
  const mutateScorecard = resolveSymbol("mutateScorecard");
  const recordSupportChecksChange = resolveSymbol("recordSupportChecksChange");
  const recordMove = resolveSymbol("recordMove");
  const recordCheckClick = resolveSymbol("recordCheckClick");
  const recordHintClick = resolveSymbol("recordHintClick");
  const recordErrorShown = resolveSymbol("recordErrorShown");
  const finalizeScorecard = resolveSymbol("finalizeScorecard");

  setTestFile("scorecard.js");

  const buildScorecard = () => {
    return createInitialScorecard({
      highlightFeatures: ["selected row", "same value"],
      puzzleId: "004",
      startingBoardDigits: "0".repeat(81),
      startedAt: "2026-01-01T00:00:00.000Z",
    });
  };

  test("createPuzzleHash is deterministic for identical input", () => {
    const first = createPuzzleHash({
      puzzleId: "004",
      startingBoardDigits: "0".repeat(81),
    });
    const second = createPuzzleHash({
      puzzleId: "004",
      startingBoardDigits: "0".repeat(81),
    });
    return expect(first === second).toBeTruthy();
  });

  test("createInitialScorecard stores stable puzzle identity values", () => {
    const one = buildScorecard();
    const two = buildScorecard();
    return expect(
      one.puzzleId === "004" && one.puzzleHash === two.puzzleHash,
    ).toBeTruthy();
  });

  test("combineHighlightFeatures returns deduplicated union", () => {
    const combined = combineHighlightFeatures(
      ["selected row", "same value"],
      ["same value", "error cells"],
    );
    return expect(combined).toEqual([
      "selected row",
      "same value",
      "error cells",
    ]);
  });

  test("recordSupportChecksChange accumulates options even when later toggled off", () => {
    const initial = buildScorecard();
    const withMore = recordSupportChecksChange(
      initial,
      ["selected row", "error cells"],
      "2026-01-01T00:01:00.000Z",
    );
    const withLess = recordSupportChecksChange(
      withMore,
      ["selected row"],
      "2026-01-01T00:02:00.000Z",
    );

    return expect(
      withLess.supportOptionsUsed.includes("error cells"),
    ).toBeTruthy();
  });

  test("recordMove sets firstMoveAt only once for first non-clear move", () => {
    const initial = buildScorecard();
    const first = recordMove(initial, {
      isClear: false,
      nowIso: "2026-01-01T00:01:00.000Z",
    });
    const second = recordMove(first, {
      isClear: false,
      nowIso: "2026-01-01T00:02:00.000Z",
    });

    return expect(
      first.firstMoveAt === "2026-01-01T00:01:00.000Z" &&
        second.firstMoveAt === "2026-01-01T00:01:00.000Z" &&
        second.moveCount === 2,
    ).toBeTruthy();
  });

  test("recordMove clear action increments count but does not set firstMoveAt", () => {
    const initial = buildScorecard();
    const next = recordMove(initial, {
      isClear: true,
      nowIso: "2026-01-01T00:01:00.000Z",
    });

    return expect(next.moveCount === 1 && next.firstMoveAt === "").toBeTruthy();
  });

  test("recordCheckClick increments once per accepted call", () => {
    const initial = buildScorecard();
    const next = recordCheckClick(recordCheckClick(initial));
    return expect(next.checkClickCount).toBe(2);
  });

  test("recordHintClick increments once per accepted call", () => {
    const initial = buildScorecard();
    const next = recordHintClick(recordHintClick(initial));
    return expect(next.hintClickCount).toBe(2);
  });

  test("recordErrorShown maps immediate to immediate and aggregate counters", () => {
    const initial = buildScorecard();
    const next = recordErrorShown(initial, "immediate");
    return expect(
      next.immediateErrorShownCount === 1 &&
        next.errorShownCount === 1 &&
        next.errorCellShownCount === 0,
    ).toBeTruthy();
  });

  test("recordErrorShown maps error-cell to cell and aggregate counters", () => {
    const initial = buildScorecard();
    const next = recordErrorShown(initial, "error-cell");
    return expect(
      next.errorCellShownCount === 1 &&
        next.errorShownCount === 1 &&
        next.immediateErrorShownCount === 0,
    ).toBeTruthy();
  });

  test("recordErrorShown rejects invalid type without mutation", () => {
    const initial = buildScorecard();
    const next = recordErrorShown(initial, "other");
    return expect(next).toBe(initial);
  });

  test("mutateScorecard rejects invalid startedAt overwrite", () => {
    const initial = buildScorecard();
    const next = mutateScorecard(initial, {
      startedAt: "2026-01-01T01:00:00.000Z",
    });
    return expect(next.startedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  test("finalizeScorecard freezes scorecard and blocks later updates", () => {
    const initial = buildScorecard();
    const finalized = finalizeScorecard(initial, "2026-01-01T00:05:00.000Z");
    const after = recordCheckClick(finalized);

    return expect(
      finalized.isFrozen === true &&
        finalized.completedAt === "2026-01-01T00:05:00.000Z" &&
        after.checkClickCount === finalized.checkClickCount,
    ).toBeTruthy();
  });
};

runScorecardTests();
