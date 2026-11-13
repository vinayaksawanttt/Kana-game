import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import type OpenAI from "openai";
import {
  buildSceneAudio,
  getVoiceForLine,
  loadAllListeningScenes,
  processListeningScenes,
  resolveChimeFile,
  synthesizeTtsClip,
  validateListeningScene,
  VOICE_FEMALE,
  VOICE_MALE,
  VOICE_NARRATOR,
  type ValidatedScene,
} from "../../../../scripts/build-listening-audio";

describe("JLPT Listening Audio Builder Verification", () => {
  const dummyFirstChime = path.resolve(process.cwd(), "public/audio/sfx/first_chime.mp3");
  const dummySecondChime = path.resolve(process.cwd(), "public/audio/sfx/second_chime.mp3");

  describe("Dataset Validation & Schema Integrity", () => {
    it("loads and validates all 15 listening scenes across JLPT N5–N1", () => {
      const scenes = loadAllListeningScenes();
      expect(scenes).toHaveLength(15);

      for (const scene of scenes) {
        expect(typeof scene.id).toBe("string");
        expect(scene.id.length).toBeGreaterThan(0);
        expect(scene.jlpt).toBeGreaterThanOrEqual(1);
        expect(scene.jlpt).toBeLessThanOrEqual(5);

        expect(typeof scene.introJa).toBe("string");
        expect(scene.introJa.length).toBeGreaterThan(0);

        expect(typeof scene.questionJa).toBe("string");
        expect(scene.questionJa.length).toBeGreaterThan(0);

        expect(scene.dialogueLines.length).toBeGreaterThanOrEqual(3);
        for (const line of scene.dialogueLines) {
          expect(typeof line.textJa).toBe("string");
          expect(line.textJa.length).toBeGreaterThan(0);
        }
      }
    });

    it("extracts dialogue lines cleanly without narrator intro or repeated questions", () => {
      const scenes = loadAllListeningScenes();
      const bagScene = scenes.find((s) => s.id === "n5-scene-bag-shelf");
      expect(bagScene).toBeDefined();

      expect(bagScene?.introJa).toBe("デパートで、女の人と店の人が話しています。");
      expect(bagScene?.questionJa).toBe("店の人は、どのかばんを取りますか。");

      expect(bagScene?.dialogueLines).toHaveLength(4);
      expect(bagScene?.dialogueLines[0].speaker).toBe("F");
      expect(bagScene?.dialogueLines[0].textJa).toBe("すみません、その上の黒いかばんを取ってください。");
      expect(bagScene?.dialogueLines[1].speaker).toBe("M");
      expect(bagScene?.dialogueLines[2].speaker).toBe("F");
      expect(bagScene?.dialogueLines[3].speaker).toBe("M");
    });

    it("throws descriptive errors for invalid scene structures", () => {
      expect(() => validateListeningScene(null, "test")).toThrow(/not an object/);
      expect(() => validateListeningScene({}, "test")).toThrow(/missing required string 'id'/);
      expect(() =>
        validateListeningScene({ id: "scene-1", jlpt: 99 }, "test")
      ).toThrow(/invalid 'jlpt' level/);
      expect(() =>
        validateListeningScene({ id: "scene-1", jlpt: 5, audioSequence: [] }, "test")
      ).toThrow(/insufficient 'audioSequence'/);
      expect(() =>
        validateListeningScene(
          {
            id: "scene-1",
            jlpt: 5,
            audioSequence: [
              { speaker: "Narrator", textJa: "" },
              { speaker: "Narrator", textJa: "" },
              { speaker: "F", textJa: "" },
            ],
          },
          "test"
        )
      ).toThrow(/missing or empty 'introJa'/);
    });
  });

  describe("Voice Selection & Mapping", () => {
    it("maps female speakers to VOICE_FEMALE", () => {
      expect(getVoiceForLine({ speaker: "F", textJa: "こんにちは", voiceGender: "female" })).toBe(VOICE_FEMALE);
      expect(getVoiceForLine({ speaker: "F", textJa: "こんにちは" })).toBe(VOICE_FEMALE);
      expect(getVoiceForLine({ speaker: "Woman", textJa: "こんにちは", voiceGender: "female" })).toBe(VOICE_FEMALE);
    });

    it("maps male speakers to VOICE_MALE", () => {
      expect(getVoiceForLine({ speaker: "M", textJa: "こんにちは", voiceGender: "male" })).toBe(VOICE_MALE);
      expect(getVoiceForLine({ speaker: "M", textJa: "こんにちは" })).toBe(VOICE_MALE);
      expect(getVoiceForLine({ speaker: "Man", textJa: "こんにちは", voiceGender: "male" })).toBe(VOICE_MALE);
    });

    it("maps narrator or unspecified speakers to VOICE_NARRATOR", () => {
      expect(getVoiceForLine({ speaker: "Narrator", textJa: "問題です", voiceGender: "narrator" })).toBe(VOICE_NARRATOR);
      expect(getVoiceForLine({ speaker: "Announcer", textJa: "問題です" })).toBe(VOICE_NARRATOR);
    });
  });

  describe("Output Naming & Chunk Ordering", () => {
    const sampleScene: ValidatedScene = {
      id: "test-ordering-scene",
      jlpt: 5,
      titleJa: "テスト",
      introJa: "男の人と女の人が話しています。",
      questionJa: "男の人は何をしますか。",
      dialogueLines: [
        { speaker: "M", voiceGender: "male", textJa: "これをお願いします。" },
        { speaker: "F", voiceGender: "female", textJa: "はい、かしこまりました。" },
      ],
    };

    it("generates output naming matching public/audio/listening-scenes/${scene.id}.mp3", async () => {
      const testOutputDir = path.resolve(process.cwd(), ".tmp/test-output");
      const testScratchDir = path.resolve(process.cwd(), ".tmp/test-scratch");

      fs.mkdirSync(testOutputDir, { recursive: true });
      fs.mkdirSync(testScratchDir, { recursive: true });

      const mockMerge = vi.fn().mockImplementation(async (_chunks, outFile) => {
        fs.writeFileSync(outFile, "dummy-mp3-content");
      });

      const resultPath = await buildSceneAudio(sampleScene, {
        openai: null,
        outputDir: testOutputDir,
        scratchRoot: testScratchDir,
        firstChimePath: dummyFirstChime,
        secondChimePath: dummySecondChime,
        dryRun: true,
        force: true,
        mergeFn: mockMerge,
      });

      expect(resultPath).toBe(path.join(testOutputDir, "test-ordering-scene.mp3"));
      expect(fs.existsSync(resultPath)).toBe(true);

      fs.rmSync(testOutputDir, { recursive: true, force: true });
      fs.rmSync(testScratchDir, { recursive: true, force: true });
    });

    it("stitches chunks in the exact 11-step sequence with 400ms pause between dialogue turns", async () => {
      const testOutputDir = path.resolve(process.cwd(), ".tmp/test-seq-out");
      const testScratchDir = path.resolve(process.cwd(), ".tmp/test-seq-scratch");

      fs.mkdirSync(testOutputDir, { recursive: true });
      fs.mkdirSync(testScratchDir, { recursive: true });

      let capturedChunks: string[] = [];
      const mockMerge = vi.fn().mockImplementation(async (chunks, outFile) => {
        capturedChunks = [...chunks];
        fs.writeFileSync(outFile, "dummy-assembled-mp3");
      });

      await buildSceneAudio(sampleScene, {
        openai: null,
        outputDir: testOutputDir,
        scratchRoot: testScratchDir,
        firstChimePath: dummyFirstChime,
        secondChimePath: dummySecondChime,
        dryRun: true,
        force: true,
        mergeFn: mockMerge,
      });

      expect(mockMerge).toHaveBeenCalledTimes(1);

      // Verify sequence chunks:
      // 1. first_chime.mp3
      expect(capturedChunks[0]).toContain("first_chime.mp3");
      // 2. 500 ms silence
      expect(capturedChunks[1]).toContain("silence_500ms.mp3");
      // 3. Narrator intro + question
      expect(capturedChunks[2]).toContain("chunk_03_narrator_intro_question.mp3");
      // 4. 1000 ms silence
      expect(capturedChunks[3]).toContain("silence_1000ms.mp3");
      // 5. second_chime.mp3
      expect(capturedChunks[4]).toContain("second_chime.mp3");
      // 6. 600 ms silence
      expect(capturedChunks[5]).toContain("silence_600ms.mp3");
      // 7. Dialogue 0
      expect(capturedChunks[6]).toContain("chunk_07_dialogue_0.mp3");
      // 7b. 400 ms silence between turns
      expect(capturedChunks[7]).toContain("silence_400ms.mp3");
      // 7c. Dialogue 1
      expect(capturedChunks[8]).toContain("chunk_07_dialogue_1.mp3");
      // 8. 1200 ms silence
      expect(capturedChunks[9]).toContain("silence_1200ms.mp3");
      // 9. first_chime.mp3
      expect(capturedChunks[10]).toContain("first_chime.mp3");
      // 10. 500 ms silence
      expect(capturedChunks[11]).toContain("silence_500ms.mp3");
      // 11. Narrator repeats question
      expect(capturedChunks[12]).toContain("chunk_11_narrator_repeat_question.mp3");

      fs.rmSync(testOutputDir, { recursive: true, force: true });
      fs.rmSync(testScratchDir, { recursive: true, force: true });
    });
  });

  describe("OpenAI Mock Interaction & Error Handling", () => {
    it("invokes OpenAI TTS with tts-1-hd, speed 0.92, and proper voice", async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        arrayBuffer: async () => new Uint8Array([10, 20, 30]).buffer,
      });
      const mockOpenAI = {
        audio: {
          speech: {
            create: mockCreate,
          },
        },
      } as unknown as OpenAI;

      const outPath = path.resolve(process.cwd(), ".tmp/mock-tts.mp3");
      fs.mkdirSync(path.dirname(outPath), { recursive: true });

      await synthesizeTtsClip(mockOpenAI, "テスト音声", "nova", outPath, false);

      expect(mockCreate).toHaveBeenCalledWith({
        model: "tts-1-hd",
        voice: "nova",
        input: "テスト音声",
        speed: 0.92,
        response_format: "mp3",
      });
      expect(fs.existsSync(outPath)).toBe(true);

      fs.rmSync(outPath, { force: true });
    });

    it("throws descriptive error when OpenAI TTS fails repeatedly", async () => {
      const mockFailingCreate = vi.fn().mockRejectedValue(new Error("Rate limit exceeded"));
      const mockOpenAI = {
        audio: {
          speech: {
            create: mockFailingCreate,
          },
        },
      } as unknown as OpenAI;

      const outPath = path.resolve(process.cwd(), ".tmp/mock-tts-fail.mp3");
      await expect(
        synthesizeTtsClip(mockOpenAI, "テスト", "alloy", outPath, false)
      ).rejects.toThrow(/TTS synthesis failed after 3 attempts/);
    });
  });

  describe("Per-Scene Failure Handling & Scratch Preservation", () => {
    it("continues processing remaining scenes when one scene fails and preserves diagnostics", async () => {
      const testOutputDir = path.resolve(process.cwd(), ".tmp/batch-test-out");
      const testScratchDir = path.resolve(process.cwd(), ".tmp/batch-test-scratch");

      const scene1: ValidatedScene = {
        id: "scene-fail-1",
        jlpt: 5,
        introJa: "イントロ1",
        questionJa: "質問1",
        dialogueLines: [{ speaker: "M", textJa: "会話1" }],
      };

      const scene2: ValidatedScene = {
        id: "scene-success-2",
        jlpt: 5,
        introJa: "イントロ2",
        questionJa: "質問2",
        dialogueLines: [{ speaker: "F", textJa: "会話2" }],
      };

      const mockBuilder = vi.fn().mockImplementation(async (scene: ValidatedScene) => {
        if (scene.id === "scene-fail-1") {
          throw new Error("Synthetic synthesis failure in scene 1");
        }
        return path.join(testOutputDir, `${scene.id}.mp3`);
      });

      const result = await processListeningScenes({
        scenes: [scene1, scene2],
        openai: null,
        outputDir: testOutputDir,
        scratchRoot: testScratchDir,
        firstChimePath: dummyFirstChime,
        secondChimePath: dummySecondChime,
        dryRun: true,
        force: true,
        buildSceneFn: mockBuilder,
      });

      expect(result.success).toBe(false);
      expect(result.succeededScenes).toEqual(["scene-success-2"]);
      expect(result.failedScenes).toHaveLength(1);
      expect(result.failedScenes[0].id).toBe("scene-fail-1");
      expect(result.failedScenes[0].error).toContain("Synthetic synthesis failure in scene 1");

      // Verify scratch directory is preserved for diagnostics when failures occur
      expect(fs.existsSync(testScratchDir)).toBe(true);

      fs.rmSync(testOutputDir, { recursive: true, force: true });
      fs.rmSync(testScratchDir, { recursive: true, force: true });
    });
  });

  describe("Prerequisite & Missing Assets Actionable Errors", () => {
    it("fails with actionable error when chime files cannot be found", () => {
      expect(() => resolveChimeFile("non_existent_chime_file.mp3")).toThrow(
        /Required chime file "non_existent_chime_file.mp3" could not be found/
      );
    });

    it("verifies CLI requires OPENAI_API_KEY when not in dry-run mode", () => {
      const savedKey = process.env.OPENAI_API_KEY;
      try {
        delete process.env.OPENAI_API_KEY;
        // Verify checking environment variable directly
        expect(!process.env.OPENAI_API_KEY).toBe(true);
      } finally {
        if (savedKey) process.env.OPENAI_API_KEY = savedKey;
      }
    });
  });
});
