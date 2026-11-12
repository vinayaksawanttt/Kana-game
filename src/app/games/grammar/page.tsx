"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { playGameSfx } from "@/lib/game-core/sfx";
import { saveGameSession } from "@/lib/game-core/storage";
import { createGrammarSession } from "@/engine/grammarSession";
import { grammarLevels, loadGrammarData, type GrammarLevel } from "@/data/grammar";
import { SakuraLoader } from "@/components/ui/SakuraLoader";

const mixOptions: Array<{ value: number; label: string; sub: string }> = [
  { value: 0.5, label: "50 / 50 Mix", sub: "Balanced Cloze & Scramble" },
  { value: 1, label: "Cloze Only", sub: "100% fill-in-the-blank" },
  { value: 0, label: "Scramble Only", sub: "100% sentence ordering" },
  { value: 0.7, label: "70% Cloze / 30% Scramble", sub: "Mostly Cloze" },
  { value: 0.3, label: "30% Cloze / 70% Scramble", sub: "Mostly Scramble" },
];

type SavedGrammarSetup = {
  levels: GrammarLevel[];
  size: 10 | 20 | 30;
  clozeRatio: number;
};

export default function GrammarSetupPage() {
  const router = useRouter();
  const [levels, setLevels] = useState<GrammarLevel[]>(["N5"]);
  const [size, setSize] = useState<10 | 20 | 30>(10);
  const [clozeRatio, setClozeRatio] = useState<number>(0.5);
  const [countsByLevel, setCountsByLevel] = useState<Record<GrammarLevel, number>>({
    N5: 136,
    N4: 124,
    N3: 132,
    N2: 191,
    N1: 245,
  });
  const [ready, setReady] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("grammar-last-setup");
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SavedGrammarSetup>;
        if (
          Array.isArray(parsed.levels) &&
          parsed.levels.length > 0 &&
          parsed.levels.every((lvl): lvl is GrammarLevel =>
            (grammarLevels as readonly string[]).includes(lvl)
          )
        ) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setLevels(parsed.levels);
        }
        if (parsed.size === 10 || parsed.size === 20 || parsed.size === 30) {
          setSize(parsed.size);
        }
        if (typeof parsed.clozeRatio === "number" && parsed.clozeRatio >= 0 && parsed.clozeRatio <= 1) {
          setClozeRatio(parsed.clozeRatio);
        }
      }
    } catch {
      // Ignore storage read errors
    }
    setReady(true);

    let active = true;
    loadGrammarData(grammarLevels)
      .then((all) => {
        if (!active) return;
        const tally: Record<GrammarLevel, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
        for (const p of all) {
          tally[p.level] += 1;
        }
        setCountsByLevel(tally);
      })
      .catch(() => {
        // Keep default counts
      });

    function onPageShow() {
      setStarting(false);
    }
    window.addEventListener("pageshow", onPageShow);
    return () => {
      active = false;
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  const poolSize = useMemo(
    () => levels.reduce((sum, lvl) => sum + (countsByLevel[lvl] ?? 0), 0),
    [countsByLevel, levels]
  );

  function toggleLevel(level: GrammarLevel) {
    setLevels((prev) =>
      prev.includes(level) ? prev.filter((item) => item !== level) : [...prev, level]
    );
  }

  async function start() {
    if (!poolSize || starting) return;
    setStarting(true);
    setError("");
    try {
      const session = await createGrammarSession({ levels, size, clozeRatio });
      saveGameSession("grammar", session.sessionId, session);
      localStorage.setItem("grammar-last-setup", JSON.stringify({ levels, size, clozeRatio }));
      setStarting(false);
      playGameSfx("temple-bell-gong");
      router.push(`/games/grammar/play/${session.sessionId}`);
    } catch (startError) {
      console.error("Could not start grammar session.", startError);
      setError("The session could not be started. Please try again.");
      setStarting(false);
    }
  }

  if (!ready) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
        <SakuraLoader label="Preparing Setup..." size="md" />
      </main>
    );
  }

  return (
    <GameLayout
      label="GRAMMAR"
      glyph="文"
      rightSlot={
        <Link
          href="/grammar"
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 text-xs font-semibold text-[var(--ink)] hover:border-[var(--primary)]"
        >
          <BookOpen className="size-3.5 text-[var(--primary)]" />
          <span>Reference Hub</span>
        </Link>
      }
    >
      <section className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-5 py-6 sm:px-8">
        <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_50px_rgba(188,0,45,0.055)] sm:p-7">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
              Cloze & Syntax Scramble
            </p>
            <h1 className="mb-7 text-2xl font-bold sm:text-3xl">Grammar practice setup</h1>

            <div className="space-y-7">
              {/* JLPT Level Multi-Select */}
              <fieldset>
                <legend className="mb-3 text-sm font-bold">JLPT Level (multi-select)</legend>
                <div className="flex flex-wrap gap-2">
                  {grammarLevels.map((lvl) => {
                    const selected = levels.includes(lvl);
                    return (
                      <button
                        key={lvl}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleLevel(lvl)}
                        className={`min-h-11 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                          selected
                            ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                            : "border-transparent bg-[var(--sakura-light)] text-[var(--muted)] hover:border-[var(--sakura)]"
                        }`}
                      >
                        {lvl}{" "}
                        <span className="ml-1 text-xs opacity-80">
                          ({countsByLevel[lvl] ?? 0})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Mix Ratio */}
              <fieldset>
                <legend className="mb-3 text-sm font-bold">Question Mix (Cloze vs. Scramble)</legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {mixOptions.map((opt) => {
                    const selected = Math.abs(clozeRatio - opt.value) < 0.01;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setClozeRatio(opt.value)}
                        className={`rounded-xl border px-3.5 py-3 text-left text-sm font-bold transition-colors ${
                          selected
                            ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                            : "border-transparent bg-[var(--sakura-light)] text-[var(--muted)] hover:border-[var(--sakura)]"
                        }`}
                      >
                        <span className="block">{opt.label}</span>
                        <span className={`mt-0.5 block text-xs font-normal ${selected ? "text-white/80" : "text-[var(--muted)]"}`}>
                          {opt.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Set Size */}
              <fieldset>
                <legend className="mb-3 text-sm font-bold">Set size</legend>
                <div className="grid grid-cols-3 gap-2">
                  {([10, 20, 30] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      disabled={poolSize === 0}
                      aria-pressed={size === option}
                      onClick={() => setSize(option)}
                      className={`min-h-11 rounded-full border px-5 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        size === option
                          ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                          : "border-transparent bg-[var(--sakura-light)] text-[var(--muted)] hover:border-[var(--sakura)]"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>

          <aside className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_50px_rgba(188,0,45,0.055)] sm:p-7 lg:sticky lg:top-6 lg:self-start">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
              Your selection
            </p>
            <div className="my-5 flex items-end justify-between border-b border-[var(--line)] pb-5">
              <span className="font-japanese text-5xl leading-none text-[var(--primary-fg)]">{poolSize}</span>
              <span className="pb-1 text-sm text-[var(--muted)]">grammar points</span>
            </div>
            <p className="mb-2 flex items-center justify-between text-sm text-[var(--muted)]">
              <span>Questions</span>
              <strong className="text-[var(--ink)]">{Math.min(size, poolSize)}</strong>
            </p>
            <p className="mb-5 flex items-center justify-between text-sm text-[var(--muted)]">
              <span>Cloze / Scramble</span>
              <strong className="text-[var(--ink)]">
                {Math.round(clozeRatio * 100)}% / {Math.round((1 - clozeRatio) * 100)}%
              </strong>
            </p>
            {error && (
              <p role="alert" className="mb-3 text-sm font-semibold">
                {error}
              </p>
            )}
            <button
              type="button"
              disabled={!poolSize || starting}
              onClick={() => void start()}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] text-lg font-bold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {starting ? "Starting…" : "Start Practice"} <ArrowRight size={19} />
            </button>
          </aside>
        </div>
      </section>
    </GameLayout>
  );
}
