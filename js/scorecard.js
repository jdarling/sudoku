/**
 * Scorecard model and pure update helpers.
 * Tracks per-run assistance and interaction metrics.
 */

/**
 * Combines two feature lists and returns a deduplicated union.
 * @param {string[]} featureSetA - Existing feature list
 * @param {string[]} featureSetB - Next feature list
 * @returns {string[]} Combined unique feature list
 */
const combineHighlightFeatures = (featureSetA, featureSetB) => {
  const combined = [
    ...(Array.isArray(featureSetA) ? featureSetA : []),
    ...(Array.isArray(featureSetB) ? featureSetB : []),
  ];
  return [...new Set(combined)];
};

/**
 * Returns stable puzzle hash for puzzle identity + starting digits.
 * @param {Object} input - Hash input
 * @param {string} input.puzzleId - Puzzle identifier
 * @param {string} input.startingBoardDigits - Canonical starting board digits
 * @returns {string} Stable lowercase hash string
 */
const createPuzzleHash = ({ puzzleId, startingBoardDigits }) => {
  const source = `${puzzleId || ""}|${startingBoardDigits || ""}`;
  let hashA = 0x811c9dc5;
  let hashB = 0x01000193;
  let hashC = 0x9e3779b9;
  let hashD = 0x85ebca6b;

  for (let i = 0; i < source.length; i++) {
    const code = source.charCodeAt(i);
    hashA ^= code;
    hashA = Math.imul(hashA, 0x01000193);

    hashB ^= code << (i % 8);
    hashB = Math.imul(hashB, 0x27d4eb2d);

    hashC ^= code + i;
    hashC = Math.imul(hashC, 0x85ebca6b);

    hashD ^= code * (i + 1);
    hashD = Math.imul(hashD, 0xc2b2ae35);
  }

  const toHex = (value) => (value >>> 0).toString(16).padStart(8, "0");
  return `${toHex(hashA)}${toHex(hashB)}${toHex(hashC)}${toHex(hashD)}`;
};

/**
 * Creates initial scorecard for one board run.
 * @param {Object} input - Initial scorecard context
 * @param {string[]} input.highlightFeatures - Active highlight features
 * @param {string} input.puzzleId - Puzzle identifier
 * @param {string} input.startingBoardDigits - Canonical starting board digits
 * @param {string} input.startedAt - Run start timestamp (ISO)
 * @returns {Object} Initial scorecard object
 */
const createInitialScorecard = ({
  highlightFeatures,
  puzzleId,
  startingBoardDigits,
  startedAt,
}) => {
  return {
    puzzleId: puzzleId || "",
    puzzleHash: createPuzzleHash({
      puzzleId: puzzleId || "",
      startingBoardDigits: startingBoardDigits || "",
    }),
    startedAt: startedAt || "",
    firstMoveAt: "",
    completedAt: "",
    isFrozen: false,
    isDisqualified: false,
    disqualifyReason: "",
    moveCount: 0,
    checkClickCount: 0,
    hintClickCount: 0,
    immediateErrorShownCount: 0,
    errorShownCount: 0,
    errorCellShownCount: 0,
    supportOptionsUsed: combineHighlightFeatures([], highlightFeatures),
  };
};

/**
 * Applies validated scorecard mutations immutably.
 * @param {Object} scorecard - Current scorecard
 * @param {Object} mutations - Partial mutations
 * @returns {Object} Updated scorecard (or unchanged when rejected)
 */
const mutateScorecard = (scorecard, mutations) => {
  if (!scorecard || typeof scorecard !== "object") {
    return scorecard;
  }
  if (scorecard.isFrozen) {
    return scorecard;
  }
  if (!mutations || typeof mutations !== "object") {
    return scorecard;
  }

  const next = { ...scorecard };
  const entries = Object.entries(mutations);

  for (const [key, value] of entries) {
    if (key === "startedAt") {
      if (scorecard.startedAt || value === "") {
        continue;
      }
      next.startedAt = value;
      continue;
    }

    if (key === "firstMoveAt") {
      if (scorecard.firstMoveAt || value === "") {
        continue;
      }
      next.firstMoveAt = value;
      continue;
    }

    if (key === "completedAt") {
      if (value === "") {
        continue;
      }
      next.completedAt = value;
      continue;
    }

    if (key === "disqualifyReason") {
      const activeDisqualification =
        (mutations.isDisqualified ?? scorecard.isDisqualified) === true;
      if (
        scorecard.disqualifyReason &&
        value === "" &&
        activeDisqualification
      ) {
        continue;
      }
      next.disqualifyReason = value;
      continue;
    }

    if (key === "supportOptionsUsed") {
      next.supportOptionsUsed = combineHighlightFeatures([], value);
      continue;
    }

    next[key] = value;
  }

  return next;
};

