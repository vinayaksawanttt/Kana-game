import { describe, expect, it } from "vitest";
import {
  createListeningSession,
  listeningReducer,
  summarizeListeningSession,
  extractListeningSentences,
  type ListeningPoolData,
  type ListeningSettings,
} from "../listening";
import type { VocabularyRecord } from "@/data/vocabulary";

function createSeededRng(seed = 42): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const mockVocab: VocabularyRecord[] = [
  {
    id: "v-1",
    word: "学校",
    reading: "がっこう",
    romaji: "gakkou",
    meanings: ["school"],
    modernMeaning: "school",
    level: "N5",
    pos: ["noun"],
    synonyms: ["academy"],
    examples: [
      {
        ja: "毎日学校へ行きます。",
        furigana: "毎日[まいにち]学校[がっこう]へ行[い]きます。",
        en: "I go to school every day.",
      },
    ],
  },
  {
    id: "v-2",
    word: "先生",
    reading: "せんせい",
    romaji: "sensei",
    meanings: ["teacher", "instructor"],
    modernMeaning: "teacher",
    level: "N5",
    pos: ["noun"],
    examples: [
      {
        ja: "田中先生はとても優しいです。",
        furigana: "田中[たなか]先生[せんせい]はとても優[やさ]しいです。",
        en: "Mr. Tanaka is very kind.",
      },
    ],
  },
  {
    id: "v-3",
    word: "水",
    reading: "みず",
    romaji: "mizu",
    meanings: ["water"],
    modernMeaning: "water",
    level: "N5",
    pos: ["noun"],
    examples: [
      {
        ja: "冷たい水を飲みました。",
        furigana: "冷[つめ]たい水[みず]を飲[の]みました。",
        en: "I drank cold water.",
      },
    ],
  },
  {
    id: "v-4",
    word: "電車",
    reading: "でんしゃ",
    romaji: "densha",
    meanings: ["train", "electric train"],
    modernMeaning: "train",
    level: "N5",
    pos: ["noun"],
    examples: [
      {
        ja: "電車で東京へ行きます。",
        furigana: "電車[でんしゃ]で東京[とうきょう]へ行[い]きます。",
        en: "I go to Tokyo by train.",
      },
    ],
  },
  {
    id: "v-5",
    word: "友達",
    reading: "ともだち",
    romaji: "tomodachi",
    meanings: ["friend", "companion"],
    modernMeaning: "friend",
    level: "N5",
    pos: ["noun"],
    examples: [
      {
        ja: "友達と一緒に映画を見ました。",
        furigana: "友達[ともだち]と一緒[いっしょ]に映画[えいが]を見[み]ました。",
        en: "I watched a movie with my friend.",
      },
    ],
  },
];

const mockPool: ListeningPoolData = {
  vocabulary: mockVocab,
  sentences: extractListeningSentences(mockVocab),
};

