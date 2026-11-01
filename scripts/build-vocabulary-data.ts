import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

async function main(): Promise<void> {
  const root = process.cwd();
  const srcVocab = resolve(root, "src/data/openjlpt/vocab");
  const srcKanji = resolve(root, "src/data/openjlpt/kanji");
  const destVocab = resolve(root, "public/data/v1/vocabulary");
  const destKanji = resolve(root, "public/data/v1/vocabulary/kanji");

  await mkdir(destVocab, { recursive: true });
  await mkdir(destKanji, { recursive: true });

  const levels = ["n5", "n4", "n3", "n2", "n1"];
  for (const lvl of levels) {
    const upper = lvl.toUpperCase();
    await copyFile(resolve(srcVocab, `${lvl}.json`), resolve(destVocab, `${upper}.json`));
    await copyFile(resolve(srcKanji, `${lvl}.json`), resolve(destKanji, `${upper}.json`));
  }
  console.log("Successfully copied OpenJLPT vocabulary and kanji to public/data/v1/vocabulary/");
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});

