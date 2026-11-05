import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DeepLClient } from "./lib/deepl-client";

interface VocabEntry {
  id: string;
  word: string;
  reading: string;
  romaji: string;
  meanings: string[];
  level: string;
  pos?: string[];
  jmdict_id?: number;
  synonyms?: string[];
  examples?: unknown[];
}

const COMMON_SYNONYMS_MAP: Record<string, string[]> = {
  // Common verbs
  "to meet": ["meet", "encounter", "see", "greet"],
  "to eat": ["eat", "consume", "have a meal", "dine"],
  "to drink": ["drink", "beverage", "swallow", "sip"],
  "to see": ["see", "look", "watch", "view", "observe"],
  "to hear": ["hear", "listen", "catch sounds", "perceive sound"],
  "to listen": ["listen", "hear", "pay attention", "heed"],
  "to speak": ["speak", "talk", "say", "converse", "tell"],
  "to talk": ["talk", "speak", "chat", "converse"],
  "to write": ["write", "compose", "inscribe", "pen"],
  "to read": ["read", "peruse", "examine"],
  "to buy": ["buy", "purchase", "acquire", "shop for"],
  "to sell": ["sell", "vend", "market", "trade"],
  "to go": ["go", "travel", "proceed", "head to", "depart"],
  "to come": ["come", "arrive", "approach"],
  "to return": ["return", "go back", "come back", "head home"],
  "to run": ["run", "jog", "sprint", "dash"],
  "to walk": ["walk", "stroll", "pace", "step"],
  "to sleep": ["sleep", "rest", "slumber", "nap", "fall asleep"],
  "to wake up": ["wake up", "awaken", "get up", "rise"],
  "to start": ["start", "begin", "commence", "initiate", "set off"],
  "to begin": ["begin", "start", "commence", "open"],
  "to finish": ["finish", "end", "complete", "conclude", "wrap up"],
  "to end": ["end", "finish", "conclude", "terminate"],
  "to learn": ["learn", "study", "acquire knowledge", "master"],
  "to study": ["study", "learn", "examine", "cram"],
  "to teach": ["teach", "instruct", "educate", "guide"],
  "to wait": ["wait", "await", "hold on", "stand by"],
  "to stand": ["stand", "rise", "stand up"],
  "to sit": ["sit", "sit down", "take a seat", "be seated"],
  "to enter": ["enter", "go in", "come in", "step into"],
  "to exit": ["exit", "leave", "go out", "depart"],
  "to make": ["make", "create", "produce", "build", "craft"],
  "to do": ["do", "perform", "execute", "carry out"],
  "to give": ["give", "present", "hand over", "provide"],
  "to receive": ["receive", "get", "accept", "take"],
  "to take": ["take", "grab", "hold", "pick up"],
  "to use": ["use", "utilize", "apply", "employ"],
  "to help": ["help", "assist", "aid", "support"],
  "to know": ["know", "understand", "be aware", "recognize"],
  "to understand": ["understand", "comprehend", "grasp", "realize", "get"],

  // Adjectives
  big: ["large", "huge", "great", "giant", "vast"],
  large: ["big", "huge", "great", "immense", "vast"],
  small: ["little", "tiny", "mini", "compact"],
  little: ["small", "tiny", "slight"],
  quick: ["fast", "rapid", "swift", "speedy", "brisk"],
  fast: ["quick", "rapid", "swift", "speedy"],
  slow: ["sluggish", "unhurried", "leisurely", "delayed"],
  good: ["nice", "fine", "excellent", "pleasant", "great"],
  bad: ["poor", "terrible", "awful", "unfavorable"],
  new: ["fresh", "recent", "modern", "novel"],
  old: ["aged", "ancient", "antique", "former"],
  hot: ["warm", "scorching", "heated", "boiling"],
  cold: ["chilly", "cool", "freezing", "frigid"],
  high: ["tall", "elevated", "lofty", "steep"],
  expensive: ["costly", "pricey", "dear", "high-priced"],
  cheap: ["inexpensive", "affordable", "low-cost", "budget"],
  easy: ["simple", "effortless", "straightforward", "uncomplicated"],
  difficult: ["hard", "challenging", "tough", "arduous"],
  happy: ["glad", "joyful", "cheerful", "pleased", "content"],
  sad: ["sorrowful", "unhappy", "depressed", "gloomy"],
  strong: ["powerful", "mighty", "sturdy", "robust", "firm"],
  weak: ["frail", "feeble", "delicate", "faint"],

  // Nouns
  friend: ["companion", "buddy", "pal", "mate", "associate"],
  person: ["individual", "human", "someone", "party"],
  people: ["persons", "crowd", "public", "individuals"],
  house: ["home", "residence", "dwelling", "abode"],
  home: ["house", "residence", "household"],
  room: ["chamber", "space", "quarters"],
  school: ["academy", "institution", "college"],
  teacher: ["instructor", "educator", "tutor", "sensei", "master"],
  student: ["pupil", "learner", "scholar"],
  car: ["automobile", "vehicle", "motorcar", "auto"],
  book: ["volume", "tome", "publication", "text"],
  money: ["currency", "funds", "cash", "coins"],
  time: ["hour", "moment", "period", "occasion"],
  water: ["liquid", "aqua", "h2o"],
  food: ["meal", "fare", "cuisine", "nourishment", "edibles"],
};