describe("Listening Quiz Engine", () => {
  it("creates deterministic sessions with a seeded rng across kana, vocabulary, and sentences", () => {
    const kanaSettings: ListeningSettings = {
      subMode: "kana",
      answerFormat: "multiple-choice",
      levels: [5],
      kanaScript: "hiragana",
      kanaGroups: ["basic", "dakuten", "yoon"],
      size: 10,
    };

    const s1 = createListeningSession(mockPool, kanaSettings, createSeededRng(101), "sess-1", 1000);
    const s2 = createListeningSession(mockPool, kanaSettings, createSeededRng(101), "sess-1", 1000);
    expect(s1).toEqual(s2);
    expect(s1.questions).toHaveLength(10);

    const vocabSettings: ListeningSettings = {
      subMode: "vocabulary",
      answerFormat: "multiple-choice",
      levels: [5],
      size: 10,
    };
    const v1 = createListeningSession(mockPool, vocabSettings, createSeededRng(202), "sess-2", 1000);
    const v2 = createListeningSession(mockPool, vocabSettings, createSeededRng(202), "sess-2", 1000);
    expect(v1).toEqual(v2);
    expect(v1.questions).toHaveLength(5);

    const sentSettings: ListeningSettings = {
      subMode: "sentences",
      answerFormat: "multiple-choice",
      levels: [5],
      size: 10,
    };
    const st1 = createListeningSession(mockPool, sentSettings, createSeededRng(303), "sess-3", 1000);
    const st2 = createListeningSession(mockPool, sentSettings, createSeededRng(303), "sess-3", 1000);
    expect(st1).toEqual(st2);
    expect(st1.questions).toHaveLength(5);
  });

  it("ensures every multiple-choice question has 4 distinct, non-overlapping options including the correct answer", () => {
    for (const subMode of ["kana", "vocabulary", "sentences"] as const) {
      const session = createListeningSession(
        mockPool,
        {
          subMode,
          answerFormat: "multiple-choice",
          levels: [5],
          kanaScript: "both",
          kanaGroups: ["basic", "dakuten"],
          size: 10,
        },
        createSeededRng(777)
      );

      for (const q of session.questions) {
        expect(q.options).toHaveLength(4);
        const ids = new Set(q.options.map((o) => o.id));
        const labels = new Set(q.options.map((o) => o.label.toLowerCase()));
        expect(ids.size).toBe(4);
        expect(labels.size).toBe(4);
        expect(ids.has(q.id)).toBe(true);
      }
    }
  });

  it("handles SUBMIT_CHOICE, INCREMENT_REPLAY, SKIP, NEXT (with stale forIndex guard), and END in listeningReducer", () => {
    const session = createListeningSession(
      mockPool,
      {
        subMode: "vocabulary",
        answerFormat: "multiple-choice",
        levels: [5],
        size: 10,
      },
      createSeededRng(99)
    );

    const q0 = session.questions[0];
    const wrongOption = q0.options.find((o) => o.id !== q0.id)!;

    // Replay increments counter
    let state = listeningReducer(session, { type: "INCREMENT_REPLAY" });
    expect(state.questions[0].replaysUsed).toBe(1);

    // Wrong choice locks question0 as wrong
    state = listeningReducer(state, {
      type: "SUBMIT_CHOICE",
      optionId: wrongOption.id,
      timeMs: 1200,
    });
    expect(state.questions[0].status).toBe("wrong");
    expect(state.questions[0].mistakes).toBe(1);
    expect(state.questions[0].userAnswer).toBe(wrongOption.label);

    // Advance to question 1; verify stale forIndex=0 is ignored
    state = listeningReducer(state, { type: "NEXT", forIndex: 0 });
    expect(state.index).toBe(1);
    state = listeningReducer(state, { type: "NEXT", forIndex: 0 });
    expect(state.index).toBe(1);

    // Correct choice on question 1
    const q1 = state.questions[1];
    state = listeningReducer(state, {
      type: "SUBMIT_CHOICE",
      optionId: q1.id,
      timeMs: 850,
    });
    expect(state.questions[1].status).toBe("correct");
    expect(state.questions[1].mistakes).toBe(0);

    // Advance to question 2 and SKIP
    state = listeningReducer(state, { type: "NEXT", forIndex: 1 });
    expect(state.index).toBe(2);
    state = listeningReducer(state, { type: "SKIP", timeMs: 500 });
    expect(state.questions[2].status).toBe("skipped");

    // END converts remaining pending questions to skipped and preserves invariants
    state = listeningReducer(state, { type: "END", endedAt: 5000 });
    expect(state.endedEarly).toBe(true);

    const summary = summarizeListeningSession(state);
    expect(summary.correct + summary.wrong + summary.skipped).toBe(summary.total);
    expect(summary.correct).toBe(1);
    expect(summary.wrong).toBe(1);
    expect(summary.skipped).toBe(summary.total - 2);
  });

  it("validates romaji variants in kana typing mode and synonyms in vocabulary typing mode", () => {
    // Kana typing test with 'し' (accepts both 'shi' and 'si')
    const kanaSession = createListeningSession(
      {
        kana: [
          {
            id: "hiragana-し",
            char: "し",
            script: "hiragana",
            group: "basic",
            row: "s",
            romaji: ["shi", "si"],
          },
          {
            id: "hiragana-ち",
            char: "ち",
            script: "hiragana",
            group: "basic",
            row: "t",
            romaji: ["chi", "ti"],
          },
          {
            id: "hiragana-つ",
            char: "つ",
            script: "hiragana",
            group: "basic",
            row: "t",
            romaji: ["tsu", "tu"],
          },
          {
            id: "hiragana-ふ",
            char: "ふ",
            script: "hiragana",
            group: "basic",
            row: "h",
            romaji: ["fu", "hu"],
          },
        ],
      },
      {
        subMode: "kana",
        answerFormat: "typing",
        levels: [5],
        kanaScript: "hiragana",
        kanaGroups: ["basic"],
        size: 10,
      },
      () => 0
    );

    const firstKana = kanaSession.questions[0];
    const variant = firstKana.acceptedAnswers[1]; // e.g. 'si' or 'ti'
    const afterKanaTyped = listeningReducer(kanaSession, {
      type: "SUBMIT_TYPED",
      input: variant.toUpperCase(),
      timeMs: 900,
    });
    expect(afterKanaTyped.questions[0].status).toBe("correct");

    // Vocabulary typing test with synonym
    const vocabSession = createListeningSession(
      mockPool,
      {
        subMode: "vocabulary",
        answerFormat: "typing",
        levels: [5],
        size: 10,
        questionIds: ["v-2"], // 先生: teacher / instructor
      },
      () => 0
    );

    const afterVocabTyped = listeningReducer(vocabSession, {
      type: "SUBMIT_TYPED",
      input: "instructor",
      timeMs: 1100,
    });
    expect(afterVocabTyped.questions[0].status).toBe("correct");
  });

  it("attaches static neural audioSrc to curated vocabulary sentences and filters out unvoiced sentences when neural clips exist", () => {
    const mixedVocab: VocabularyRecord[] = [
      {
        id: "ada066edfd",
        word: "会う",
        reading: "あう",
        romaji: "au",
        meanings: ["to meet"],
        level: "N5",
        pos: ["v5u"],
        examples: [
          {
            ja: "もうスミスさんに会われましたね。",
            furigana: "もうスミスさんに{会|あ}われましたね。",
            en: "You have already met Mr. Smith, haven't you?",
          },
        ],
      },
      ...mockVocab,
    ];

    const extracted = extractListeningSentences(mixedVocab);
    expect(extracted).toHaveLength(1);
    expect(extracted[0].id).toBe("vocab-sent:ada066edfd:0");
    expect(extracted[0].audioSrc).toBe("/audio/listening/N5/ada066edfd_0.opus");
    expect(extracted[0].reading).toBe("もうスミスさんにあわれましたね。");
  });

  it("prioritizes distractors that share character names and story context", () => {
    const storySentences = [
      {
        id: "story:princess-hase:13",
        ja: "長谷は毎日、一人で静かに本を読んでいました。",
        reading: "はせはまいにち、ひとりでしずかにほんをよんでいました。",
        en: "Hase spent every day reading books quietly by himself.",
        jlpt: 5 as const,
      },
      {
        id: "story:princess-hase:3",
        ja: "名前は長谷です。",
        reading: "なまえははせです。",
        en: "Her name was Hase.",
        jlpt: 5 as const,
      },
      {
        id: "story:princess-hase:4",
        ja: "長谷が五歳の時、お母さんは重い病気で死にました。",
        reading: "はせがごさいのとき、おかあさんはおもいびょうきでしにました。",
        en: "When Hase was five years old, her mother died of a serious illness.",
        jlpt: 5 as const,
      },
      {
        id: "story:princess-hase:6",
        ja: "新しいお母さんは、長谷が全然好きではありませんでした。",
        reading: "あたらしいおかあさんは、はせがぜんぜんすきではありませんでした。",
        en: "Her new mother did not like Hase at all.",
        jlpt: 5 as const,
      },
      {
        id: "story:urashima-taro:1",
        ja: "太郎の家も両親もいませんでした。",
        reading: "たろうのいえもりょうしんもいませんでした。",
        en: "Taro's house was gone, and his parents were gone too.",
        jlpt: 5 as const,
      },
      {
        id: "vocab-sent:test:1",
        ja: "田中さんは顔を洗って、白いシャツを着ます。",
        reading: "たなかさんはかおをあらって、しろいしゃつをきます。",
        en: "Mr. Tanaka washes his face and puts on a white shirt.",
        jlpt: 5 as const,
      },
    ];

    const session = createListeningSession(
      { sentences: storySentences },
      {
        subMode: "sentences",
        answerFormat: "multiple-choice",
        sentenceLanguage: "en",
        levels: [5],
        size: 10,
        questionIds: ["story:princess-hase:13"],
      },
      () => 0.1
    );

    const q = session.questions[0];
    expect(q.options).toHaveLength(4);
    // All 4 options should mention Hase because there are 3 same-character candidates from the story
    const haseCount = q.options.filter((o) => o.label.includes("Hase")).length;
    expect(haseCount).toBe(4);
  });

  it("supports Japanese options when sentenceLanguage is set to 'ja'", () => {
    const storySentences = [
      {
        id: "story:princess-hase:13",
        ja: "長谷は毎日、一人で静かに本を読んでいました。",
        reading: "はせはまいにち、ひとりでしずかにほんをよんでいました。",
        en: "Hase spent every day reading books quietly by himself.",
        jlpt: 5 as const,
      },
      {
        id: "story:princess-hase:3",
        ja: "名前は長谷です。",
        reading: "なまえははせです。",
        en: "Her name was Hase.",
        jlpt: 5 as const,
      },
      {
        id: "story:princess-hase:4",
        ja: "長谷が五歳の時、お母さんは重い病気で死にました。",
        reading: "はせがごさいのとき、おかあさんはおもいびょうきでしにました。",
        en: "When Hase was five years old, her mother died of a serious illness.",
        jlpt: 5 as const,
      },
      {
        id: "story:princess-hase:6",
        ja: "新しいお母さんは、長谷が全然好きではありませんでした。",
        reading: "あたらしいおかあさんは、はせがぜんぜんすきではありませんでした。",
        en: "Her new mother did not like Hase at all.",
        jlpt: 5 as const,
      },
    ];

    const session = createListeningSession(
      { sentences: storySentences },
      {
        subMode: "sentences",
        answerFormat: "multiple-choice",
        sentenceLanguage: "ja",
        levels: [5],
        size: 10,
        questionIds: ["story:princess-hase:13"],
      },
      () => 0.1
    );

    const q = session.questions[0];
    const targetOpt = q.options.find((o) => o.id === "story:princess-hase:13")!;
    expect(targetOpt.label).toBe("長谷は毎日、一人で静かに本を読んでいました。");
    expect(targetOpt.subLabel).toBe("Hase spent every day reading books quietly by himself.");
  });
});
