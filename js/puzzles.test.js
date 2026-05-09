/**
 * Tests for puzzles.js logic functions.
 */

const runPuzzleTests = () => {
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

  let parsePuzzleDoc = resolveSymbol("parsePuzzleDoc");
  let getPuzzles = resolveSymbol("getPuzzles");
  let getPuzzle = resolveSymbol("getPuzzle");
  let getRandomPuzzle = resolveSymbol("getRandomPuzzle");

  setTestFile("puzzles.js");

  test("parsePuzzleDoc reads rows format", () => {
    const doc = {
      puzzle: {
        rows: [
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
        ],
      },
    };
    return expect(parsePuzzleDoc(doc).length).toBe(81);
  });

  test("parsePuzzleDoc reads blocks format", () => {
    const blocks = {
      "top-left": ["123", "456", "789"],
      "top-center": ["123", "456", "789"],
      "top-right": ["123", "456", "789"],
      "middle-left": ["123", "456", "789"],
      "middle-center": ["123", "456", "789"],
      "middle-right": ["123", "456", "789"],
      "bottom-left": ["123", "456", "789"],
      "bottom-center": ["123", "456", "789"],
      "bottom-right": ["123", "456", "789"],
    };
    const doc = { puzzle: { blocks } };
    return expect(parsePuzzleDoc(doc).length).toBe(81);
  });

  test("getPuzzles returns parsed index list", async () => {
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ["puzzles/001.yaml"],
    });
    const list = await getPuzzles();
    return expect(list).toEqual(["puzzles/001.yaml"]);
  });

  test("getPuzzles throws on failed response", async () => {
    globalThis.fetch = async () => ({ ok: false, statusText: "Nope" });
    try {
      await getPuzzles();
      return false;
    } catch (error) {
      return expect(error.message).toInclude("Failed to load puzzle index");
    }
  });

  test("getPuzzle fetches and parses a puzzle", async () => {
    const payload = JSON.stringify({
      name: "Sample",
      author: "A",
      difficulty: "easy",
      puzzle: {
        rows: [
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
        ],
      },
    });
    globalThis.fetch = async () => ({ ok: true, text: async () => payload });
    const puzzle = await getPuzzle("puzzles/001.yaml");
    return expect(
      puzzle.filename === "puzzles/001.yaml" && puzzle.puzzle.length === 81,
    ).toBeTruthy();
  });

  test("getPuzzle throws on failed response", async () => {
    globalThis.fetch = async () => ({ ok: false, statusText: "Missing" });
    try {
      await getPuzzle("puzzles/missing.yaml");
      return false;
    } catch (error) {
      return expect(error.message).toInclude("Failed to load puzzle");
    }
  });

  test("getRandomPuzzle selects from index and loads puzzle", async () => {
    const originalRandom = Math.random;
    Math.random = () => 0;

    const payload = JSON.stringify({
      name: "Random",
      author: "B",
      difficulty: "easy",
      puzzle: {
        rows: [
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
        ],
      },
    });

    globalThis.fetch = async (url) => {
      if (url === "data/puzzles.json") {
        return { ok: true, json: async () => ["puzzles/001.yaml"] };
      }
      return { ok: true, text: async () => payload };
    };

    const puzzle = await getRandomPuzzle();
    Math.random = originalRandom;
    return expect(puzzle.name).toBe("Random");
  });

  test("getRandomPuzzle excludes current puzzle when alternatives exist", async () => {
    const originalRandom = Math.random;
    Math.random = () => 0;

    const payload = JSON.stringify({
      name: "Different",
      author: "C",
      difficulty: "easy",
      puzzle: {
        rows: [
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
        ],
      },
    });

    globalThis.fetch = async (url) => {
      if (url === "data/puzzles.json") {
        return {
          ok: true,
          json: async () => ["puzzles/001.yaml", "puzzles/002.yaml"],
        };
      }
      return { ok: true, text: async () => payload };
    };

    const puzzle = await getRandomPuzzle("puzzles/001.yaml");
    Math.random = originalRandom;
    return expect(puzzle.filename).toBe("puzzles/002.yaml");
  });

  test("getRandomPuzzle keeps only puzzle when index has one entry", async () => {
    const payload = JSON.stringify({
      name: "Only",
      author: "D",
      difficulty: "easy",
      puzzle: {
        rows: [
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
          "123456789",
        ],
      },
    });

    globalThis.fetch = async (url) => {
      if (url === "data/puzzles.json") {
        return { ok: true, json: async () => ["puzzles/001.yaml"] };
      }
      return { ok: true, text: async () => payload };
    };

    const puzzle = await getRandomPuzzle("puzzles/001.yaml");
    return expect(puzzle.filename).toBe("puzzles/001.yaml");
  });
};

runPuzzleTests();
