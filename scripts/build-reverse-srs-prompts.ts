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
  modernMeaning?: string;
  reversePrompt?: string;
  synonyms?: string[];
  examples?: unknown[];
}

function normalizeEnglishGloss(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^(to|a|an|the)\s+/i, "")
    .replace(/\s*\([^)]*\)/g, "")
    .trim();
}

function isArchaicOrVerbose(meaning: string): boolean {
  const words = meaning.trim().split(/\s+/);
  if (words.length > 5) return true;
  return /\b(archaic|obsolete|esp\.|usu\.|e\.g\.|i\.e\.|wax wanton|disport|whence|thou|thee|whilst|used for|used with)\b/i.test(
    meaning
  );
}

const COMMON_DISAMBIGUATION_MAP: Record<string, string> = {
  // Meet
  会う: "to meet (planned / a friend)",
  出逢う: "to encounter (by chance / destiny)",
  迎える: "to welcome / go to meet (an arriving guest)",

  // See / Watch
  見る: "to see / look (general visual sight)",
  観る: "to watch (shows, films, sports, scenery)",
  診る: "to examine medically (doctor / clinic)",

  // Hear / Listen
  聞く: "to hear / listen (or ask a question)",
  聴く: "to listen attentively (to music or a speech)",

  // Fix / Cure
  直す: "to repair / correct (a broken item or mistake)",
  治す: "to cure / heal (an illness, wound, or condition)",

  // Fast / Early
  早い: "early (in time or schedule)",
  速い: "fast / swift (in speed or motion)",

  // Hot
  暑い: "hot (weather or climate)",
  熱い: "hot (to the touch / liquid temperature)",
  厚い: "thick (physical depth or board)",

  // Change
  変える: "to change / alter (transitive)",
  変わる: "to change / transform (intransitive)",
  両替: "money exchange (currency)",
  変更: "modification / change (formal schedule/plan)",

  // Make
  作る: "to make / cook (general or small objects)",
  造る: "to manufacture / brew / construct (large objects)",
  創る: "to create (original art, pioneer)",

  // Rise / Climb
  上る: "to go up / ascend (stairs or slope)",
  登る: "to climb (a mountain or ladder)",
  昇る: "to rise (the sun, sky, rank)",

  // Take
  取る: "to take (with hands / hold)",
  撮る: "to photograph / film (camera)",
  採る: "to pick (flowers) or adopt/hire",
  捕る: "to catch (fish / animals)",

  // Wear
  着る: "to wear (upper body / from shoulders down)",
  履く: "to put on (shoes, pants, lower body)",
  被る: "to wear (on the head / hat)",
  はめる: "to put on (gloves, ring)",

  // Open / Close
  開ける: "to open (transitive - door, window)",
  開く: "to open (intransitive - flowers, event)",
  閉める: "to close / shut (transitive)",
  閉まる: "to close / shut (intransitive)",
};

