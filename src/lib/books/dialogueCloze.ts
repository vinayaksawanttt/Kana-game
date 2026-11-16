import { type BookDialogueLine, type BookGrammarItem, type BookLesson } from "@/data/books";

export interface DialogueClozeQuestion {
  id: string;
  sceneNumber: string;
  speakerJa: string;
  speaker: string;
  contextPrevLine?: BookDialogueLine;
  originalJa: string;
  maskedJa: string;
  en: string;
  correctAnswer: string;
  options: string[];
  grammarTag: string;
  grammarExplanation?: string;
}

interface ClozeRule {
  id: string;
  regex: RegExp;
  grammarTag: string;
  getDistractors: (match: string) => string[];
  explanation: string;
}

const CLOZE_RULES: ClozeRule[] = [
  // --- Honorific & Humble (Genki II L19-20) ---
  {
    id: "keigo-mairu",
    regex: /(参ります|まいります)/,
    grammarTag: "Humble (謙譲語)",
    getDistractors: () => ["いらっしゃいます", "おっしゃいます"],
    explanation: "Use humble 「参ります」 for your own going/coming when speaking to superiors.",
  },
  {
    id: "keigo-mousu",
    regex: /(申します|もうします)/,
    grammarTag: "Extra-Modest (謙譲語)",
    getDistractors: () => ["おっしゃいます", "なさいます"],
    explanation: "Use 「〜と申します」 as a humble/extra-modest way to state your name.",
  },
  {
    id: "keigo-irassharu",
    regex: /(いらっしゃいますか|いらっしゃいます|いらっしゃいました)/,
    grammarTag: "Honorific (尊敬語)",
    getDistractors: (m) =>
      m.endsWith("か")
        ? ["参りますか", "おりますか"]
        : m.endsWith("た")
        ? ["参りました", "おりました"]
        : ["参ります", "おります"],
    explanation: "Use honorific 「いらっしゃる」 for a superior's or guest's presence/going/coming.",
  },
  {
    id: "keigo-meshiagaru",
    regex: /(召し上がります|めしあがります)/,
    grammarTag: "Honorific (尊敬語)",
    getDistractors: () => ["いただきます", "食べます"],
    explanation: "Use honorific 「召し上がる」 when referring to a superior eating or drinking.",
  },

  // --- Causative / Passive / Causative-Passive (Genki II L21-23) ---
  {
    id: "causative-passive",
    regex: /([一-龠ぁ-んァ-ヶ]+(?:させられ|され)(?:ました|ます|る|た))/,
    grammarTag: "Causative-Passive (〜させられる)",
    getDistractors: (m) => [
      m.replace(/させられ|され/, "させ"),
      m.replace(/させられ|され/, ""),
    ],
    explanation: "Causative-passive expresses being made/forced to do something.",
  },

  // --- Potential Verbs (Genki II L13) ---
  {
    id: "potential-iku",
    regex: /(行ける|行けます)/,
    grammarTag: "Potential Form (〜られる / 〜える)",
    getDistractors: (m) =>
      m === "行ける"
        ? ["行かせる", "行かせて"]
        : ["行かせます", "行きます"],
    explanation: "Potential form of 行く (to go) is 行ける (can go).",
  },
  {
    id: "potential-kuru",
    regex: /(来られます|来られる|来られません)/,
    grammarTag: "Potential Form (〜られる)",
    getDistractors: (m) =>
      m === "来られます"
        ? ["来させます", "来ます"]
        : m === "来られる"
        ? ["来させる", "来る"]
        : ["来させません", "来ません"],
    explanation: "Potential form of 来る (to come) is 来られる / 来られます.",
  },
  {
    id: "potential-generic",
    regex: /(会える|使える|始められます|食べられます|飲めます|読めます|話せます|働けます)/,
    grammarTag: "Potential Form (〜られる / 〜える)",
    getDistractors: (m) => {
      if (m === "会える") return ["会う", "会わせる"];
      if (m === "使える") return ["使う", "使わせる"];
      if (m === "始められます") return ["始めさせます", "始めます"];
      if (m === "食べられます") return ["食べさせます", "食べます"];
      if (m === "飲めます") return ["飲ませます", "飲みます"];
      if (m === "読めます") return ["読ませます", "読みます"];
      if (m === "話せます") return ["話させます", "話します"];
      return ["働かせます", "働きます"];
    },
    explanation: "Potential verbs express ability or possibility ('can do').",
  },

  // --- Try doing / In advance / Regret (Genki II L13, 15, 18) ---
  {
    id: "te-miru",
    regex: /([一-龠ぁ-んァ-ヶ]+てみます|[一-龠ぁ-んァ-ヶ]+てみました|[一-龠ぁ-んァ-ヶ]+てみたい)/,
    grammarTag: "〜てみる (Try doing)",
    getDistractors: (m) => [
      m.replace(/てみ/, "ておき").replace(/てみます/, "ておきます").replace(/てみました/, "ておきました").replace(/てみたい/, "ておきたい"),
      m.replace(/てみ/, "てしまい").replace(/てみます/, "てしまいます").replace(/てみました/, "てしまいました").replace(/てみたい/, "てしまいたい"),
    ],
    explanation: "「〜てみる」 means 'to try doing something to see what it's like'.",
  },
  {
    id: "te-oku",
    regex: /([一-龠ぁ-んァ-ヶ]+ておきます|[一-龠ぁ-んァ-ヶ]+ておきました|[一-龠ぁ-んァ-ヶ]+ておく)/,
    grammarTag: "〜ておく (Do in advance)",
    getDistractors: (m) => [
      m.replace(/ておく|ておき/, "てみ"),
      m.replace(/ておく|ておき/, "てしまい"),
    ],
    explanation: "「〜ておく」 expresses doing something in advance in preparation for the future.",
  },
  {
    id: "te-shimau",
    regex: /([一-龠ぁ-んァ-ヶ]+てしまいました|[一-龠ぁ-んァ-ヶ]+てしまいます|[一-龠ぁ-んァ-ヶ]+ちゃった)/,
    grammarTag: "〜てしまう (Completion / Regret)",
    getDistractors: (m) =>
      m.endsWith("ちゃった")
        ? [m.replace(/ちゃった$/, "てみた"), m.replace(/ちゃった$/, "ておいた")]
        : [m.replace(/てしまい/, "てみ"), m.replace(/てしまい/, "ておき")],
    explanation: "「〜てしまう」 expresses complete action or regret/unintended outcome.",
  },

  // --- Looks like / Hearsay (Genki II L13, 17) ---
  {
    id: "sou-looks",
    regex: /(おいしそう|おもしろそう|たのしそう|難しそう|やさしそう|忙しそう)/,
    grammarTag: "〜そう (Looks like)",
    getDistractors: (m) => {
      const stem = m.replace(/そう$/, "");
      return [`${stem}いそう`, `${stem}くそう`];
    },
    explanation: "Drop the final 「い」 of an い-adjective before attaching 「〜そう」 ('looks like').",
  },

  // --- Conditionals: 〜なら / 〜たら (Genki II L13, 14, 17) ---
  {
    id: "cond-nara",
    regex: /(あしたなら|アルバイトなら|日本なら|土曜日なら)/,
    grammarTag: "〜なら (Contextual 'If')",
    getDistractors: (m) => {
      const base = m.replace(/なら$/, "");
      return [`${base}たら`, `${base}と`];
    },
    explanation: "「Noun + なら」 picks up on a topic from the conversation ('if it's [Noun]...').",
  },

  // --- Maybe / Should / Hope (Genki II L14, 16, 19) ---
  {
    id: "kamoshiremasen",
    regex: /(かもしれません|かもしれない)/,
    grammarTag: "〜かもしれません (Might / Maybe)",
    getDistractors: (m) =>
      m.endsWith("ん")
        ? ["はずです", "つもりです"]
        : ["はずだ", "つもりだ"],
    explanation: "「〜かもしれません」 expresses uncertainty ('maybe / might').",
  },
  {
    id: "te-itadakemasen-ka",
    regex: /(ていただけませんか|てくれませんか|てあげましょうか)/,
    grammarTag: "Polite Requests & Offers",
    getDistractors: (m) =>
      m === "ていただけませんか"
        ? ["てくれない", "てあげますか"]
        : m === "てくれませんか"
        ? ["てあげませんか", "てもらいますか"]
        : ["てくれますか", "てみませんか"],
    explanation: "Choose the appropriate giving/receiving request pattern based on social distance.",
  },

  // --- Genki I Core Grammar (Lessons 1–12) ---
  {
    id: "hou-ga-ii",
    regex: /(したほうがいい|行ったほうがいい|飲んだほうがいい|寝たほうがいい)/,
    grammarTag: "〜ほうがいいです (Advice)",
    getDistractors: (m) => [
      m.replace(/たほうがいい$/, "るほうがいい"),
      m.replace(/たほうがいい$/, "てほうがいい"),
    ],
    explanation: "Use the past short form (〜た) before 「ほうがいいです」 when giving positive advice.",
  },
  {
    id: "nakereba-ikemasen",
    regex: /(なければいけません|なきゃいけません)/,
    grammarTag: "〜なければいけません (Must)",
    getDistractors: () => ["てはいけません", "てもいいです"],
    explanation: "「〜なければいけません」 expresses obligation ('must / have to').",
  },
  {
    id: "ta-koto-ga-aru",
    regex: /(したことがあります|行ったことがあります|食べたことがあります|見たことがあります)/,
    grammarTag: "〜たことがあります (Past Experience)",
    getDistractors: (m) => [
      m.replace(/たことがあります$/, "ることがあります"),
      m.replace(/たことがあります$/, "ています"),
    ],
    explanation: "Use past short form + 「ことがあります」 to express having done something before.",
  },
  {
    id: "tai-desu",
    regex: /(行きたいです|食べたいです|見たいです|買いたいです|聞きたいです)/,
    grammarTag: "〜たいです (Want to do)",
    getDistractors: (m) => [
      m.replace(/たいです$/, "ます"),
      m.replace(/たいです$/, "ています"),
    ],
    explanation: "Attach 「〜たいです」 to the verb stem to express personal desire.",
  },
  {
    id: "te-imasu",
    regex: /(住んでいます|働いています|持っています|知っています|勉強しています)/,
    grammarTag: "〜ています (Ongoing State / Habit)",
    getDistractors: (m) => [
      m.replace(/ています$/, "ます"),
      m.replace(/ています$/, "ました"),
    ],
    explanation: "「〜ています」 describes ongoing actions, habits, or resulting states.",
  },
  {
    id: "te-mo-ii",
    regex: /(てもいいですか|てはいけません|てください)/,
    grammarTag: "〜てもいい / 〜てはいけません / 〜てください",
    getDistractors: (m) =>
      m === "てもいいですか"
        ? ["てはいけませんか", "てみますか"]
        : m === "てはいけません"
        ? ["てもいいです", "てみます"]
        : ["ていません", "てみます"],
    explanation: "Use the て-form with もいい (permission), はいけません (prohibition), or ください (request).",
  },
  {
    id: "mashou-ka",
    regex: /(ましょうか|ませんか)/,
    grammarTag: "Invitations & Offers (〜ませんか / 〜ましょうか)",
    getDistractors: (m) =>
      m === "ましょうか" ? ["ませんでしたか", "ますか"] : ["ましたか", "ません"],
    explanation: "Use 「〜ませんか」 for polite invitations and 「〜ましょうか」 for 'shall we / shall I'.",
  },
  {
    id: "arimasu-imasu",
    regex: /(ありますか|いますか|あります|います)/,
    grammarTag: "Existence (あります / います)",
    getDistractors: (m) =>
      m === "ありますか"
        ? ["いますか", "ですか"]
        : m === "いますか"
        ? ["ありますか", "ですか"]
        : m === "あります"
        ? ["います", "です"]
        : ["あります", "です"],
    explanation: "Use 「あります」 for inanimate objects/events and 「います」 for living beings.",
  },
  {
    id: "desu-copula",
    regex: /(じゃありません|じゃないです|でした)/,
    grammarTag: "Copula Inflection (です / じゃありません / でした)",
    getDistractors: (m) =>
      m === "でした"
        ? ["です", "じゃありません"]
        : ["です", "でした"],
    explanation: "Pay attention to affirmative, negative (じゃありません), and past (でした) forms of です.",
  },
  {
    id: "polite-masu",
    regex: /(食べます|飲みます|行きます|来ます|帰ります|見ます|読みます|起きます|寝ます)/,
    grammarTag: "Polite Verb Conjugation (〜ます)",
    getDistractors: (m) => [
      m.replace(/ます$/, "ません"),
      m.replace(/ます$/, "ました"),
    ],
    explanation: "Match the polite verb tense (present affirmative vs. negative vs. past) to the context.",
  },
  {
    id: "core-particles",
    regex: /(で|に|を|は)(?=[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]{2,})/,
    grammarTag: "Core Particle Usage",
    getDistractors: (m) => {
      if (m === "は") return ["を", "で"];
      if (m === "を") return ["で", "に"];
      if (m === "で") return ["を", "へ"];
      return ["を", "で"];
    },
    explanation: "Select the Japanese particle that marks the correct grammatical role in context.",
  },
];

