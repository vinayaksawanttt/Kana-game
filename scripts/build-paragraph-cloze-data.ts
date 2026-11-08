import fs from "node:fs";
import path from "node:path";
import type { ParagraphClozePassage } from "../src/data/jlpt/paragraphClozeData";

const OUT_FILE = path.join(process.cwd(), "public", "data", "v1", "jlpt", "paragraph-cloze.json");

export function validateAndEmitClozeData(): readonly ParagraphClozePassage[] {
  if (!fs.existsSync(OUT_FILE)) {
    throw new Error(`Data file not found at ${OUT_FILE}`);
  }

  const raw = fs.readFileSync(OUT_FILE, "utf-8");
  const passages: ParagraphClozePassage[] = JSON.parse(raw);

  if (!Array.isArray(passages) || passages.length < 30) {
    throw new Error(`Expected at least 30 passages, found ${passages.length}`);
  }

  let totalBlanks = 0;
  const levelCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const passage of passages) {
    levelCounts[passage.jlpt] = (levelCounts[passage.jlpt] ?? 0) + 1;
    totalBlanks += passage.blanks.length;

    if (passage.blanks.length < 4 || passage.blanks.length > 5) {
      throw new Error(`Passage ${passage.id} has ${passage.blanks.length} blanks; expected 4 or 5.`);
    }

    const blanksMap = new Map(passage.blanks.map((b) => [b.blankIndex, b]));
    const seenBlankIndexes = new Set<number>();

    for (const para of passage.paragraphs) {
      for (const sentence of para.sentences) {
        let reconstructed = "";
        for (const segment of sentence.segments) {
          if (segment.type === "text") {
            reconstructed += segment.textJa ?? "";
          } else if (segment.type === "blank") {
            if (segment.blankIndex === undefined) {
              throw new Error(`Segment in ${passage.id} has undefined blankIndex`);
            }
            seenBlankIndexes.add(segment.blankIndex);
            const blank = blanksMap.get(segment.blankIndex);
            if (!blank) {
              throw new Error(`Blank index ${segment.blankIndex} not found in ${passage.id}`);
            }
            const correctOpt = blank.options[blank.correctIndex];
            if (!correctOpt) {
              throw new Error(`Correct option not found for blank ${segment.blankIndex} in ${passage.id}`);
            }
            reconstructed += correctOpt.ja;
          }
        }

        if (reconstructed !== sentence.rawCompletedJa) {
          throw new Error(
            `Text reconstruction mismatch in ${passage.id} (sentence ${sentence.sentenceIndex}):\n` +
              `Expected: "${sentence.rawCompletedJa}"\n` +
              `Got:      "${reconstructed}"`
          );
        }
      }
    }

    if (seenBlankIndexes.size !== passage.blanks.length) {
      throw new Error(
        `Passage ${passage.id} has ${passage.blanks.length} blanks declared, but only ${seenBlankIndexes.size} appear in sentence segments.`
      );
    }
  }

  if (totalBlanks < 135) {
    throw new Error(`Expected at least 135 blanks across all passages, found ${totalBlanks}`);
  }

  console.log(`✓ Validated ${passages.length} Paragraph Cloze passages (${totalBlanks} total blanks).`);
  console.log(`  N5: ${levelCounts[5]} passages | N4: ${levelCounts[4]} passages | N3: ${levelCounts[3]} passages | N2: ${levelCounts[2]} passages | N1: ${levelCounts[1]} passages`);
  return passages;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  validateAndEmitClozeData();
}
