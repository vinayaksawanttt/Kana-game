"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Check, Shield, Sparkles, Users, Zap } from "lucide-react";
import { useState } from "react";
import { GameLayout } from "@/lib/game-core/layout";
import { playGameSfx } from "@/lib/game-core/sfx";
import type { ShiritoriDifficulty, ShiritoriMode, ShiritoriSettings } from "@/engine/shiritori";

const modes: Array<{
  id: ShiritoriMode;
  title: string;
  detail: string;
  icon: typeof Shield;
  mark: string;
}> = [
  { id: "survival", title: "Survival", detail: "Play against the dictionary", icon: Shield, mark: "一" },
  { id: "blitz", title: "Blitz", detail: "60-second rapid word chain", icon: Zap, mark: "速" },
  { id: "friend", title: "Pass & Play", detail: "Two players, one screen", icon: Users, mark: "二" },
];

const difficulties: Array<{
  id: ShiritoriDifficulty;
  title: string;
  level: string;
  detail: string;
}> = [
  { id: "yasashii", title: "やさしい", level: "N5–N4", detail: "Gentle bot, forgives ending on ん with a retry" },
  { id: "futsuu", title: "ふつう", level: "N5–N3", detail: "Standard rules, balanced vocabulary" },
  { id: "oni", title: "おに", level: "N5–N1", detail: "Full dictionary, hunts for trapping kana" },
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
    playGameSfx("temple-bell-gong");
    router.push(`/games/shiritori/play/${sessionId}`);
  }

  return (
    <GameLayout label="SHIRITORI" glyph="鎖" homeHref="/">
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 pb-8 sm:px-6">
        {/* Hero Section */}
        <header className="pb-5 pt-2 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)]/40 bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary)] uppercase tracking-wider">
            <Sparkles size={13} className="text-[var(--primary)]" />
            <span>語彙連鎖 · Japanese Word Chain</span>
          </div>

          <h1 className="mt-2 font-japanese text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--ink)]">
            しりとり <span className="text-xl sm:text-2xl font-bold text-[var(--muted)] font-sans">(Shiritori)</span>
          </h1>

          <p className="mx-auto mt-1 max-w-lg text-xs sm:text-sm text-[var(--muted)]">
            Connect each word using the final sound of the previous word. Test your Japanese recall and keep the chain unbroken!
          </p>

          {/* Word Chain Visual Demonstration */}
          <div
            className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs select-none"
            aria-label="Example word chain"
          >
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 shadow-2xs">
              <span aria-hidden="true" className="text-base">🍎</span>
              <span className="font-japanese text-sm font-semibold text-[var(--ink)]">
                りん<span className="font-bold text-[var(--primary)] bg-[var(--sakura-light)] px-1 rounded">ご</span>
              </span>
              <span className="text-[10px] text-[var(--muted)] font-sans">(ringo)</span>
            </div>

            <span className="text-sm font-bold text-[var(--primary)]" aria-hidden="true">→</span>

            <div className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 shadow-2xs">
              <span aria-hidden="true" className="text-base">🦍</span>
              <span className="font-japanese text-sm font-semibold text-[var(--ink)]">
                <span className="font-bold text-[var(--primary)] bg-[var(--sakura-light)] px-1 rounded">ご</span>り<span className="font-bold text-[var(--primary)] bg-[var(--sakura-light)] px-1 rounded">ら</span>
              </span>
              <span className="text-[10px] text-[var(--muted)] font-sans">(gorira)</span>
            </div>

            <span className="text-sm font-bold text-[var(--primary)]" aria-hidden="true">→</span>

            <div className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 shadow-2xs">
              <span aria-hidden="true" className="text-base">🎺</span>
              <span className="font-japanese text-sm font-semibold text-[var(--ink)]">
                <span className="font-bold text-[var(--primary)] bg-[var(--sakura-light)] px-1 rounded">ら</span>っぱ
              </span>
              <span className="text-[10px] text-[var(--muted)] font-sans">(rappa)</span>
            </div>
          </div>
        </header>

        {/* Main Settings Card */}
        <section
          className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm sm:p-6"
          aria-label="Game settings"
        >
          {/* 1. Mode Selection */}
          <fieldset>
            <div className="mb-2.5 flex items-center justify-between">
              <legend className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Choose Mode
              </legend>
              <span className="text-[11px] text-[var(--muted)]">Solo & Multiplayer</span>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {modes.map((item) => {
                const isSelected = mode === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setMode(item.id)}
                    className={`group relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--sakura-light)]/50 ring-1 ring-[var(--primary)]/40 shadow-xs"
                        : "border-[var(--line)] bg-[var(--bg)] hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)]/20"
                    }`}
                  >
                    <div
                      className={`grid size-9 shrink-0 place-items-center rounded-lg transition-colors ${
                        isSelected
                          ? "bg-[var(--primary)] text-white shadow-2xs"
                          : "bg-[var(--surface)] text-[var(--muted)] group-hover:bg-[var(--sakura-light)] group-hover:text-[var(--primary)]"
                      }`}
                    >
                      <IconComponent size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[var(--ink)]">{item.title}</span>
                        {isSelected && <Check size={14} className="text-[var(--primary)] shrink-0" strokeWidth={3} />}
                      </div>
                      <span className="mt-0.5 block truncate text-[11px] text-[var(--muted)]">
                        {item.detail}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* 2. Bot Difficulty Selection (if not friend mode) */}
          {mode !== "friend" && (
            <fieldset className="mt-5">
              <div className="mb-2.5 flex items-center justify-between">
                <legend className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Bot Difficulty
                </legend>
                <span className="text-[11px] text-[var(--muted)]">Vocabulary & trap behavior</span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {difficulties.map((item) => {
                  const isSelected = difficulty === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setDifficulty(item.id)}
                      className={`group rounded-xl border p-3 text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-[var(--primary)] bg-[var(--sakura-light)]/50 ring-1 ring-[var(--primary)]/40 shadow-xs"
                          : "border-[var(--line)] bg-[var(--bg)] hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)]/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-japanese text-sm font-bold text-[var(--ink)]">
                          {item.title}
                        </span>
                        <span className="rounded bg-[var(--line)]/50 px-1.5 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                          {item.level}
                        </span>
                      </div>
                      <span className="mt-1 block text-[11px] leading-snug text-[var(--muted)]">
                        {item.detail}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* 3. Turn Timer & Pronunciation Controls */}
          <div className="mt-5 grid gap-3.5 border-t border-[var(--line)] pt-4 sm:grid-cols-2">
            <fieldset>
              <legend className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Turn Timer
              </legend>
              <div className="inline-flex w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] p-1">
                {([0, 15, 30] as const).map((seconds) => {
                  const isSelected = turnSeconds === seconds;
                  return (
                    <button
                      key={seconds}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setTurnSeconds(seconds)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[var(--primary)] text-white shadow-xs"
                          : "text-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {seconds === 0 ? "Off (Unlimited)" : `${seconds}s turns`}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Pronunciation
              </legend>
              <div className="inline-flex w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] p-1">
                <button
                  type="button"
                  aria-pressed={soundEnabled}
                  onClick={() => setSoundEnabled(true)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
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
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
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

          {/* Opening Word Preview Card */}
          <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="font-japanese text-base font-bold text-[var(--ink)]">しりとり</span>
              <span className="text-[var(--muted)] font-japanese">(shiritori · word chain)</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[var(--muted)]">First move target: </span>
              <span className="font-japanese font-bold text-[var(--primary)] bg-[var(--sakura-light)] px-1.5 py-0.5 rounded text-xs">
                「り」
              </span>
            </div>
          </div>

          {/* Start CTA */}
          <button
            type="button"
            onClick={startGame}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-center text-sm font-bold text-white shadow-sm transition-all hover:bg-[var(--primary-hover)] active:scale-[0.99] cursor-pointer"
          >
            <span>
              {mode === "friend"
                ? "Start Game — Player 1 opens with 「しりとり」"
                : "Start Game — Bot opens with 「しりとり」"}
            </span>
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </section>

        {/* Rules Accordion */}
        <details className="mt-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 transition-colors hover:border-[var(--sakura)]">
          <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)]">
            <span className="flex items-center gap-2">
              <BookOpen size={14} className="text-[var(--primary)]" aria-hidden="true" />
              <span>Shiritori Rules & Special Kana</span>
            </span>
            <span className="text-[11px] font-normal text-[var(--muted)]">Rules & Tips ▾</span>
          </summary>
          <ul className="mt-3 grid gap-2.5 border-t border-[var(--line)] pt-3 text-xs leading-relaxed text-[var(--muted)] sm:grid-cols-2">
            <li>
              <strong className="text-[var(--ink)]">No ending on ん:</strong> A word ending in ん loses the game immediately (unless playing やさしい mode, which gives you one forgiveness retry).
            </li>
            <li>
              <strong className="text-[var(--ink)]">Long vowels (ー):</strong> Trailing chōonpu is dropped to use the preceding kana sound (e.g. ミキサー chains from さ).
            </li>
            <li>
              <strong className="text-[var(--ink)]">Small kana (ゃ, ゅ, ょ):</strong> Compound kana like しゃ can be matched with either しゃ or the standard sound や.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Romaji auto-conversion:</strong> Type in romaji and it automatically converts to hiragana as you type. You have 3 hints available per game.
            </li>
          </ul>
        </details>
      </section>
    </GameLayout>
  );
}
