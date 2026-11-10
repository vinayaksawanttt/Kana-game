import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  createListeningSceneSession,
  getListeningSceneCountsByLevel,
  listeningSceneReducer,
  summarizeListeningSceneSession,
  type ListeningSceneItem,
  type ListeningSceneSession,
  type ListeningSceneSettings,
} from "@/engine/jlptListeningScene";

function createSeededRng(seed = 12345): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function loadAllTestScenes(): ListeningSceneItem[] {
  const levels = ["n1", "n2", "n3", "n4", "n5"];
  const all: ListeningSceneItem[] = [];

  for (const lvl of levels) {
    const p = path.resolve(
      process.cwd(),
      `public/data/v1/jlpt/listening-scenes-${lvl}.json`
    );
    if (fs.existsSync(p)) {
      const parsed: ListeningSceneItem[] = JSON.parse(
        fs.readFileSync(p, "utf8")
      );
      all.push(...parsed);
    }
  }

  return all;
}

describe("JLPT Game 10: Listening Scene Engine (jlptListeningScene)", () => {
  const pool = loadAllTestScenes();

  describe("getListeningSceneCountsByLevel", () => {
    it("correctly aggregates scene counts across levels", () => {
      const counts = getListeningSceneCountsByLevel(pool);
      expect(counts.N1).toBe(3);
      expect(counts.N2).toBe(3);
      expect(counts.N3).toBe(3);
      expect(counts.N4).toBe(3);
      expect(counts.N5).toBe(3);
    });
  });

  describe("createListeningSceneSession", () => {
    it("filters scenes by selected levels and respects sceneCount limit", () => {
      const settings: ListeningSceneSettings = {
        levels: ["N1", "N2"],
        sceneCount: 2,
      };

      const session = createListeningSceneSession(pool, settings);
      expect(session.scenes).toHaveLength(2);
      for (const s of session.scenes) {
        expect([1, 2]).toContain(s.jlpt);
      }
      expect(session.currentSceneIndex).toBe(0);
      expect(session.phase).toBe("intro");
      expect(session.status).toBe("playing");
      expect(session.currentPrimaryAnswer).toBeNull();
      expect(session.currentBonusAnswers).toEqual({});
      expect(session.score).toBe(0);
      expect(session.results).toEqual([]);
    });

    it("filters scenes directly by sceneIds when specified", () => {
      const settings: ListeningSceneSettings = {
        levels: ["N1"],
        sceneCount: 5,
        sceneIds: [
          "n1-scene-restaurant-incident",
          "n1-scene-printer-repair-documents",
        ],
      };

      const session = createListeningSceneSession(pool, settings);
      expect(session.scenes).toHaveLength(2);
      const sceneIds = session.scenes.map((s) => s.id);
      expect(sceneIds).toContain("n1-scene-restaurant-incident");
      expect(sceneIds).toContain("n1-scene-printer-repair-documents");
    });

    it("produces deterministic order when supplied a seeded RNG", () => {
      const settings: ListeningSceneSettings = {
        levels: ["N1", "N2", "N3", "N4", "N5"],
        sceneCount: 5,
      };

      const sessionA = createListeningSceneSession(
        pool,
        settings,
        createSeededRng(999)
      );
      const sessionB = createListeningSceneSession(
        pool,
        settings,
        createSeededRng(999)
      );

      expect(sessionA.scenes.map((s) => s.id)).toEqual(
        sessionB.scenes.map((s) => s.id)
      );
    });
  });

  describe("listeningSceneReducer Phase Flow & Lockout Rules", () => {
    const n1Scene = pool.find((s) => s.id === "n1-scene-restaurant-incident")!;

    function setupSingleSceneSession(): ListeningSceneSession {
      const settings: ListeningSceneSettings = {
        levels: ["N1"],
        sceneCount: 1,
        sceneIds: [n1Scene.id],
      };
      return createListeningSceneSession([n1Scene], settings);
    }

    it("STRICT LOCKOUT: ignores ANSWER_PRIMARY and ANSWER_BONUS during intro phase", () => {
      const initial = setupSingleSceneSession();
      expect(initial.phase).toBe("intro");

      // Attempt to answer primary during intro
      const afterPrimary = listeningSceneReducer(initial, {
        type: "ANSWER_PRIMARY",
        optionIndex: 2,
      });
      expect(afterPrimary.phase).toBe("intro");
      expect(afterPrimary.currentPrimaryAnswer).toBeNull();
      expect(afterPrimary.score).toBe(0);

      // Attempt to answer bonus during intro
      const afterBonus = listeningSceneReducer(initial, {
        type: "ANSWER_BONUS",
        questionId: "restaurant-incident-coat-reason",
        optionIndex: 0,
      });
      expect(afterBonus.phase).toBe("intro");
      expect(afterBonus.currentBonusAnswers).toEqual({});
    });

    it("STRICT LOCKOUT: ignores ANSWER_PRIMARY and ANSWER_BONUS during audio-playing phase", () => {
      let state = setupSingleSceneSession();

      // Start audio
      state = listeningSceneReducer(state, { type: "START_AUDIO" });
      expect(state.phase).toBe("audio-playing");

      // Attempt primary answer while audio is actively playing
      const afterPrimary = listeningSceneReducer(state, {
        type: "ANSWER_PRIMARY",
        optionIndex: 2,
      });
      expect(afterPrimary.phase).toBe("audio-playing");
      expect(afterPrimary.currentPrimaryAnswer).toBeNull();
      expect(afterPrimary.score).toBe(0);

      // Attempt bonus answer while audio is actively playing
      const afterBonus = listeningSceneReducer(state, {
        type: "ANSWER_BONUS",
        questionId: "restaurant-incident-coat-reason",
        optionIndex: 0,
      });
      expect(afterBonus.phase).toBe("audio-playing");
      expect(afterBonus.currentBonusAnswers).toEqual({});
    });

    it("unlocks answers when AUDIO_ENDED is dispatched and transitions answering -> answered", () => {
      let state = setupSingleSceneSession();

      state = listeningSceneReducer(state, { type: "START_AUDIO" });
      expect(state.phase).toBe("audio-playing");

      state = listeningSceneReducer(state, { type: "AUDIO_ENDED" });
      expect(state.phase).toBe("answering");

      // Now answering is unlocked. Submit primary answer (correct option is 2: 客の連絡先をたずねる)
      state = listeningSceneReducer(state, {
        type: "ANSWER_PRIMARY",
        optionIndex: 2,
        timeMs: 1450,
      });

      expect(state.phase).toBe("answered");
      expect(state.score).toBe(1);
      expect(state.currentPrimaryAnswer).toEqual({
        questionId: "restaurant-incident-primary",
        chosenIndex: 2,
        correctIndex: 2,
        isCorrect: true,
        timeMs: 1450,
      });

      // Cannot re-answer primary once in answered phase
      const duplicateAnswer = listeningSceneReducer(state, {
        type: "ANSWER_PRIMARY",
        optionIndex: 0,
      });
      expect(duplicateAnswer).toBe(state);
    });

    it("records bonus questions and prevents duplicate submissions", () => {
      let state = setupSingleSceneSession();
      state = listeningSceneReducer(state, { type: "START_AUDIO" });
      state = listeningSceneReducer(state, { type: "AUDIO_ENDED" });

      // Answer primary
      state = listeningSceneReducer(state, {
        type: "ANSWER_PRIMARY",
        optionIndex: 2,
      });

      // Answer bonus Q2 (correct is 0)
      state = listeningSceneReducer(state, {
        type: "ANSWER_BONUS",
        questionId: "restaurant-incident-coat-reason",
        optionIndex: 0,
      });

      expect(state.currentBonusAnswers["restaurant-incident-coat-reason"]).toEqual({
        questionId: "restaurant-incident-coat-reason",
        chosenIndex: 0,
        correctIndex: 0,
        isCorrect: true,
        timeMs: undefined,
      });

      // Attempt duplicate answer to same bonus question
      const duplicateBonus = listeningSceneReducer(state, {
        type: "ANSWER_BONUS",
        questionId: "restaurant-incident-coat-reason",
        optionIndex: 1,
      });
      expect(duplicateBonus).toBe(state);
    });

    it("advances through NEXT_SCENE with stale guard, finishing on the final scene", () => {
      const twoScenes = pool.slice(0, 2);
      const settings: ListeningSceneSettings = {
        levels: ["N1", "N2", "N3", "N4", "N5"],
        sceneCount: 2,
        sceneIds: twoScenes.map((s) => s.id),
      };
      // Supply a deterministic RNG so scene order is predictable
      let state = createListeningSceneSession(
        twoScenes,
        settings,
        () => 0.999
      );
      const scene0 = state.scenes[0];
      const scene1 = state.scenes[1];

      // Cannot advance before answering
      expect(listeningSceneReducer(state, { type: "NEXT_SCENE" })).toBe(state);

      // Play audio and answer scene 0
      state = listeningSceneReducer(state, { type: "START_AUDIO" });
      state = listeningSceneReducer(state, { type: "AUDIO_ENDED" });
      const correctIdx0 = scene0.questions[0].correctIndex;
      state = listeningSceneReducer(state, {
        type: "ANSWER_PRIMARY",
        optionIndex: correctIdx0,
      });
      expect(state.phase).toBe("answered");

      // Stale forIndex check: index 99 should be ignored
      const staleState = listeningSceneReducer(state, {
        type: "NEXT_SCENE",
        forIndex: 99,
      });
      expect(staleState).toBe(state);

      // Valid advance to scene 1
      state = listeningSceneReducer(state, {
        type: "NEXT_SCENE",
        forIndex: 0,
      });
      expect(state.currentSceneIndex).toBe(1);
      expect(state.phase).toBe("intro");
      expect(state.currentPrimaryAnswer).toBeNull();
      expect(state.currentBonusAnswers).toEqual({});
      expect(state.results).toHaveLength(1);
      expect(state.results[0].sceneId).toBe(scene0.id);

      // Play audio and answer scene 1 incorrectly
      state = listeningSceneReducer(state, { type: "START_AUDIO" });
      state = listeningSceneReducer(state, { type: "AUDIO_ENDED" });
      const wrongIdx1 = ((scene1.questions[0].correctIndex + 1) % 4) as 0 | 1 | 2 | 3;
      state = listeningSceneReducer(state, {
        type: "ANSWER_PRIMARY",
        optionIndex: wrongIdx1,
      });
      expect(state.phase).toBe("answered");

      // Advance from last scene -> finishes session
      state = listeningSceneReducer(state, {
        type: "NEXT_SCENE",
        forIndex: 1,
      });
      expect(state.status).toBe("finished");
      expect(state.results).toHaveLength(2);
      expect(state.completedAt).toBeTruthy();

      // Summarize
      const summary = summarizeListeningSceneSession(state);
      expect(summary.totalScenes).toBe(2);
      expect(summary.completedScenes).toBe(2);
      expect(summary.primaryScore).toBe(1);
      expect(summary.primaryAccuracy).toBe(50);
      expect(summary.missedSceneIds).toEqual([scene1.id]);
    });

    it("handles END action gracefully, committing current answered scene", () => {
      let state = setupSingleSceneSession();
      state = listeningSceneReducer(state, { type: "START_AUDIO" });
      state = listeningSceneReducer(state, { type: "AUDIO_ENDED" });
      state = listeningSceneReducer(state, {
        type: "ANSWER_PRIMARY",
        optionIndex: 2,
      });

      // Prematurely end session
      state = listeningSceneReducer(state, { type: "END" });
      expect(state.status).toBe("finished");
      expect(state.results).toHaveLength(1);
      expect(state.results[0].primaryAnswer?.isCorrect).toBe(true);

      // Calling END again is a no-op
      const doubleEnd = listeningSceneReducer(state, { type: "END" });
      expect(doubleEnd).toBe(state);
    });
  });
});