function deterministicShuffle(items: string[], seedStr: string): string[] {
  const arr = [...items];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function findGrammarMatch(
  grammarList: BookGrammarItem[],
  tag: string
): BookGrammarItem | undefined {
  const lower = tag.toLowerCase();
  return grammarList.find(
    (g) =>
      lower.includes(g.title.toLowerCase()) ||
      g.title.toLowerCase().includes(lower.split(" ")[0]) ||
      (g.pattern && lower.includes(g.pattern.toLowerCase()))
  );
}

/**
 * Generates contextual grammar fill-in-the-blank (cloze) questions
 * directly from a lesson's authentic textbook dialogues.
 */
export function generateDialogueClozeQuestions(
  lesson: BookLesson,
  maxQuestions = 8
): DialogueClozeQuestion[] {
  const dialogues = lesson.dialogues || [];
  if (dialogues.length === 0) return [];

  const questions: DialogueClozeQuestion[] = [];
  const usedRuleIdsPerScene = new Map<string, Set<string>>();

  for (const scene of dialogues) {
    const usedRules = new Set<string>();
    usedRuleIdsPerScene.set(scene.id, usedRules);

    for (let idx = 0; idx < scene.lines.length; idx++) {
      if (questions.length >= maxQuestions) break;
      const line = scene.lines[idx];
      const prevLine = idx > 0 ? scene.lines[idx - 1] : undefined;

      // Skip ultra-short greetings unless needed
      if (line.ja.length < 6) continue;

      for (const rule of CLOZE_RULES) {
        if (usedRules.has(rule.id)) continue;
        const match = line.ja.match(rule.regex);
        if (!match || match.index === undefined) continue;

        const matchedText = match[1] || match[0];
        const distractors = rule
          .getDistractors(matchedText)
          .filter((d) => d !== matchedText);

        if (distractors.length < 2) continue;

        const maskedJa =
          line.ja.slice(0, match.index) +
          "_______" +
          line.ja.slice(match.index + matchedText.length);

        const qId = `cloze-l${lesson.lessonNumber}-${scene.id}-${idx}`;
        const options = deterministicShuffle(
          [matchedText, distractors[0], distractors[1]],
          qId
        );

        const matchedGrammar = findGrammarMatch(
          lesson.grammar,
          rule.grammarTag
        );

        questions.push({
          id: qId,
          sceneNumber: scene.sceneNumber,
          speakerJa: line.speakerJa,
          speaker: line.speaker,
          contextPrevLine: prevLine,
          originalJa: line.ja,
          maskedJa,
          en: line.en,
          correctAnswer: matchedText,
          options,
          grammarTag: matchedGrammar ? matchedGrammar.title : rule.grammarTag,
          grammarExplanation: matchedGrammar?.explanation || rule.explanation,
        });

        usedRules.add(rule.id);
        break;
      }
    }
  }

  return questions;
}
