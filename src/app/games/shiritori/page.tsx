"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen } from "lucide-react";
import { useState } from "react";
import { GameLayout } from "@/lib/game-core/layout";
import type { ShiritoriDifficulty, ShiritoriMode, ShiritoriSettings } from "@/engine/shiritori";

const modes: Array<{ id: ShiritoriMode; title: string; detail: string; mark: string }> = [
  { id: "survival", title: "Survival", detail: "Play against the dictionary", mark: "一" },
  { id: "blitz", title: "Blitz", detail: "A 60-second speed chain", mark: "速" },
  { id: "friend", title: "Friend", detail: "Two players, one device", mark: "二" },
];

const difficulties: Array<{ id: ShiritoriDifficulty; title: string; detail: string }> = [
  { id: "yasashii", title: "やさしい", detail: "N5–N4 · plays kindly, forgives ん" },
  { id: "futsuu", title: "ふつう", detail: "N5–N3 · standard rules" },
  { id: "oni", title: "おに", detail: "All levels · looks for a trap" },
];

function newSessionId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export default function ShiritoriSetupPage() {
  const router = useRouter();
  const [mode, setMode] = useState<ShiritoriMode>("survival");
  const [difficulty, setDifficulty] = useState<ShiritoriDifficulty>("futsuu");
  const [turnSeconds, setTurnSeconds] = useState<ShiritoriSettings["turnSeconds"]>(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  function startGame() {
    const sessionId = newSessionId();
    const settings: ShiritoriSettings = {
      mode,
      difficulty,
      turnSeconds,
      sound: soundEnabled,
      soundEnabled,
      allowUnverified: false,
    };
    sessionStorage.setItem(`shiritori-session:${sessionId}`, JSON.stringify({ sessionId, settings }));
    router.push(`/games/shiritori/play/${sessionId}`);
  }

  return (
    <GameLayout label="SHIRITORI" glyph="鎖" homeHref="/games/shiritori">
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 pb-8 sm:px-6">
        <header className="pb-4 pt-1 text-center sm:pb-5 sm:pt-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)]/30 bg-[var(--sakura-light)]/40 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--primary)]">
            Japanese word chain
          </div>
          <h1 className="mt-1.5 font-japanese text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl">
            しりとり
          </h1>
          <p className="mx-auto mt-1 max-w-md text-xs text-[var(--muted)] sm:text-sm">
            Follow the last sound, find a new word, and keep the chain alive.
          </p>
          <div className="mt-3 flex items-center justify-center gap-1.5 sm:gap-2 text-xs" aria-label="Example word chain">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold shadow-xs">
              <span aria-hidden="true">🍎</span>
              <span className="font-japanese">
                りん<span className="font-bold text-[var(--primary)]">ご</span>
              </span>
            </span>
            <span className="text-[var(--muted)]" aria-hidden="true">→</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold shadow-xs">
              <span aria-hidden="true">🦍</span>
              <span className="font-japanese">
                <span className="font-bold text-[var(--primary)]">ご</span>り<span className="font-bold text-[var(--primary)]">ら</span>
              </span>
            </span>
            <span className="text-[var(--muted)]" aria-hidden="true">→</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold shadow-xs">
              <span aria-hidden="true">🎺</span>
              <span className="font-japanese">
                <span className="font-bold text-[var(--primary)]">ら</span>っぱ
              </span>
            </span>
          </div>
        </header>

        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm sm:p-6" aria-label="Game settings">
          <fieldset>
            <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Choose a mode</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {modes.map((item) => {
                const isSelected = mode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setMode(item.id)}
                    className={`group flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--sakura-light)]/40 ring-1 ring-[var(--primary)]/30"
                        : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--sakura)] hover:bg-[var(--line)]/20"
                    }`}
                  >
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-lg font-japanese text-sm font-bold transition-colors ${
                        isSelected
                          ? "bg-[var(--primary)] text-white shadow-xs"
                          : "bg-[var(--line)]/50 text-[var(--ink)] group-hover:bg-[var(--sakura-light)] group-hover:text-[var(--primary)]"
                      }`}
                    >
                      {item.mark}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold leading-tight text-[var(--ink)] sm:text-sm">{item.title}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-[var(--muted)]">{item.detail}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {mode !== "friend" && (
            <fieldset className="mt-4 sm:mt-5">
              <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Bot difficulty</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {difficulties.map((item) => {
                  const isSelected = difficulty === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setDifficulty(item.id)}
                      className={`group rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-[var(--primary)] bg-[var(--sakura-light)]/40 ring-1 ring-[var(--primary)]/30"
                          : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--sakura)] hover:bg-[var(--line)]/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-japanese text-sm font-bold text-[var(--ink)]">{item.title}</span>
                        {isSelected && (
                          <span className="size-1.5 rounded-full bg-[var(--primary)]" aria-hidden="true" />
                        )}
                      </div>
                      <span className="mt-1 block text-[11px] leading-snug text-[var(--muted)]">{item.detail}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div className="mt-4 grid gap-3 border-t border-[var(--line)]/60 pt-4 sm:grid-cols-2">
            <fieldset>
              <legend className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Turn timer</legend>
              <div className="inline-flex w-full rounded-lg bg-[var(--line)]/40 p-0.5">
                {([0, 15, 30] as const).map((seconds) => {
                  const isSelected = turnSeconds === seconds;
                  return (
                    <button
                      key={seconds}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setTurnSeconds(seconds)}
                      className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[var(--primary)] text-white shadow-xs"
                          : "text-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {seconds === 0 ? "Off" : `${seconds}s turns`}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Pronunciation</legend>
              <div className="inline-flex w-full rounded-lg bg-[var(--line)]/40 p-0.5">
                <button
                  type="button"
                  aria-pressed={soundEnabled}
                  onClick={() => setSoundEnabled(true)}
                  className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    soundEnabled
                      ? "bg-[var(--primary)] text-white shadow-xs"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  🔊 Sound on
                </button>
                <button
                  type="button"
                  aria-pressed={!soundEnabled}
                  onClick={() => setSoundEnabled(false)}
                  className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    !soundEnabled
                      ? "bg-[var(--primary)] text-white shadow-xs"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  🔇 Sound off
                </button>
              </div>
            </fieldset>
          </div>

          <button
            type="button"
            onClick={startGame}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-center text-sm font-bold text-white shadow-sm transition-all hover:bg-[var(--primary-hover)] active:scale-[0.99] cursor-pointer"
          >
            <span>{mode === "friend" ? "Start — P1 opens with 「しりとり」" : "Start — the bot opens with 「しりとり」"}</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </section>

        <details className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 px-4 py-2.5 transition-colors hover:bg-[var(--surface)]">
          <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)]">
            <span className="flex items-center gap-2">
              <BookOpen size={14} className="text-[var(--primary)]" aria-hidden="true" />
              <span>Rules We Play By</span>
            </span>
            <span className="text-[11px] font-normal text-[var(--muted)]">Expand ▾</span>
          </summary>
          <ul className="mt-2.5 grid gap-2 border-t border-[var(--line)]/60 pt-2.5 text-xs leading-relaxed text-[var(--muted)] sm:grid-cols-2">
            <li><strong className="text-[var(--ink)]">No ん escape:</strong> a word ending in ん loses, except やさしい mode gives you a retry.</li>
            <li><strong className="text-[var(--ink)]">Long vowels:</strong> trailing ー is dropped for chaining (ミキサー ends at さ).</li>
            <li><strong className="text-[var(--ink)]">Small kana:</strong> しゃ can continue with しゃ or the flexible sound や.</li>
            <li><strong className="text-[var(--ink)]">Type naturally:</strong> romaji converts to hiragana as you type. You have 3 hints per game.</li>
          </ul>
        </details>
      </section>
    </GameLayout>
  );
}
