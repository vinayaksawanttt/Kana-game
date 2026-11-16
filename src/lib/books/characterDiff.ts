export type DiffPartType = "equal" | "delete" | "insert";

export interface DiffSegment {
  type: "equal" | "wrong" | "missing";
  text: string;
}

export interface CharacterDiffResult {
  userParts: DiffSegment[];
  expectedParts: DiffSegment[];
  hasMistake: boolean;
  missedSummary: Array<{ user: string; expected: string }>;
}

export function computeCharacterDiff(userText: string, expectedText: string): CharacterDiffResult {
  const userChars = Array.from(userText);
  const expChars = Array.from(expectedText);
  const n = userChars.length;
  const m = expChars.length;

  if (n === 0 && m === 0) {
    return { userParts: [], expectedParts: [], hasMistake: false, missedSummary: [] };
  }

  // LCS Matrix
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (userChars[i] === expChars[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack
  let i = n;
  let j = m;
  const rawOps: Array<{ type: DiffPartType; char: string }> = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && userChars[i - 1] === expChars[j - 1]) {
      rawOps.push({ type: "equal", char: userChars[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawOps.push({ type: "insert", char: expChars[j - 1] });
      j--;
    } else if (i > 0) {
      rawOps.push({ type: "delete", char: userChars[i - 1] });
      i--;
    }
  }

  rawOps.reverse();

  // Build user segments (equal or wrong)
  const userParts: DiffSegment[] = [];
  // Build expected segments (equal or missing)
  const expectedParts: DiffSegment[] = [];

  for (const op of rawOps) {
    if (op.type === "equal") {
      const lastU = userParts[userParts.length - 1];
      if (lastU && lastU.type === "equal") {
        lastU.text += op.char;
      } else {
        userParts.push({ type: "equal", text: op.char });
      }

      const lastE = expectedParts[expectedParts.length - 1];
      if (lastE && lastE.type === "equal") {
        lastE.text += op.char;
      } else {
        expectedParts.push({ type: "equal", text: op.char });
      }
    } else if (op.type === "delete") {
      const lastU = userParts[userParts.length - 1];
      if (lastU && lastU.type === "wrong") {
        lastU.text += op.char;
      } else {
        userParts.push({ type: "wrong", text: op.char });
      }
    } else if (op.type === "insert") {
      const lastE = expectedParts[expectedParts.length - 1];
      if (lastE && lastE.type === "missing") {
        lastE.text += op.char;
      } else {
        expectedParts.push({ type: "missing", text: op.char });
      }
    }
  }

  // Compute a concise summary of mismatches
  const missedSummary: Array<{ user: string; expected: string }> = [];
  let curUserWrong = "";
  let curExpMissing = "";

  for (const op of rawOps) {
    if (op.type === "equal") {
      if (curUserWrong || curExpMissing) {
        missedSummary.push({ user: curUserWrong, expected: curExpMissing });
        curUserWrong = "";
        curExpMissing = "";
      }
    } else if (op.type === "delete") {
      curUserWrong += op.char;
    } else if (op.type === "insert") {
      curExpMissing += op.char;
    }
  }
  if (curUserWrong || curExpMissing) {
    missedSummary.push({ user: curUserWrong, expected: curExpMissing });
  }

  const hasMistake = rawOps.some((op) => op.type !== "equal");

  return {
    userParts,
    expectedParts,
    hasMistake,
    missedSummary,
  };
}

export function findClosestAnswer(userText: string, fullAnswer: string): string {
  const alternatives = fullAnswer
    .split(/[／/]/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (alternatives.length <= 1) return fullAnswer;

  const normalize = (s: string) =>
    s.replace(/[。、\s\t\n・！？!?()（）~〜]/g, "").toLowerCase().trim();

  const normUser = normalize(userText);

  let bestAlt = alternatives[0];
  let bestScore = -999999;

  for (const alt of alternatives) {
    if (userText === alt) return alt;
    const normAlt = normalize(alt);
    if (normUser === normAlt) {
      // If normalized is an exact match, check raw string similarity (spaces/punctuation)
      const rawDiff = computeCharacterDiff(userText, alt);
      let rawCommon = 0;
      for (const p of rawDiff.userParts) {
        if (p.type === "equal") rawCommon += p.text.length;
      }
      const rawScore = 10000 + rawCommon - Math.abs(userText.length - alt.length);
      if (rawScore > bestScore) {
        bestScore = rawScore;
        bestAlt = alt;
      }
      continue;
    }

    const diff = computeCharacterDiff(normUser, normAlt);
    let common = 0;
    for (const p of diff.userParts) {
      if (p.type === "equal") common += p.text.length;
    }

    // Also factor raw diff to break ties
    const rawDiff = computeCharacterDiff(userText, alt);
    let rawCommon = 0;
    for (const p of rawDiff.userParts) {
      if (p.type === "equal") rawCommon += p.text.length;
    }

    const spacePenalty = userText.includes(" ") !== alt.includes(" ") ? 5 : 0;
    const score = common * 10 + rawCommon - spacePenalty - Math.abs(normUser.length - normAlt.length);
    if (score > bestScore) {
      bestScore = score;
      bestAlt = alt;
    }
  }

  return bestAlt;
}

export function getCharacterDiff(userText: string, fullAnswer: string): {
  closestAnswer: string;
  diff: CharacterDiffResult;
} {
  const closest = findClosestAnswer(userText, fullAnswer);
  return {
    closestAnswer: closest,
    diff: computeCharacterDiff(userText, closest),
  };
}
