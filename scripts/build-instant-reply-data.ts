import fs from "node:fs";
import path from "node:path";
import kuromoji from "kuromoji";
import { DeepLClient } from "./lib/deepl-client";
import {
  RAW_INSTANT_REPLY_ITEMS,
  type TrapCategory,
} from "./data-instant-reply-source";

export interface InstantReplyOptionData {
  id: string; // "opt-1" | "opt-2" | "opt-3"
  ja: string;
  reading: string;
  furigana?: string;
  en: string;
  isCorrect: boolean;
  trapType?: TrapCategory;
  explanation: string;
}

export interface InstantReplyItem {
  id: string;
  jlpt: 5 | 4 | 3 | 2 | 1;
  situationContext: string;
  speakerRole: string;
  promptJa: string;
  promptReading: string;
  promptFurigana?: string;
  promptEn: string;
  options: [
    InstantReplyOptionData,
    InstantReplyOptionData,
    InstantReplyOptionData,
  ];
}

function hasKanji(text: string): boolean {
  return /[\u4E00-\u9FFF]/.test(text);
}

function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  );
}

function buildTokenizer(): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> {
  return new Promise((resolve, reject) => {
    kuromoji
      .builder({ dicPath: path.resolve(process.cwd(), "node_modules/kuromoji/dict") })
      .build((err, tokenizer) => {
        if (err) reject(err);
        else resolve(tokenizer);
      });
  });
}

function toReading(
  text: string,
  tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures>,
): string {
  const tokens = tokenizer.tokenize(text);
  return tokens
    .map((t) => {
      if (t.reading && t.reading !== "*") {
        return katakanaToHiragana(t.reading);
      }
      return katakanaToHiragana(t.surface_form);
    })
    .join("");
}

function toFurigana(
  text: string,
  tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures>,
): string {
  const tokens = tokenizer.tokenize(text);
  return tokens
    .map((t) => {
      const surface = t.surface_form;
      if (!hasKanji(surface) || !t.reading || t.reading === "*") {
        return surface;
      }
      const hira = katakanaToHiragana(t.reading);
      if (hira === surface) return surface;
      return `{${surface}|${hira}}`;
    })
    .join("");
}

async function main() {
  console.log("Building JLPT Game 3: Instant Reply Blitz (即時応答) dataset...");
  const tokenizer = await buildTokenizer();
  const deepl = new DeepLClient();

  const allSpokenTexts: string[] = [];
  for (const item of RAW_INSTANT_REPLY_ITEMS) {
    allSpokenTexts.push(item.promptJa.trim());
    for (const opt of item.options) {
      allSpokenTexts.push(opt.ja.trim());
    }
  }

  const { results: translations, stats } = await deepl.translateGroupedWithContext(
    [
      {
        context: "JLPT Listening Quick Response (即時応答) spoken dialogue",
        texts: allSpokenTexts,
      },
    ],
    { mode: "sentence" },
  );

  console.log(
    `DeepL stats: ${stats.cachedHits} cached hits, ${stats.translatedTexts} newly translated (${stats.translatedChars} chars).`,
  );

  const finalItems: InstantReplyItem[] = RAW_INSTANT_REPLY_ITEMS.map((raw) => {
    const promptJa = raw.promptJa.trim();
    const promptReading = toReading(promptJa, tokenizer);
    const promptFurigana = toFurigana(promptJa, tokenizer);
    const promptEn = translations.get(promptJa) || promptJa;

    const options = raw.options.map((opt, idx) => {
      const ja = opt.ja.trim();
      const reading = toReading(ja, tokenizer);
      const furigana = toFurigana(ja, tokenizer);
      const en = translations.get(ja) || ja;
      const optionRecord: InstantReplyOptionData = {
        id: `opt-${idx + 1}`,
        ja,
        reading,
        furigana,
        en,
        isCorrect: opt.isCorrect,
        ...(opt.trapType ? { trapType: opt.trapType } : {}),
        explanation: opt.explanation,
      };
      return optionRecord;
    }) as [
      InstantReplyOptionData,
      InstantReplyOptionData,
      InstantReplyOptionData,
    ];

    const correctCount = options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      throw new Error(`Item ${raw.id} must have exactly 1 correct option, got ${correctCount}`);
    }

    return {
      id: raw.id,
      jlpt: raw.jlpt,
      situationContext: raw.situationContext,
      speakerRole: raw.speakerRole,
      promptJa,
      promptReading,
      promptFurigana,
      promptEn,
      options,
    };
  });

  const counts = {
    N5: finalItems.filter((i) => i.jlpt === 5).length,
    N4: finalItems.filter((i) => i.jlpt === 4).length,
    N3: finalItems.filter((i) => i.jlpt === 3).length,
    N2: finalItems.filter((i) => i.jlpt === 2).length,
    N1: finalItems.filter((i) => i.jlpt === 1).length,
  };
  console.log("Built Instant Reply items:", finalItems.length, counts);

  const jsonDir = path.resolve(process.cwd(), "public/data/v1/jlpt");
  fs.mkdirSync(jsonDir, { recursive: true });
  const jsonPath = path.join(jsonDir, "instant-reply.json");
  fs.writeFileSync(jsonPath, JSON.stringify(finalItems, null, 2) + "\n", "utf8");

  const tsDir = path.resolve(process.cwd(), "src/data/jlpt");
  fs.mkdirSync(tsDir, { recursive: true });
  const tsPath = path.join(tsDir, "instantReplyData.ts");

  const tsContent = `// Auto-generated by scripts/build-instant-reply-data.ts
// Contains ${finalItems.length} JLPT N5-N1 Instant Reply Blitz (即時応答 — Listening Mondai 4/5) conversational triads.

export type TrapCategory =
  | "keigo-mismatch"
  | "homophone-trap"
  | "register-mismatch"
  | "wrong-intent"
  | "grammar-tense-trap";

export interface InstantReplyOptionData {
  id: string;
  ja: string;
  reading: string;
  furigana?: string;
  en: string;
  isCorrect: boolean;
  trapType?: TrapCategory;
  explanation: string;
}

export interface InstantReplyItem {
  id: string;
  jlpt: 5 | 4 | 3 | 2 | 1;
  situationContext: string;
  speakerRole: string;
  promptJa: string;
  promptReading: string;
  promptFurigana?: string;
  promptEn: string;
  options: [
    InstantReplyOptionData,
    InstantReplyOptionData,
    InstantReplyOptionData,
  ];
}

export const INSTANT_REPLY_ITEMS: readonly InstantReplyItem[] = ${JSON.stringify(finalItems, null, 2)};
`;

  fs.writeFileSync(tsPath, tsContent, "utf8");
  console.log(`Wrote ${jsonPath} and ${tsPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