export function expandSynonymsForMeaning(rawMeaning: string): string[] {
  const synonyms = new Set<string>();
  const lower = rawMeaning.toLowerCase().trim();

  // 1. Direct dictionary / concept map
  if (COMMON_SYNONYMS_MAP[lower]) {
    for (const syn of COMMON_SYNONYMS_MAP[lower]!) synonyms.add(syn);
  }

  // 2. Remove filler prefixes like "to ", "a ", "an ", "the "
  const stripped = lower.replace(/^(to|a|an|the)\s+/i, "").trim();
  if (stripped && stripped !== lower) {
    synonyms.add(stripped);
    if (COMMON_SYNONYMS_MAP[stripped]) {
      for (const syn of COMMON_SYNONYMS_MAP[stripped]!) synonyms.add(syn);
    }
  }

  // 3. Remove parenthetical descriptions, e.g. "to run (fast)" -> "run"
  const withoutParens = stripped.replace(/\s*\([^)]*\)/g, "").trim();
  if (withoutParens && withoutParens !== stripped) {
    synonyms.add(withoutParens);
    if (COMMON_SYNONYMS_MAP[withoutParens]) {
      for (const syn of COMMON_SYNONYMS_MAP[withoutParens]!) synonyms.add(syn);
    }
  }

  // 4. Split multi-part glosses like "stop, halt"
  for (const part of lower.split(/[,;/]+/)) {
    const p = part.trim().replace(/^(to|a|an|the)\s+/i, "");
    if (p && p.length > 1) {
      synonyms.add(p);
      if (COMMON_SYNONYMS_MAP[p]) {
        for (const s of COMMON_SYNONYMS_MAP[p]!) synonyms.add(s);
      }
    }
  }

  return [...synonyms];
}

async function main(): Promise<void> {
  const isDryRun = process.argv.includes("--dry-run");
  const root = process.cwd();
  const levels = ["N5", "N4", "N3", "N2", "N1"];
  const client = new DeepLClient();
  await client.loadCache();

  let totalWordsChecked = 0;
  let totalSynonymsAdded = 0;
  let wordsExpanded = 0;

  console.log("Starting Vocabulary Synonym Expansion Pipeline across N5-N1...");

  for (const lvl of levels) {
    const publicPath = resolve(root, `public/data/v1/vocabulary/${lvl}.json`);
    const openJlptPath = resolve(root, `src/data/openjlpt/vocab/${lvl.toLowerCase()}.json`);

    const raw = await readFile(publicPath, "utf8");
    const entries = JSON.parse(raw) as VocabEntry[];

    for (const entry of entries) {
      totalWordsChecked += 1;
      const meanings = entry.meanings ?? [];
      const synonymSet = new Set<string>(entry.synonyms ?? []);

      for (const m of meanings) {
        const expanded = expandSynonymsForMeaning(m);
        for (const syn of expanded) {
          const cleanSyn = syn.toLowerCase().trim();
          // Avoid duplicating an exact meaning in synonyms
          if (cleanSyn && !meanings.some((existing) => existing.toLowerCase().trim() === cleanSyn)) {
            synonymSet.add(cleanSyn);
          }
        }
      }

      if (synonymSet.size > 0) {
        entry.synonyms = [...synonymSet];
        totalSynonymsAdded += synonymSet.size;
        wordsExpanded += 1;
      }
    }

    if (!isDryRun) {
      await writeFile(publicPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
      await writeFile(openJlptPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
    }
    console.log(`  [${lvl}] processed ${entries.length} words`);
  }

  console.log(`\n=== Vocabulary Synonym Expansion Summary ===`);
  console.log(`Total words evaluated   : ${totalWordsChecked}`);
  console.log(`Words with expanded syn : ${wordsExpanded}`);
  console.log(`Total synonyms added    : ${totalSynonymsAdded}`);

  if (isDryRun) {
    console.log("\n[DRY RUN complete - no files modified]");
  } else {
    console.log(`\nSuccessfully updated vocabulary datasets with enriched synonyms!`);
  }
}

void main().catch((err: unknown) => {
  console.error("Vocabulary synonym expansion failed:", err);
  process.exitCode = 1;
});

