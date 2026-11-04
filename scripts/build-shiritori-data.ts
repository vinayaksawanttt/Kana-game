import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { extractEndKana, extractStartKana, katakanaToHiragana } from "../src/engine/shiritori";
import type { ShiritoriLevel, ShiritoriWord } from "../src/engine/shiritori";

interface RawVocabularyRow {
  id?: string;
  word?: string;
  reading?: string;
  romaji?: string;
  meanings?: string[];
  level?: string;
  pos?: string[];
}

const levels: Array<{ source: string; level: ShiritoriLevel }> = [
  { source: "n5", level: 5 },
  { source: "n4", level: 4 },
  { source: "n3", level: 3 },
  { source: "n2", level: 2 },
  { source: "n1", level: 1 },
];

async function main(): Promise<void> {
  const root = process.cwd();
  const deduped = new Map<string, ShiritoriWord>();

  for (const { source, level } of levels) {
    const file = resolve(root, `src/data/openjlpt/vocab/${source}.json`);
    const rows = JSON.parse(await readFile(file, "utf8")) as RawVocabularyRow[];
    for (const row of rows) {
      const word = row.word?.trim() ?? "";
      const reading = katakanaToHiragana(row.reading?.trim() ?? "").normalize("NFKC");
      const romaji = row.romaji?.trim() ?? "";
      const meaning = row.meanings?.find((item) => item.trim())?.trim() ?? "";
      if (!word || !reading || !romaji || !meaning || !row.pos?.some((part) => part === "n" || part.startsWith("n-"))) continue;
      if (!/^[\u3041-\u3096ー]+$/.test(reading)) continue;
      const startKana = extractStartKana(reading);
      const endKana = extractEndKana(reading);
      if (!startKana || !endKana) continue;
      const id = row.id?.trim() || `${word}:${reading}`;
      const key = `${word.normalize("NFKC")}\u0000${reading}`;
      if (!deduped.has(key)) {
        deduped.set(key, { id, word, kana: reading, romaji, meaning, jlpt: level, startKana, endKana });
      }
    }
  }

  const output = [...deduped.values()];
  const destination = resolve(root, "public/data/v1/shiritori/words.json");
  await mkdir(resolve(root, "public/data/v1/shiritori"), { recursive: true });
  await writeFile(destination, `${JSON.stringify(output)}\n`, "utf8");
  console.log(`Built Shiritori data: ${output.length} noun records -> public/data/v1/shiritori/words.json`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
