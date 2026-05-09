/**
 * Tests for utils.js pure functions.
 */

const runUtilsTests = () => {
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

  let formatString = resolveSymbol("formatString");
  let extractPuzzleId = resolveSymbol("extractPuzzleId");
  let normalizePuzzleId = resolveSymbol("normalizePuzzleId");
  let formatPuzzleStatus = resolveSymbol("formatPuzzleStatus");

  setTestFile("utils.js");

  test("formatString replaces single placeholder", () => {
    const result = formatString("Hello {name}", { name: "World" });
    return expect(result).toBe("Hello World");
  });

  test("formatString replaces multiple placeholders", () => {
    const result = formatString("Puzzle {puzzleName} level {level}", {
      puzzleName: "Easy",
      level: "Hard",
    });
    return expect(result).toBe("Puzzle Easy level Hard");
  });

  test("formatString ignores unspecified placeholders", () => {
    const result = formatString("Puzzle {puzzleName} is {status}", {
      puzzleName: "Test",
    });
    return expect(result).toBe("Puzzle Test is {status}");
  });

  test("formatString handles repeated placeholders", () => {
    const result = formatString(
      "User {user} loaded puzzle {puzzle} for user {user}",
      { user: "Alice", puzzle: "001" },
    );
    return expect(result).toBe("User Alice loaded puzzle 001 for user Alice");
  });

  test("formatString converts non-string values to strings", () => {
    const result = formatString("Count: {count}, Active: {active}", {
      count: 42,
      active: true,
    });
    return expect(result).toBe("Count: 42, Active: true");
  });

  test("formatString handles empty template", () => {
    return expect(formatString("", { name: "Value" })).toBe("");
  });

  test("formatString handles null template", () => {
    return expect(formatString(null, { name: "Value" })).toBe(null);
  });

  test("formatString handles empty values object", () => {
    const result = formatString("Hello {name}", {});
    return expect(result).toBe("Hello {name}");
  });

  test("formatString handles special regex characters in values", () => {
    const result = formatString("Error: {error}", {
      error: "File $100.txt (test)",
    });
    return expect(result).toBe("Error: File $100.txt (test)");
  });

  test("formatString ignores extra keys in values object", () => {
    const result = formatString("Name: {name}", {
      name: "Alice",
      unused: "Bob",
    });
    return expect(result).toBe("Name: Alice");
  });

  test("formatString handles template with no placeholders", () => {
    const result = formatString("Plain text with no placeholders", {
      name: "Value",
    });
    return expect(result).toBe("Plain text with no placeholders");
  });

  test("extractPuzzleId removes .yaml extension", () => {
    return expect(extractPuzzleId("puzzles/001.yaml")).toBe("001");
  });

  test("extractPuzzleId removes puzzles/ prefix", () => {
    return expect(extractPuzzleId("puzzles/042.yaml")).toBe("042");
  });

  test("extractPuzzleId handles owner/puzzle format", () => {
    return expect(extractPuzzleId("username/123.yaml")).toBe("username/123");
  });

  test("extractPuzzleId returns unknown for empty string", () => {
    return expect(extractPuzzleId("")).toBe("unknown");
  });

  test("extractPuzzleId returns unknown for null", () => {
    return expect(extractPuzzleId(null)).toBe("unknown");
  });

  test("normalizePuzzleId accepts plain ID", () => {
    return expect(normalizePuzzleId("001")).toBe("puzzles/001.yaml");
  });

  test("normalizePuzzleId accepts puzzles/ID format", () => {
    return expect(normalizePuzzleId("puzzles/042")).toBe("puzzles/042.yaml");
  });

  test("normalizePuzzleId accepts full path with extension", () => {
    return expect(normalizePuzzleId("puzzles/123.yaml")).toBe(
      "puzzles/123.yaml",
    );
  });

  test("normalizePuzzleId rejects non-numeric IDs", () => {
    return expect(normalizePuzzleId("abc")).toBe(null);
  });

  test("normalizePuzzleId rejects empty string", () => {
    return expect(normalizePuzzleId("")).toBe(null);
  });

  test("normalizePuzzleId rejects null", () => {
    return expect(normalizePuzzleId(null)).toBe(null);
  });

  test("normalizePuzzleId rejects whitespace-only input", () => {
    return expect(normalizePuzzleId("   ")).toBe(null);
  });

  test("normalizePuzzleId ignores whitespace around ID", () => {
    return expect(normalizePuzzleId("  001  ")).toBe("puzzles/001.yaml");
  });

  test("formatPuzzleStatus returns original message if puzzleName missing", () => {
    const msg = formatPuzzleStatus("Puzzle solved!", "", {
      "Puzzle solved!": "Puzzle {puzzleName} solved!",
    });
    return expect(msg).toBe("Puzzle solved!");
  });

  test("formatPuzzleStatus formats status with puzzle name", () => {
    const msg = formatPuzzleStatus("Puzzle solved!", "Easy", {
      "Puzzle solved!": "Puzzle {puzzleName} solved!",
    });
    return expect(msg).toBe("Puzzle Easy solved!");
  });

  test("formatPuzzleStatus returns original if no template", () => {
    const msg = formatPuzzleStatus("Custom message", "Test", {});
    return expect(msg).toBe("Custom message");
  });
};

runUtilsTests();
