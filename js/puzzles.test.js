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
  let getPuzzleIndex = resolveSymbol("getPuzzleIndex");
  let getPuzzles = resolveSymbol("getPuzzles");
  let getPuzzle = resolveSymbol("getPuzzle");
  let getRandomPuzzle = resolveSymbol("getRandomPuzzle");
  let sanitizePuzzleToken = resolveSymbol("sanitizePuzzleToken");
  let findPuzzleMatches = resolveSymbol("findPuzzleMatches");
  let buildPuzzleSearchText = resolveSymbol("buildPuzzleSearchText");

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

  test("getPuzzleIndex returns metadata entries", async () => {
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => [
        {
          id: "001",
          path: "puzzles/easy/001.yaml",
          name: "Puzzle 001",
          level: "easy",
          author: "Unknown",
          description: "",
        },
      ],
    });
    const list = await getPuzzleIndex();
    return expect(list[0].path).toBe("puzzles/easy/001.yaml");
  });

  test("getPuzzles returns parsed index list", async () => {
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => [
        {
          id: "001",
          path: "puzzles/easy/001.yaml",
          name: "Puzzle 001",
          level: "easy",
          author: "Unknown",
          description: "",
        },
      ],
    });
    const list = await getPuzzles();
    return expect(list).toEqual(["puzzles/easy/001.yaml"]);
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
        return {
          ok: true,
          json: async () => [
            {
              id: "001",
              path: "puzzles/001.yaml",
              name: "Puzzle 001",
              level: "easy",
              author: "Unknown",
              description: "",
            },
          ],
        };
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
          json: async () => [
            {
              id: "001",
              path: "puzzles/001.yaml",
              name: "Puzzle 001",
              level: "easy",
              author: "Unknown",
              description: "",
            },
            {
              id: "002",
              path: "puzzles/002.yaml",
              name: "Puzzle 002",
              level: "easy",
              author: "Unknown",
              description: "",
            },
          ],
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
        return {
          ok: true,
          json: async () => [
            {
              id: "001",
              path: "puzzles/001.yaml",
              name: "Puzzle 001",
              level: "easy",
              author: "Unknown",
              description: "",
            },
          ],
        };
      }
      return { ok: true, text: async () => payload };
    };

    const puzzle = await getRandomPuzzle("puzzles/001.yaml");
    return expect(puzzle.filename).toBe("puzzles/001.yaml");
  });

  test("sanitizePuzzleToken returns empty string for falsy input", () => {
    return expect(sanitizePuzzleToken("")).toBe("");
  });

  test("sanitizePuzzleToken strips .yaml suffix", () => {
    return expect(sanitizePuzzleToken("004.yaml")).toBe("004");
  });

  test("sanitizePuzzleToken strips puzzles/ prefix", () => {
    return expect(sanitizePuzzleToken("puzzles/004.yaml")).toBe("004");
  });

  test("sanitizePuzzleToken strips difficulty subdir and puzzles/ prefix", () => {
    return expect(sanitizePuzzleToken("puzzles/easy/004.yaml")).toBe(
      "easy/004",
    );
  });

  test("sanitizePuzzleToken strips easy/ prefix without puzzles/ prefix", () => {
    return expect(sanitizePuzzleToken("easy/004.yaml")).toBe("easy/004");
  });

  test("sanitizePuzzleToken removes path traversal segments", () => {
    return expect(sanitizePuzzleToken("../004")).toBe("004");
  });

  test("sanitizePuzzleToken removes internal path traversal", () => {
    return expect(sanitizePuzzleToken("puzzles/../easy/004.yaml")).toBe(
      "easy/004",
    );
  });

  test("sanitizePuzzleToken URL-decodes encoded input", () => {
    return expect(sanitizePuzzleToken("puzzles%2Feasy%2F004.yaml")).toBe(
      "easy/004",
    );
  });

  test("findPuzzleMatches returns no match for empty index", () => {
    const result = findPuzzleMatches("004", []);
    return expect(
      result.exactMatch === null && result.filtered.length === 0,
    ).toBeTruthy();
  });

  test("findPuzzleMatches exact match by canonical id", () => {
    const entries = [
      {
        id: "004",
        path: "puzzles/easy/004.yaml",
        name: "Puzzle 004",
        level: "easy",
        author: "Unknown",
        description: "",
      },
      {
        id: "011",
        path: "puzzles/medium/011.yaml",
        name: "Puzzle 011",
        level: "medium",
        author: "Unknown",
        description: "",
      },
    ];
    const result = findPuzzleMatches("004", entries);
    return expect(result.exactMatch).toBe("puzzles/easy/004.yaml");
  });

  test("findPuzzleMatches exact match by legacy path token", () => {
    const entries = [
      {
        id: "004",
        path: "puzzles/easy/004.yaml",
        name: "Puzzle 004",
        level: "easy",
        author: "Unknown",
        description: "",
      },
      {
        id: "011",
        path: "puzzles/medium/011.yaml",
        name: "Puzzle 011",
        level: "medium",
        author: "Unknown",
        description: "",
      },
    ];
    const result = findPuzzleMatches("easy/004", entries);
    return expect(result.exactMatch).toBe("puzzles/easy/004.yaml");
  });

  test("findPuzzleMatches exact match for full legacy path", () => {
    const entries = [
      {
        id: "004",
        path: "puzzles/easy/004.yaml",
        name: "Puzzle 004",
        level: "easy",
        author: "Unknown",
        description: "",
      },
      {
        id: "011",
        path: "puzzles/medium/011.yaml",
        name: "Puzzle 011",
        level: "medium",
        author: "Unknown",
        description: "",
      },
    ];
    const result = findPuzzleMatches("puzzles/easy/004.yaml", entries);
    return expect(result.exactMatch).toBe("puzzles/easy/004.yaml");
  });

  test("findPuzzleMatches returns no exact match for unknown token", () => {
    const entries = [
      {
        id: "004",
        path: "puzzles/easy/004.yaml",
        name: "Puzzle 004",
        level: "easy",
        author: "Unknown",
        description: "",
      },
    ];
    const result = findPuzzleMatches("999", entries);
    return expect(result.exactMatch === null).toBeTruthy();
  });

  test("findPuzzleMatches returns filtered entries for partial token", () => {
    const entries = [
      {
        id: "004",
        path: "puzzles/easy/004.yaml",
        name: "Starter",
        level: "easy",
        author: "Unknown",
        description: "",
      },
      {
        id: "011",
        path: "puzzles/medium/011.yaml",
        name: "Puzzle 011",
        level: "medium",
        author: "Unknown",
        description: "",
      },
      {
        id: "021",
        path: "puzzles/hard/021.yaml",
        name: "Puzzle 021",
        level: "hard",
        author: "Unknown",
        description: "",
      },
    ];
    const result = findPuzzleMatches("starter", entries);
    return expect(
      result.filtered.length === 1 &&
        result.filtered[0].path === "puzzles/easy/004.yaml",
    ).toBeTruthy();
  });

  test("findPuzzleMatches returns empty filtered for completely unknown token", () => {
    const entries = [
      {
        id: "004",
        path: "puzzles/easy/004.yaml",
        name: "Puzzle 004",
        level: "easy",
        author: "Unknown",
        description: "",
      },
    ];
    const result = findPuzzleMatches("xyzzy", entries);
    return expect(result.filtered.length === 0).toBeTruthy();
  });

  test("buildPuzzleSearchText includes all searchable fields", () => {
    const entry = {
      id: "004",
      path: "puzzles/easy/004.yaml",
      name: "Hidden Gem",
      level: "easy",
      author: "Jane",
      description: "Practice board",
    };
    const text = buildPuzzleSearchText(entry);
    return expect(
      text.includes("hidden gem") &&
        text.includes("jane") &&
        text.includes("practice board") &&
        text.includes("puzzles/easy/004.yaml"),
    ).toBeTruthy();
  });
};

runPuzzleTests();
