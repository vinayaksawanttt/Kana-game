"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Play } from "lucide-react";
import { LearnHeader } from "@/components/learn/LearnHeader";
import { createGrammarSession } from "@/engine/grammarSession";
import { createKanjiMeaningSession } from "@/engine/kanji-meaning";
import { createKanaSession } from "@/engine/kana-session";
import { grammarLevels, loadGrammarData } from "@/data/grammar";
import { loadVocabularyData, vocabularyLevels, type VocabularyRecord } from "@/data/vocabulary";
import { createVocabularySession } from "@/lib/game/vocabulary";
import { saveGameSession, getGameResult, getSharedGameHistory } from "@/lib/game-core/storage";
import { srsDb, type SrsItem, type SrsItemType } from "@/lib/srs/db";

interface PersonalEntry {
  key: string;
  type: SrsItemType;
  sourceId: string;
  prompt: string;
  answer: string;
  occurrences: number;
  reason: string;
  level?: string;
}

type SheetKind = "mistake-bank" | "missed-kanji";

const typeLabels: Record<SrsItemType, string> = {
  kana: "Kana",
  kanji: "Kanji",
  vocab: "Vocabulary",
  grammar: "Grammar",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addEntry(
  entries: Map<string, PersonalEntry>,
  entry: Omit<PersonalEntry, "occurrences">
): void {
  const previous = entries.get(entry.key);
  if (previous) {
    previous.occurrences += 1;
    if (entry.reason && !previous.reason.includes(entry.reason)) {
      previous.reason = `${previous.reason}; ${entry.reason}`;
    }
    return;
  }
  entries.set(entry.key, { ...entry, occurrences: 1 });
}

function readRecentMistakes(
  vocabularyById: Map<string, VocabularyRecord>
): Map<string, PersonalEntry> {
  const entries = new Map<string, PersonalEntry>();
  const history = getSharedGameHistory();
  for (const session of history.slice(0, 20)) {
    if (!isRecord(session) || typeof session.game !== "string" || typeof session.sessionId !== "string") {
      continue;
    }
    const result = getGameResult<unknown>(session.game, session.sessionId);
    if (!isRecord(result)) continue;

    if (session.game === "kana" && Array.isArray(result.cards)) {
      for (const raw of result.cards) {
        if (!isRecord(raw) || typeof raw.id !== "string" || typeof raw.char !== "string") continue;
        const mistakes = typeof raw.mistakes === "number" ? raw.mistakes : 0;
        if (mistakes <= 0 && raw.status !== "skipped" && raw.status !== "unfinished") continue;
        const romaji = Array.isArray(raw.romaji)
          ? raw.romaji.filter((value): value is string => typeof value === "string").join(" / ")
          : "";
        addEntry(entries, {
          key: `kana:${raw.id}`,
          type: "kana",
          sourceId: raw.id,
          prompt: raw.char,
          answer: romaji,
          reason: mistakes ? `${mistakes} incorrect attempt${mistakes === 1 ? "" : "s"}` : "Skipped or unfinished",
        });
      }
    }

    if (session.game === "kanji" && Array.isArray(result.questions)) {
      for (const raw of result.questions) {
        if (!isRecord(raw) || typeof raw.kanji !== "string" || raw.status === "correct") continue;
        addEntry(entries, {
          key: `kanji:${raw.kanji}`,
          type: "kanji",
          sourceId: raw.kanji,
          prompt: raw.kanji,
          answer: typeof raw.correctLabel === "string" ? raw.correctLabel : "",
          reason: raw.status === "unanswered" ? "Unanswered" : "Answered incorrectly",
          ...(typeof raw.jlpt === "number" ? { level: `N${raw.jlpt}` } : {}),
        });
      }
    }

    if (session.game === "vocabulary" && Array.isArray(result.questions)) {
      for (const raw of result.questions) {
        if (!isRecord(raw) || typeof raw.id !== "string") continue;
        const answerAttempts = Array.isArray(raw.attempts) ? raw.attempts : [];
        const attempts = answerAttempts.length;
        if (raw.status === "correct" && attempts <= 1) continue;
        const vocabulary = vocabularyById.get(raw.id);
        const wrongAnswer =
          attempts > 0 && typeof answerAttempts[attempts - 1] === "string"
            ? `Last answer: ${answerAttempts[attempts - 1]}`
            : "";
        addEntry(entries, {
          key: `vocab:${raw.id}`,
          type: "vocab",
          sourceId: raw.id,
          prompt: vocabulary?.word ?? raw.id,
          answer: vocabulary?.meanings.join("; ") ?? "",
          reason: raw.status === "unanswered" ? "Unanswered" : wrongAnswer || "Incorrect attempt",
          ...(vocabulary ? { level: vocabulary.level } : {}),
        });
      }
    }

    if (session.game === "grammar" && Array.isArray(result.questions)) {
      for (const raw of result.questions) {
        if (!isRecord(raw) || typeof raw.grammarId !== "string" || raw.status === "correct") continue;
        addEntry(entries, {
          key: `grammar:${raw.grammarId}`,
          type: "grammar",
          sourceId: raw.grammarId,
          prompt:
            typeof raw.grammarPattern === "string"
              ? raw.grammarPattern
              : typeof raw.grammarTitle === "string"
                ? raw.grammarTitle
                : raw.grammarId,
          answer: typeof raw.shortExplanation === "string" ? raw.shortExplanation : "",
          reason: raw.status === "unanswered" ? "Unanswered" : "Answered incorrectly",
          ...(typeof raw.level === "string" ? { level: raw.level } : {}),
        });
      }
    }
  }
  return entries;
}

function toEntry(item: SrsItem, reason: string): PersonalEntry {
  return {
    key: item.id,
    type: item.type,
    sourceId: item.type === "kanji" ? item.prompt : item.id.slice(item.type.length + 1),
    prompt: item.prompt,
    answer: item.answer,
    occurrences: Math.max(1, item.card.lapses),
    reason,
    ...(item.level ? { level: item.level } : {}),
  };
}

function downloadEntries(entries: PersonalEntry[], name: string): void {
  const contents = JSON.stringify(entries, null, 2);
  const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${name}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function PersonalSheetClient({ kind }: { kind: SheetKind }) {
  const router = useRouter();
  const [entries, setEntries] = useState<PersonalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingType, setStartingType] = useState<SrsItemType | null>(null);
  const [error, setError] = useState("");
  const missedKanjiOnly = kind === "missed-kanji";

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [items, vocabularyData] = await Promise.all([
          srsDb.items.toArray(),
          missedKanjiOnly ? Promise.resolve(null) : loadVocabularyData([...vocabularyLevels]),
        ]);
        const vocabularyById = new Map(
          vocabularyData?.records.map((record) => [record.id, record]) ?? []
        );
        const selected = missedKanjiOnly
          ? items.filter(
              (item) =>
                item.type === "kanji" &&
                ((typeof item.card.lapses === "number" && item.card.lapses > 0) ||
                  item.card.difficulty > 7)
            )
          : items.filter((item) => item.card.lapses >= 2);
        const srsEntries = new Map(
          selected.map((item) => [
            item.id,
            toEntry(item, `FSRS lapses: ${item.card.lapses}; difficulty: ${item.card.difficulty.toFixed(1)}`),
          ])
        );
        if (!missedKanjiOnly) {
          for (const [key, entry] of readRecentMistakes(vocabularyById)) {
            const srsEntry = srsEntries.get(key);
            if (srsEntry) {
              entry.occurrences += srsEntry.occurrences;
              entry.reason = `${entry.reason}; ${srsEntry.reason}`;
            }
            srsEntries.set(key, entry);
          }
        }
        if (active) setEntries([...srsEntries.values()].sort((a, b) => b.occurrences - a.occurrences));
      } catch (loadError) {
        console.error("Could not load personal study sheet data.", loadError);
        if (active) setError("Personal review data could not be loaded. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [missedKanjiOnly]);

  const groupedEntries = useMemo(
    () =>
      new Map(
        (["kana", "kanji", "vocab", "grammar"] as const).map((type) => [
          type,
          entries.filter((entry) => entry.type === type),
        ])
      ),
    [entries]
  );

  async function practice(type: SrsItemType) {
    const selected = groupedEntries.get(type) ?? [];
    if (!selected.length || startingType) return;
    setStartingType(type);
    setError("");
    try {
      if (type === "kana") {
        const session = createKanaSession({
          script: "both",
          rowKeys: [],
          questionCount: null,
          characterIds: selected.map((entry) => entry.sourceId),
        });
        saveGameSession("kana", session.sessionId, session);
        router.push(`/games/kana/play/${session.sessionId}`);
      } else if (type === "kanji") {
        const ids = [...new Set(selected.map((entry) => entry.sourceId))];
        const levels = [...new Set(selected.flatMap((entry) => {
          const number = Number(entry.level?.replace("N", ""));
          return Number.isInteger(number) && number >= 1 && number <= 5 ? [number] : [1, 2, 3, 4, 5];
        }))];
        const session = await createKanjiMeaningSession({
          levels,
          grades: [1, 2, 3, 4, 5, 6, 8, 9],
          size: ids.length,
          kanjiIds: ids,
        });
        saveGameSession("kanji", session.sessionId, session);
        router.push(`/games/kanji/meaning/play/${session.sessionId}`);
      } else if (type === "vocab") {
        const data = await loadVocabularyData([...vocabularyLevels]);
        const selectedWords = new Set(selected.map((entry) => entry.prompt));
        const session = createVocabularySession({
          levels: [...vocabularyLevels],
          grades: [],
          size: "all",
          ids: data.records
            .filter((record) => selectedWords.has(record.word))
            .map((record) => record.id),
        }, data);
        saveGameSession("vocabulary", session.sessionId, session);
        router.push(`/games/vocabulary/play/${session.sessionId}`);
      } else {
        const allPoints = await loadGrammarData(grammarLevels);
        const session = await createGrammarSession({
          levels: [...grammarLevels],
          size: selected.length,
          grammarIds: [...new Set(selected.map((entry) => entry.sourceId))],
          points: allPoints,
        });
        saveGameSession("grammar", session.sessionId, session);
        router.push(`/games/grammar/play/${session.sessionId}`);
      }
    } catch (practiceError) {
      console.error(`Could not start targeted ${type} practice.`, practiceError);
      setError(`Targeted ${typeLabels[type].toLowerCase()} practice could not be started.`);
      setStartingType(null);
    }
  }

  const title = missedKanjiOnly ? "Kanji You Keep Missing" : "Mistake Bank";
  const description = missedKanjiOnly
    ? "Kanji cards with at least one FSRS lapse or a difficulty score above 7."
    : "Recent quiz errors and repeatedly-lapsed FSRS cards, grouped by study type.";

  return (
    <main className="min-h-dvh bg-[var(--bg)] text-[var(--ink)]">
      <LearnHeader />
      <div className="mx-auto w-full max-w-5xl px-5 pb-12 pt-4 sm:px-8 sm:pt-5">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary-fg)]">
              Personal · updates from this device
            </p>
            <h1 className="text-3xl font-extrabold">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">{description}</p>
          </div>
          <button
            type="button"
            disabled={!entries.length}
            onClick={() => downloadEntries(entries, missedKanjiOnly ? "missed-kanji" : "mistake-bank")}
            className="secondary-button inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-xs font-bold disabled:opacity-50"
          >
            <Download size={15} aria-hidden="true" />
            Export list
          </button>
        </header>

        {error && (
          <p role="alert" className="mb-5 rounded-lg border border-[var(--wrong)]/40 bg-[var(--surface)] p-3 text-sm text-[var(--wrong)]">
            {error}
          </p>
        )}
        {loading ? (
          <p className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
            Loading personal review data…
          </p>
        ) : entries.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-8 text-center">
            <h2 className="font-bold">Nothing to review yet</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[var(--muted)]">
              Complete a practice session or review cards a few times. Items that need another look
              will appear here automatically.
            </p>
          </section>
        ) : (
          <div className="space-y-7">
            {(["kana", "kanji", "vocab", "grammar"] as const).map((type) => {
              const rows = groupedEntries.get(type) ?? [];
              if (!rows.length) return null;
              return (
                <section key={type} className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
                    <div className="flex items-center gap-2">
                      <h2 className="font-extrabold">{typeLabels[type]}</h2>
                      <span className="rounded-full bg-[var(--sakura-light)] px-2.5 py-1 text-[10px] font-bold text-[var(--muted)]">
                        {rows.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={startingType !== null}
                      onClick={() => void practice(type)}
                      className="primary-button inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-xs font-bold disabled:opacity-60"
                    >
                      <Play size={14} aria-hidden="true" />
                      {startingType === type ? "Starting…" : "Practice These Now"}
                    </button>
                  </div>
                  <ul className="divide-y divide-[var(--line)]">
                    {rows.map((entry) => (
                      <li key={entry.key} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3.5">
                        <div className="min-w-0">
                          <p className="font-semibold">{entry.prompt}</p>
                          {entry.answer && <p className="mt-0.5 text-sm text-[var(--muted)]">{entry.answer}</p>}
                          <p className="mt-1 text-xs text-[var(--muted)]">{entry.reason}</p>
                        </div>
                        <span className="shrink-0 rounded-full border border-[var(--line)] px-2.5 py-1 text-[10px] font-bold text-[var(--muted)]">
                          {entry.occurrences} {entry.occurrences === 1 ? "miss" : "misses"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
