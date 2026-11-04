"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Volume2 } from "lucide-react";
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
  const [sound, setSound] = useState(true);

  function startGame() {
    const sessionId = newSessionId();
    const settings: ShiritoriSettings = {
      mode,
      difficulty,
      turnSeconds,
      sound,
      allowUnverified: false,
    };
    sessionStorage.setItem(`shiritori-session:${sessionId}`, JSON.stringify({ sessionId, settings }));
    router.push(`/games/shiritori/play/${sessionId}`);
  }

  return (
    <GameLayout label="SHIRITORI" glyph="鎖">
      <section className="mx-auto w-full max-w-5xl flex-1 px-5 pb-10 sm:px-8">
        <header className="pb-7 pt-4 text-center sm:pb-9 sm:pt-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary-fg)]">Japanese word chain</p>
          <h1 className="font-japanese text-5xl leading-tight sm:text-6xl">しりとり</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            Follow the last sound, find a new word, and keep the chain alive.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3" aria-label="Example word chain">
            {[
              { emoji: "🍎", word: "りんご", link: "り" },
              { emoji: "🦍", word: "ごりら", link: "ご" },
              { emoji: "🎺", word: "らっぱ", link: "ら" },
            ].map((item, index) => (
              <div key={item.word} className="shiritori-chain-step flex items-center gap-2" style={{ animationDelay: `${index * 180}ms` }}>
                {index > 0 && <span className="font-japanese text-xl text-[var(--muted)]" aria-hidden="true">→</span>}
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-bold shadow-sm sm:px-4">
                  <span aria-hidden="true">{item.emoji}</span>
                  <span className="font-japanese text-base">{item.word.slice(0, -1)}<span className="rounded bg-[var(--sakura-light)] px-0.5 text-[var(--primary)]">{item.link}</span>{item.word.slice(-1)}</span>
                </span>
              </div>
            ))}
          </div>
        </header>

        <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_50px_rgba(188,0,45,0.055)] sm:p-8" aria-label="Game settings">
          <fieldset>
            <legend className="mb-3 text-sm font-extrabold">Choose a mode</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {modes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={mode === item.id}
                  onClick={() => setMode(item.id)}
                  className={`flex min-h-[88px] items-center gap-3 rounded-lg border p-3 text-left transition-colors ${mode === item.id ? "border-[var(--primary)] bg-[var(--sakura-light)]" : "border-[var(--line)] hover:border-[var(--sakura)]"}`}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--surface)] font-japanese text-xl text-[var(--primary)]">{item.mark}</span>
                  <span><span className="block text-sm font-extrabold">{item.title}</span><span className="mt-1 block text-xs text-[var(--muted)]">{item.detail}</span></span>
                </button>
              ))}
            </div>
          </fieldset>

          {mode !== "friend" && (
            <fieldset className="mt-7">
              <legend className="mb-3 text-sm font-extrabold">Bot difficulty</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {difficulties.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={difficulty === item.id}
                    onClick={() => setDifficulty(item.id)}
                    className={`min-h-[76px] rounded-lg border px-3 py-2 text-left transition-colors ${difficulty === item.id ? "border-[var(--primary)] bg-[var(--sakura-light)]" : "border-[var(--line)] hover:border-[var(--sakura)]"}`}
                  >
                    <span className="block font-japanese text-base font-bold">{item.title}</span>
                    <span className="mt-1 block text-xs text-[var(--muted)]">{item.detail}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-7 grid gap-6 border-t border-[var(--line)] pt-6 sm:grid-cols-2">
            <fieldset>
              <legend className="mb-3 text-sm font-extrabold">Turn timer</legend>
              <div className="inline-flex rounded-full bg-[var(--sakura-light)] p-1">
                {([0, 15, 30] as const).map((seconds) => (
                  <button key={seconds} type="button" aria-pressed={turnSeconds === seconds} onClick={() => setTurnSeconds(seconds)} className={`min-h-10 rounded-full px-4 text-sm font-bold transition-colors ${turnSeconds === seconds ? "bg-[var(--primary)] text-white" : "text-[var(--muted)]"}`}>
                    {seconds === 0 ? "Off" : `${seconds}s turns`}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-sm font-extrabold">Pronunciation</legend>
              <div className="inline-flex rounded-full bg-[var(--sakura-light)] p-1">
                {[true, false].map((enabled) => (
                  <button key={String(enabled)} type="button" aria-pressed={sound === enabled} onClick={() => setSound(enabled)} className={`flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors ${sound === enabled ? "bg-[var(--primary)] text-white" : "text-[var(--muted)]"}`}>
                    <Volume2 size={15} aria-hidden="true" /> Sound {enabled ? "on" : "off"}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <button type="button" onClick={startGame} className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-center text-sm font-extrabold text-white transition-colors hover:bg-[var(--primary-hover)] sm:text-base">
            {mode === "friend" ? "Start — P1 opens with 「しりとり」" : "Start — the bot opens with 「しりとり」"}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </section>

        <details className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-extrabold">
            <BookOpen size={16} className="text-[var(--primary)]" aria-hidden="true" /> Rules We Play By
          </summary>
          <ul className="mt-4 grid gap-3 border-t border-[var(--line)] pt-4 text-sm leading-relaxed text-[var(--muted)] sm:grid-cols-2">
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
