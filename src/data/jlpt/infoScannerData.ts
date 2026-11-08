// Real-World Info Scanner & Noticeboard Detective (情報検索 スピード検索 — Official JLPT Reading Mondai 4–6)
// Architecture: Strict data -> engine -> hooks -> components separation.

import staticDocuments from "../../../public/data/v1/jlpt/info-scanner.json";

export type InfoScannerCategory =
  | "flyer-store" // チラシ・店舗広告 (Supermarket sales, coupon flyers, store hours)
  | "memo-notice" // 伝言メモ・社内連絡 (Desk memos, office notices, shift changes)
  | "public-guide" // 公共案内・施設利用 (Library rules, garbage collection, community center)
  | "schedule-transport" // 時刻表・日程表 (Bus/train timetables, event schedules, tour itineraries)
  | "business-email" // 業務連絡・お知らせメール (Inquiries, order confirmations, formal updates)
  | "application-form"; // 募集要項・申込案内 (Workshops, club recruitment, contest entry requirements)

export type InfoBlockType =
  | "header" // Title, subtitle, organization, or sender/recipient header
  | "paragraph" // Explanatory prose
  | "bullet-list" // List of conditions, requirements, or steps
  | "table" // Structured tabular matrix (e.g. product/price, date/location, fare/zone)
  | "footnote" // Important fine print or asterisk conditions (※, 注, 注意)
  | "notice-box"; // Highlighted callout box / alert banner

export interface InfoTableColumn {
  key: string;
  headerJa: string;
  headerEn?: string;
  align?: "left" | "center" | "right";
}

export interface InfoTableRow {
  id: string;
  cells: Record<string, string>; // mapping from column key to cell text
}

export interface InfoBlock {
  id: string; // Stable unique block ID, e.g. "b-head", "b-table", "b-note-1"
  type: InfoBlockType;
  titleJa?: string;
  titleEn?: string;
  contentJa?: string; // Text content for paragraph, header, or notice-box
  contentEn?: string;
  itemsJa?: string[]; // Array of strings for bullet-list
  itemsEn?: string[];
  columns?: InfoTableColumn[]; // For table
  rows?: InfoTableRow[]; // For table
  badgeJa?: string; // e.g. "※注意", "限定", "割引", "重要"
}

export interface InfoScannerOption {
  id: string;
  ja: string;
  en: string;
}

export interface InfoScannerQuestion {
  id: string;
  questionNumber: number; // e.g. 1 or 2
  promptJa: string; // The official exam question in Japanese
  promptEn: string;
  conditionCriteriaJa?: string[]; // Specific conditions learner must match (e.g. ["火曜日", "午後", "リンゴ3個"])
  conditionCriteriaEn?: string[];
  options: [InfoScannerOption, InfoScannerOption, InfoScannerOption, InfoScannerOption];
  correctIndex: 0 | 1 | 2 | 3;
  evidenceBlockIds: string[]; // IDs of the blocks that prove the answer
  explanationJa: string;
  explanationEn: string;
  clueQuoteJa: string; // Exact phrase or sentence from the document proving the answer
}

export interface InfoScannerDocument {
  id: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  jlpt: 5 | 4 | 3 | 2 | 1;
  category: InfoScannerCategory;
  categoryJa: string;
  categoryEn: string;
  titleJa: string;
  titleEn: string;
  documentTypeJa: string; // e.g. "スーパーのチラシ", "社内伝言メモ", "図書館利用案内"
  documentTypeEn: string; // e.g. "Supermarket Flyer", "Desk Memo", "Library Guide"
  targetPersonaJa: string; // Scenario framing: "留学生のリーさん", "会社員の高橋さん"
  targetPersonaEn: string;
  scenarioContextJa: string; // What the persona wants to achieve / conditions
  scenarioContextEn: string;
  blocks: InfoBlock[];
  questions: InfoScannerQuestion[];
}

export const INFO_SCANNER_DOCUMENTS: readonly InfoScannerDocument[] =
  staticDocuments as unknown as InfoScannerDocument[];

let cachedDocuments: readonly InfoScannerDocument[] | null = null;

/**
 * Client-side loader for Info Scanner dataset.
 * Fetches compiled JSON from /data/v1/jlpt/info-scanner.json with in-memory caching.
 */
export async function loadInfoScannerData(): Promise<readonly InfoScannerDocument[]> {
  if (cachedDocuments) {
    return cachedDocuments;
  }

  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/data/v1/jlpt/info-scanner.json");
      if (response.ok) {
        const data = (await response.json()) as InfoScannerDocument[];
        if (Array.isArray(data) && data.length > 0) {
          cachedDocuments = data;
          return data;
        }
      }
    } catch {
      // Fallback to static bundle if fetch fails
    }
  }

  cachedDocuments = INFO_SCANNER_DOCUMENTS;
  return cachedDocuments;
}
