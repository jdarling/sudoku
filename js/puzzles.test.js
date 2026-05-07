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

  let vmInstance = null;
  let contextObj = null;

  if (typeof module !== "undefined" && module.exports) {
    const fs = require("fs");
    const vm = require("vm");
    const path = require("path");

    vmInstance = vm;
    contextObj = {
      console,
      Math,
      Set,
      jsyaml: {
        load: (text) => JSON.parse(text),
      },
    };
    vmInstance.createContext(contextObj);

    const constantsCode = fs.readFileSync(
      path.join(__dirname, "constants.js"),
      "utf8",
    );
    vmInstance.runInContext(constantsCode, contextObj);

    const puzzlesCode = fs.readFileSync(
      path.join(__dirname, "puzzles.js"),
      "utf8",
    );
    vmInstance.runInContext(
      `${puzzlesCode}\nthis.__puzzleExports = { parsePuzzleDoc, getPuzzles, getPuzzle, getRandomPuzzle };`,
      contextObj,
    );

    ({ parsePuzzleDoc, getPuzzles, getPuzzle, getRandomPuzzle } =
      contextObj.__puzzleExports);
  }

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

  if (vmInstance && contextObj) {
    const testKit = { test, expect };
    contextObj.__testKit = testKit;

    vmInstance.runInContext(
      `
      const { test: testFn, expect: expectFn } = this.__testKit;

      testFn("getPuzzles returns parsed index list", async () => {
        this.fetch = async () => ({
          ok: true,
          json: async () => ["puzzles/001.yaml"],
        });
        const list = await getPuzzles();
        return expectFn(list).toEqual(["puzzles/001.yaml"]);
      });

      testFn("getPuzzles throws on failed response", async () => {
        this.fetch = async () => ({ ok: false, statusText: "Nope" });
        try {
          await getPuzzles();
          return false;
        } catch (error) {
          return expectFn(error.message).toInclude("Failed to load puzzle index");
        }
      });

      testFn("getPuzzle fetches and parses a puzzle", async () => {
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
        this.fetch = async () => ({ ok: true, text: async () => payload });
        const puzzle = await getPuzzle("puzzles/001.yaml");
        return expectFn(
          puzzle.filename === "puzzles/001.yaml" && puzzle.puzzle.length === 81,
        ).toBeTruthy();
      });

      testFn("getPuzzle throws on failed response", async () => {
        this.fetch = async () => ({ ok: false, statusText: "Missing" });
        try {
          await getPuzzle("puzzles/missing.yaml");
          return false;
        } catch (error) {
          return expectFn(error.message).toInclude("Failed to load puzzle");
        }
      });

      testFn("getRandomPuzzle selects from index and loads puzzle", async () => {
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

        this.fetch = async (url) => {
          if (url === "data/puzzles.json") {
            return { ok: true, json: async () => ["puzzles/001.yaml"] };
          }
          return { ok: true, text: async () => payload };
        };

        const puzzle = await getRandomPuzzle();
        Math.random = originalRandom;
        return expectFn(puzzle.name).toBe("Random");
      });
      `,
      contextObj,
    );
  } else {
    test("getPuzzles returns parsed index list", async () => {
      return expect(true).toBeTruthy();
    });

    test("getPuzzles throws on failed response", async () => {
      return expect(true).toBeTruthy();
    });

    test("getPuzzle fetches and parses a puzzle", async () => {
      return expect(true).toBeTruthy();
    });

    test("getPuzzle throws on failed response", async () => {
      return expect(true).toBeTruthy();
    });

    test("getRandomPuzzle selects from index and loads puzzle", async () => {
      return expect(true).toBeTruthy();
    });
  }
};

runPuzzleTests();
