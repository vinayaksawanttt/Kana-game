"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DIALOGUE_SCENARIOS } from "@/data/dialogue";
import { GameLayout } from "@/lib/game-core/layout";
import { ArrowLeft, ArrowRight, MapPin, MessageSquare, Sparkles, UserCheck } from "lucide-react";

export default function DialogueHubPage() {
  const [selectedLevel, setSelectedLevel] = useState<"ALL" | "N5" | "N4" | "N3">("ALL");

  const filteredScenarios =
    selectedLevel === "ALL"
      ? DIALOGUE_SCENARIOS
      : DIALOGUE_SCENARIOS.filter((s) => s.level === selectedLevel);

  return (
    <GameLayout label="DIALOGUE QUEST" glyph="話">
      <section className="mx-auto w-full max-w-6xl flex-1 px-5 pb-14 sm:px-8">
        {/* Back link & Hero */}
        <div className="py-6 sm:py-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[var(--primary-fg)]"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Games Hub</span>
          </Link>

          <div className="flex flex-col justify-between gap-4 border-b border-[var(--line)] pb-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
                  Interactive Roleplay · 会話シミュレーション
                </span>
                <span className="rounded-full bg-[var(--correct)]/15 px-3 py-1 text-[11px] font-bold text-[var(--correct)]">
                  {DIALOGUE_SCENARIOS.length} Scenarios · N5–N3
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Dialogue Quest (<span className="font-japanese">実践・会話ロールプレイ</span>)
              </h1>
              <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
                Step into real-world Japanese encounters — ask a passerby for directions to McDonald&apos;s, report a lost wallet at a Kōban, consult your Sensei, call your landlord, or bargain at a countryside market while reading the social atmosphere (<span className="font-japanese">空気</span>).
              </p>
            </div>

            {/* Level Filter Pills */}
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter scenarios by JLPT level">
              {(["ALL", "N5", "N4", "N3"] as const).map((lvl) => {
                const active = selectedLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedLevel(lvl)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${
                      active
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                        : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--sakura)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {lvl === "ALL" ? "All Levels" : `JLPT ${lvl}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scenarios Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredScenarios.map((scenario) => (
            <Link
              key={scenario.id}
              href={`/games/dialogue/play/${scenario.id}`}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_12px_34px_rgba(188,0,45,0.045)] transition duration-200 hover:-translate-y-1 hover:border-[var(--sakura)] hover:shadow-[0_20px_40px_rgba(208,16,76,0.12)]"
            >
              <div>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="grid size-13 place-items-center rounded-2xl border border-[var(--sakura)]/50 bg-[var(--sakura-light)] text-2xl shadow-xs">
                    {scenario.characterAvatar}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full border border-[var(--sakura)]/60 bg-[var(--sakura-light)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary-fg)]">
                      {scenario.level}
                    </span>
                    <span className="rounded-full bg-[var(--correct)]/15 px-2.5 py-0.5 text-[11px] font-bold text-[var(--correct)]">
                      {scenario.characterRoleEn}
                    </span>
                  </div>
                </div>

                <p className="font-japanese text-xs font-bold text-[var(--primary-fg)]">
                  {scenario.titleJa}
                </p>
                <h2 className="mt-1 text-lg font-bold leading-snug text-[var(--ink)]">
                  {scenario.titleEn}
                </h2>

                <p className="mt-2.5 text-sm leading-relaxed text-[var(--muted)]">
                  {scenario.descriptionEn}
                </p>

                <div className="mt-4 space-y-1.5 rounded-xl border border-[var(--line)]/80 bg-[var(--paper-tint)] p-3 text-xs text-[var(--muted)]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 shrink-0 text-[var(--primary-fg)]" />
                    <span className="truncate font-medium text-[var(--ink)]">{scenario.locationEn}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="size-3.5 shrink-0 text-[var(--primary-fg)]" />
                    <span className="truncate">{scenario.characterNameJa}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4 text-xs font-bold text-[var(--primary-fg)]">
                <span className="inline-flex items-center gap-1.5 text-[var(--muted)]">
                  <Sparkles className="size-3.5 text-[var(--primary-fg)]" />
                  Voiced Character
                </span>
                <span className="inline-flex items-center gap-1">
                  Enter Scene
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </GameLayout>
  );
}
