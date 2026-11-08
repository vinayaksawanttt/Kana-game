import fs from "node:fs";
import path from "node:path";
import type { InfoScannerDocument } from "../src/data/jlpt/infoScannerData";
import { FLYER_STORE_DOCUMENTS } from "./info_scanner_data/flyerStore";
import { MEMO_NOTICE_DOCUMENTS } from "./info_scanner_data/memoNotice";
import { PUBLIC_GUIDE_DOCUMENTS } from "./info_scanner_data/publicGuide";
import { SCHEDULE_TRANSPORT_DOCUMENTS } from "./info_scanner_data/scheduleTransport";
import { BUSINESS_EMAIL_DOCUMENTS } from "./info_scanner_data/businessEmail";
import { APPLICATION_FORM_DOCUMENTS } from "./info_scanner_data/applicationForm";

const OUT_FILE = path.join(process.cwd(), "public", "data", "v1", "jlpt", "info-scanner.json");

export function buildAndValidateInfoScannerData(): InfoScannerDocument[] {
  const documents: InfoScannerDocument[] = [
    ...FLYER_STORE_DOCUMENTS,
    ...MEMO_NOTICE_DOCUMENTS,
    ...PUBLIC_GUIDE_DOCUMENTS,
    ...SCHEDULE_TRANSPORT_DOCUMENTS,
    ...BUSINESS_EMAIL_DOCUMENTS,
    ...APPLICATION_FORM_DOCUMENTS,
  ];

  if (documents.length !== 36) {
    throw new Error(`Expected exactly 36 documents, found ${documents.length}`);
  }

  const categoryCounts: Record<string, number> = {};
  const levelCounts: Record<string, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
  const seenDocIds = new Set<string>();

  for (const doc of documents) {
    if (seenDocIds.has(doc.id)) {
      throw new Error(`Duplicate document id found: ${doc.id}`);
    }
    seenDocIds.add(doc.id);

    categoryCounts[doc.category] = (categoryCounts[doc.category] ?? 0) + 1;
    levelCounts[doc.level] = (levelCounts[doc.level] ?? 0) + 1;

    if (!doc.blocks || doc.blocks.length === 0) {
      throw new Error(`Document ${doc.id} has no blocks`);
    }

    const blockIds = new Set<string>();
    for (const b of doc.blocks) {
      if (!b.id) {
        throw new Error(`Document ${doc.id} has block with missing id`);
      }
      if (blockIds.has(b.id)) {
        throw new Error(`Document ${doc.id} has duplicate block id: ${b.id}`);
      }
      blockIds.add(b.id);
    }

    if (!doc.questions || doc.questions.length === 0) {
      throw new Error(`Document ${doc.id} has no questions`);
    }

    for (const q of doc.questions) {
      if (!q.options || q.options.length !== 4) {
        throw new Error(`Question ${q.id} in ${doc.id} does not have exactly 4 options`);
      }

      if (q.correctIndex < 0 || q.correctIndex > 3) {
        throw new Error(`Question ${q.id} in ${doc.id} has invalid correctIndex: ${q.correctIndex}`);
      }

      if (!q.evidenceBlockIds || q.evidenceBlockIds.length === 0) {
        throw new Error(`Question ${q.id} in ${doc.id} has empty evidenceBlockIds`);
      }

      for (const eid of q.evidenceBlockIds) {
        if (!blockIds.has(eid)) {
          throw new Error(
            `Question ${q.id} in ${doc.id} references non-existent evidenceBlockId: "${eid}"`
          );
        }
      }

      if (!q.clueQuoteJa || q.clueQuoteJa.trim() === "") {
        throw new Error(`Question ${q.id} in ${doc.id} is missing clueQuoteJa`);
      }
    }
  }

  // Ensure output directory exists
  const dir = path.dirname(OUT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(documents, null, 2), "utf-8");

  console.log(`✓ Validated and emitted ${documents.length} Info Scanner documents.`);
  console.log(`  Categories: ${JSON.stringify(categoryCounts)}`);
  console.log(`  Levels: ${JSON.stringify(levelCounts)}`);

  return documents;
}

if (process.argv[1]?.endsWith("build-info-scanner-data.ts") || process.argv[1]?.endsWith("build-info-scanner-data.js")) {
  buildAndValidateInfoScannerData();
}