async function main(): Promise<void> {
  const isDryRun = process.argv.includes("--dry-run");
  const root = process.cwd();
  const levels = ["N5", "N4", "N3", "N2", "N1"];
  const client = new DeepLClient();
  await client.loadCache();

  let verboseGlossCount = 0;
  let simplifiedCount = 0;
  let collisionPromptCount = 0;
  let uniquePromptCount = 0;
  let uncachedChars = 0;

  console.log("Starting Archaic Gloss Cleanup & Reverse SRS Prompt Disambiguation...");

  const allEntriesByLevel: Record<string, VocabEntry[]> = {};
  const entriesByNormalizedEnglish = new Map<string, VocabEntry[]>();

  // 1. Load all vocabulary and group by normalized English gloss
  for (const lvl of levels) {
    const p = resolve(root, `public/data/v1/vocabulary/${lvl}.json`);
    const raw = await readFile(p, "utf8");
    const entries = JSON.parse(raw) as VocabEntry[];
    allEntriesByLevel[lvl] = entries;

    for (const entry of entries) {
      for (const m of entry.meanings || []) {
        const norm = normalizeEnglishGloss(m);
        if (norm && norm.length > 2) {
          if (!entriesByNormalizedEnglish.has(norm)) {
            entriesByNormalizedEnglish.set(norm, []);
          }
          entriesByNormalizedEnglish.get(norm)!.push(entry);
        }
      }
    }
  }

  // 2. Scan and modernize verbose/archaic glosses
  const wordsToSimplify: VocabEntry[] = [];
  for (const lvl of levels) {
    for (const entry of allEntriesByLevel[lvl]!) {
      if (entry.meanings?.some(isArchaicOrVerbose)) {
        verboseGlossCount += 1;
        const cacheKey = `ja->en:modern-gloss:${entry.word.trim()}`;
        if (!client.getCached(entry.word.trim(), "gloss")) {
          uncachedChars += [...entry.word].length;
        }
        wordsToSimplify.push(entry);
      }
    }
  }

  console.log(`Detected ${verboseGlossCount} verbose/archaic glosses to modernize.`);

  // 3. Process simplifications
  if (!isDryRun) {
    for (const entry of wordsToSimplify) {
      const modern = await client.simplifyGloss(entry.word, entry.reading, entry.meanings);
      if (modern && modern !== entry.meanings[0]) {
        entry.modernMeaning = modern;
        if (!entry.synonyms) entry.synonyms = [];
        if (!entry.synonyms.includes(modern)) {
          entry.synonyms.unshift(modern);
        }
        simplifiedCount += 1;
      }
    }
  }

  // 4. Assign disambiguated reverse prompts
  for (const lvl of levels) {
    for (const entry of allEntriesByLevel[lvl]!) {
      // Check curated high-priority disambiguation map first
      if (COMMON_DISAMBIGUATION_MAP[entry.word]) {
        entry.reversePrompt = COMMON_DISAMBIGUATION_MAP[entry.word];
        collisionPromptCount += 1;
        continue;
      }

      const primaryGloss = entry.modernMeaning || entry.meanings[0] || entry.word;
      const norm = normalizeEnglishGloss(primaryGloss);
      const group = entriesByNormalizedEnglish.get(norm) || [];
      const distinctWords = new Set(group.map((e) => e.word));

      if (distinctWords.size > 1) {
        // Collision exists: add parenthetical disambiguation hint
        collisionPromptCount += 1;
        let hint = "";
        const pos = entry.pos || [];
        if (pos.includes("vt")) hint = "transitive";
        else if (pos.includes("vi")) hint = "intransitive";
        else if (pos.includes("adj-i")) hint = "い-adjective";
        else if (pos.includes("adj-na")) hint = "な-adjective";
        else if (pos.includes("n")) hint = "noun";

        // If secondary meaning provides context (e.g. "early (morning)"), use that
        if (entry.meanings.length > 1) {
          const secondary = entry.meanings[1]!.replace(/\s*\([^)]*\)/g, "").trim();
          if (secondary && secondary.length < 20) {
            hint = hint ? `${hint}; ${secondary}` : secondary;
          }
        }

        entry.reversePrompt = hint ? `${primaryGloss} (${hint})` : primaryGloss;
      } else {
        // Unique prompt
        uniquePromptCount += 1;
        entry.reversePrompt = primaryGloss;
      }
    }
  }

  console.log(`\n=== Reverse SRS & Modern Gloss Summary ===`);
  console.log(`Verbose glosses identified : ${verboseGlossCount}`);
  console.log(`Uncached characters needed  : ${uncachedChars}`);
  console.log(`Collision reverse prompts   : ${collisionPromptCount}`);
  console.log(`Unique reverse prompts      : ${uniquePromptCount}`);

  if (isDryRun) {
    console.log("\n[DRY RUN complete - no files modified]");
    return;
  }

  // Save updated vocabulary files
  for (const lvl of levels) {
    const publicPath = resolve(root, `public/data/v1/vocabulary/${lvl}.json`);
    const openJlptPath = resolve(root, `src/data/openjlpt/vocab/${lvl.toLowerCase()}.json`);
    const entries = allEntriesByLevel[lvl]!;
    await writeFile(publicPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
    await writeFile(openJlptPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
    console.log(`  [${lvl}] Saved ${entries.length} vocabulary items with reversePrompt.`);
  }

  console.log("\nSuccessfully completed Phase 1 vocabulary modernizations and reverse prompts!");
}

void main().catch((err: unknown) => {
  console.error("Failed to build reverse SRS prompts:", err);
  process.exitCode = 1;
});

