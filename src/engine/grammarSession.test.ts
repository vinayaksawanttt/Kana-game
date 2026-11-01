import { describe, expect, it } from "vitest";
import { createSeededRng } from "./random";
import {
  buildGrammarResult,
  createGrammarSession,
  createGrammarState,
  grammarReducer,
} from "./grammarSession";
import { getGrammarDoc, getGrammarListByLevel } from "@/lib/content/grammar";

describe("Grammar Engine & MDX Content Reader", () => {
  it("loads grammar list by level and compiles MDX doc with gray-matter + next-mdx-remote", async () => {
    const n5List = await getGrammarListByLevel("N5");
    expect(n5List.length).toBe(136);

    const first = n5List[0]!;
    const doc = await getGrammarDoc(first.slug, "N5");
    expect(doc).not.toBeNull();
    expect(doc?.frontmatter.id).toBe(first.id);
    expect(doc?.frontmatter.level).toBe("N5");
    expect(doc?.mdxSource.compiledSource).toBeTruthy();
  });

  it("creates mixed Cloze + Scramble sessions deterministically and reduces answers accurately", async () => {
    const rng = createSeededRng("grammar-seed-1");
    const session = await createGrammarSession(
      {
        levels: ["N5"],
        size: 10,
        clozeRatio: 0.5,
        sessionId: "test-grammar-session",
      },
      rng
    );

    expect(session.sessionId).toBe("test-grammar-session");
    expect(session.questions.length).toBe(10);

    const clozeQuestions = session.questions.filter((q) => q.type === "cloze");
    const scrambleQuestions = session.questions.filter((q) => q.type === "scramble");
    expect(clozeQuestions.length).toBeGreaterThan(0);
    expect(scrambleQuestions.length).toBeGreaterThan(0);

    let state = createGrammarState(session, 1000);
    for (let idx = 0; idx < session.questions.length; idx += 1) {
      const q = session.questions[idx]!;
      if (q.type === "cloze") {
        const correctOptionIdx = q.options.indexOf(q.correctAnswer);
        expect(correctOptionIdx).toBeGreaterThanOrEqual(0);
        state = grammarReducer(state, {
          type: "ANSWER_CLOZE",
          optionIndex: correctOptionIdx,
          index: idx,
          timeMs: 500,
        });
      } else {
        state = grammarReducer(state, {
          type: "ANSWER_SCRAMBLE",
          chunks: q.correctChunks,
          index: idx,
          timeMs: 800,
        });
      }
      state = grammarReducer(state, { type: "NEXT", index: idx });
    }

    const result = buildGrammarResult(state, 9000);
    expect(result.questions.every((r) => r.status === "correct")).toBe(true);
  });
});