/**
 * Records support option changes for the active run.
 * @param {Object} scorecard - Current scorecard
 * @param {string[]} highlightFeatures - Current active feature list
 * @param {string} nowIso - Current timestamp (ISO)
 * @returns {Object} Updated scorecard
 */
const recordSupportChecksChange = (scorecard, highlightFeatures, nowIso) => {
  if (!scorecard || scorecard.isFrozen) {
    return scorecard;
  }

  const supportOptionsUsed = combineHighlightFeatures(
    scorecard.supportOptionsUsed,
    highlightFeatures,
  );

  const startedAt = scorecard.startedAt || nowIso || "";
  return mutateScorecard(scorecard, {
    startedAt,
    supportOptionsUsed,
  });
};

/**
 * Records one successful user board mutation.
 * @param {Object} scorecard - Current scorecard
 * @param {Object} input - Move metadata
 * @param {boolean} input.isClear - True when move is a clear action
 * @param {string} input.nowIso - Current timestamp (ISO)
 * @returns {Object} Updated scorecard
 */
const recordMove = (scorecard, { isClear, nowIso }) => {
  if (!scorecard || scorecard.isFrozen) {
    return scorecard;
  }

  const nextCount = (scorecard.moveCount || 0) + 1;
  const shouldSetFirstMove = !isClear && !scorecard.firstMoveAt;

  return mutateScorecard(scorecard, {
    moveCount: nextCount,
    firstMoveAt: shouldSetFirstMove ? nowIso || "" : scorecard.firstMoveAt,
  });
};

/**
 * Records one accepted Check button click.
 * @param {Object} scorecard - Current scorecard
 * @returns {Object} Updated scorecard
 */
const recordCheckClick = (scorecard) => {
  if (!scorecard || scorecard.isFrozen) {
    return scorecard;
  }

  return mutateScorecard(scorecard, {
    checkClickCount: (scorecard.checkClickCount || 0) + 1,
  });
};

/**
 * Records one accepted Hint button click.
 * @param {Object} scorecard - Current scorecard
 * @returns {Object} Updated scorecard
 */
const recordHintClick = (scorecard) => {
  if (!scorecard || scorecard.isFrozen) {
    return scorecard;
  }

  return mutateScorecard(scorecard, {
    hintClickCount: (scorecard.hintClickCount || 0) + 1,
  });
};

/**
 * Records error display event counts by type.
 * @param {Object} scorecard - Current scorecard
 * @param {'immediate'|'error-cell'} errorType - Error visibility event type
 * @returns {Object} Updated scorecard
 */
const recordErrorShown = (scorecard, errorType) => {
  if (!scorecard || scorecard.isFrozen) {
    return scorecard;
  }

  if (errorType !== "immediate" && errorType !== "error-cell") {
    return scorecard;
  }

  if (errorType === "immediate") {
    return mutateScorecard(scorecard, {
      immediateErrorShownCount: (scorecard.immediateErrorShownCount || 0) + 1,
      errorShownCount: (scorecard.errorShownCount || 0) + 1,
    });
  }

  return mutateScorecard(scorecard, {
    errorCellShownCount: (scorecard.errorCellShownCount || 0) + 1,
    errorShownCount: (scorecard.errorShownCount || 0) + 1,
  });
};

/**
 * Finalizes scorecard at terminal boundary and freezes further updates.
 * @param {Object} scorecard - Current scorecard
 * @param {string} nowIso - Current timestamp (ISO)
 * @returns {Object} Updated and frozen scorecard
 */
const finalizeScorecard = (scorecard, nowIso) => {
  if (!scorecard || scorecard.isFrozen) {
    return scorecard;
  }

  const completedAt = nowIso || "";
  const finalized = mutateScorecard(scorecard, {
    completedAt,
    isFrozen: true,
  });

  return {
    ...finalized,
    isFrozen: true,
  };
};
