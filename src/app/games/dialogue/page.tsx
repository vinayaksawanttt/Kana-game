"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DIALOGUE_SCENARIOS, getScenarioNodes, ScenarioMeta } from "@/data/dialogue";
import {
  getScenarioBackgroundUrl,
  getScenarioCharacterSpriteUrl,
  DIALOGUE_ASSET_MANIFESTS,
  stopScenarioSfx,
} from "@/data/dialogue/assets";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { GameLayout } from "@/lib/game-core/layout";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  MapPin,
  MessageSquare,
  Play,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";

const FALLBACK_STAGE_GRADIENTS: Record<string, string> = {
  street: "from-amber-900/60 via-slate-900 to-slate-950",
  station: "from-sky-900/60 via-slate-900 to-slate-950",
  office: "from-indigo-900/60 via-slate-900 to-slate-950",
  store: "from-orange-900/60 via-slate-900 to-slate-950",
  apartment: "from-rose-900/60 via-slate-900 to-slate-950",
  countryside: "from-emerald-900/60 via-slate-900 to-slate-950",
};

const LEVEL_BADGE_STYLES: Record<string, string> = {
  N5: "border-emerald-400/50 bg-emerald-500/20 text-emerald-200",
  N4: "border-sky-400/50 bg-sky-500/20 text-sky-200",
  N3: "border-amber-400/50 bg-amber-500/20 text-amber-200",
};

function getHoverExpression(scenarioId: string): string {
  const manifest = DIALOGUE_ASSET_MANIFESTS[scenarioId];
  if (!manifest) return "neutral";
  if (manifest.characterSprites.happy) return "happy";
  if (manifest.characterSprites.relieved) return "relieved";
  if (manifest.characterSprites.proud) return "proud";
  return "neutral";
}

interface VnStoryCardProps {
  scenario: ScenarioMeta;
  episodeNumber: number;
}

function VnVerticalStoryCard({ scenario, episodeNumber }: VnStoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [activeTab, setActiveTab] = useState<"story" | "options" | "vocab">("story");

  const bgUrl = getScenarioBackgroundUrl(scenario.id, scenario.defaultBackgroundKey);
  const defaultSpriteUrl = getScenarioCharacterSpriteUrl(
    scenario.id,
    scenario.defaultExpression || "neutral"
  );
  const hoverSpriteUrl = getScenarioCharacterSpriteUrl(
    scenario.id,
    getHoverExpression(scenario.id)
  );
  const activeSpriteUrl = isHovered && hoverSpriteUrl ? hoverSpriteUrl : defaultSpriteUrl;

  const hasCustomAssets = Boolean(DIALOGUE_ASSET_MANIFESTS[scenario.id]);
  const nodes = getScenarioNodes(scenario.id);
  const initialNode = nodes ? nodes[scenario.initialNodeId] : undefined;
  const openingChoices = initialNode?.choices?.slice(0, 2) || [];
  const vocabList = scenario.vocabList || [];

  const episodeLabel = `EP.${String(episodeNumber).padStart(2, "0")}`;

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex h-[590px] flex-col justify-between overflow-hidden rounded-[26px] border-2 border-slate-800/80 bg-slate-950 text-white shadow-[0_18px_44px_rgba(15,23,42,0.28)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--sakura)] hover:shadow-[0_24px_56px_rgba(208,16,76,0.24)] select-none"
    >
      {/* =========================================================
          1. BACKGROUND ARTWORK LAYER
         ========================================================= */}
      <div className="absolute inset-0 overflow-hidden">
        {bgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bgUrl}
            alt={scenario.locationEn}
            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div
            className={`relative h-full w-full bg-gradient-to-br ${
              FALLBACK_STAGE_GRADIENTS[scenario.backgroundTheme] ||
              FALLBACK_STAGE_GRADIENTS.street
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(244,114,182,0.22),transparent_65%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem]" />
          </div>
        )}

        {/* Subtle top gradient for single-row HUD bar & lower vignette behind dialogue box */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-950/70 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />
      </div>

      {/* =========================================================
          2. CHARACTER STANDING SPRITE LAYER
          Anchored from top-[48px] (below the single HUD bar) so the
          head & face are 100% unobstructed in the upper stage while
          lower legs naturally tuck behind the dialogue box.
         ========================================================= */}
      {activeSpriteUrl ? (
        <div className="pointer-events-none absolute inset-x-0 top-[46px] z-10 flex justify-center overflow-visible">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeSpriteUrl}
            alt={scenario.characterNameEn}
            className="h-[430px] w-auto max-w-none object-contain object-top drop-shadow-[0_12px_28px_rgba(0,0,0,0.75)] transition-transform duration-500 ease-out origin-top group-hover:scale-[1.03]"
          />
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-x-0 top-[52px] bottom-[250px] z-10 flex flex-col items-center justify-center gap-2.5">
          <div className="grid size-24 place-items-center rounded-3xl border border-white/20 bg-slate-900/75 text-5xl shadow-2xl backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
            {scenario.characterAvatar}
          </div>
          <span className="rounded-full border border-white/15 bg-black/55 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/80 backdrop-blur-xs">
            {scenario.characterRoleEn}
          </span>
        </div>
      )}

      {/* =========================================================
          3. SINGLE-ROW COMPACT TOP VN HUD BAR (Height ~34px)
         ========================================================= */}
      <div className="relative z-20 flex items-center justify-between gap-1.5 px-3 pt-2.5">
        <div className="flex items-center gap-1">
          <span className="rounded-md border border-white/20 bg-slate-950/75 px-2 py-0.5 font-mono text-[10px] font-extrabold tracking-wider text-white/90 backdrop-blur-md">
            {episodeLabel}
          </span>
          <span
            className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold tracking-wide backdrop-blur-md ${
              LEVEL_BADGE_STYLES[scenario.level] || LEVEL_BADGE_STYLES.N5
            }`}
          >
            {scenario.level}
          </span>
          <span className="rounded-md border border-white/15 bg-slate-950/70 px-2 py-0.5 text-[10px] font-semibold text-white/85 backdrop-blur-md truncate max-w-[115px]">
            {scenario.characterRoleEn}
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-[var(--sakura)]/50 bg-slate-950/75 px-2 py-0.5 text-[10px] font-bold text-[var(--sakura-light)] backdrop-blur-md shrink-0">
          {hasCustomAssets ? (
            <>
              <Volume2 className="size-3 text-[var(--sakura)]" />
              <span>Voiced VN</span>
            </>
          ) : (
            <>
              <Sparkles className="size-3 text-[var(--sakura)]" />
              <span>TTS Synth</span>
            </>
          )}
        </div>
      </div>

      {/* Open Stage Viewport Spacer (keeps face & upper body completely clear) */}
      <div className="flex-1" />

      {/* =========================================================
          4. LOWER VN STAGE: STORY OPTIONS + DIALOGUE BOX
         ========================================================= */}
      <div className="relative z-20 flex flex-col gap-1.5 px-3 pb-3">
        {/* VN Choice-Style Story Option Buttons (Floating above Dialogue Box) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-white/75 drop-shadow-xs">
            <span>Story Options · 選択</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === "options" ? "story" : "options")}
                className={`rounded px-1.5 py-0.5 text-[9px] font-bold transition-colors cursor-pointer ${
                  activeTab === "options"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-slate-950/75 border border-white/15 text-white/80 hover:bg-white/20"
                }`}
              >
                <MessageSquare className="mr-0.5 inline size-2.5" />
                Choices ({openingChoices.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === "vocab" ? "story" : "vocab")}
                className={`rounded px-1.5 py-0.5 text-[9px] font-bold transition-colors cursor-pointer ${
                  activeTab === "vocab"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-slate-950/75 border border-white/15 text-white/80 hover:bg-white/20"
                }`}
              >
                <BookOpen className="mr-0.5 inline size-2.5" />
                Vocab ({vocabList.length})
              </button>
            </div>
          </div>

          {/* Primary VN Choice 1: Enter Story */}
          <Link
            href={`/games/dialogue/play/${scenario.id}`}
            className="group/btn flex items-center justify-between gap-2 rounded-xl border border-[var(--sakura)]/70 bg-gradient-to-r from-[var(--primary)]/90 via-[#b80d40]/90 to-slate-900/95 px-3 py-1.5 shadow-[0_6px_20px_rgba(188,0,45,0.35)] backdrop-blur-md transition-all hover:scale-[1.01] hover:border-white hover:shadow-[0_8px_24px_rgba(244,114,182,0.45)]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-white/20 text-[10px] font-extrabold text-white">
                1
              </span>
              <div className="min-w-0">
                <p className="font-japanese text-xs font-extrabold text-white leading-tight truncate">
                  ストーリーを開始する · Start Episode
                </p>
                <p className="text-[10px] text-white/80 leading-tight truncate">
                  Enter visual novel scene with {scenario.characterNameEn.split(" (")[0]}
                </p>
              </div>
            </div>
            <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white transition-transform group-hover/btn:translate-x-0.5">
              <Play className="size-3 fill-current" />
            </span>
          </Link>
        </div>

        {/* VN Frosted-Glass Dialogue Box at Bottom of Screen */}
        <div className="relative mt-2 rounded-2xl border border-white/20 bg-slate-950/90 p-3 pt-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.75)] backdrop-blur-xl">
          {/* Decorative sakura top highlight */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--sakura)] to-transparent opacity-80" />

          {/* Floating Character Nameplate + Location Header */}
          <div className="absolute -top-3 inset-x-3 z-20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 rounded-t-lg rounded-br-lg border border-[var(--sakura)]/80 bg-gradient-to-r from-[var(--primary)] to-[#b3002d] px-2.5 py-0.5 shadow-[0_3px_10px_rgba(188,0,45,0.4)] shrink-0">
              <span className="font-japanese text-[11px] font-extrabold tracking-wide text-white">
                {scenario.characterNameJa.split(" ")[0]}
              </span>
              <span className="text-[9px] font-medium text-white/85">
                · {scenario.characterNameEn.split(" (")[0]}
              </span>
            </div>

            <div className="inline-flex max-w-[55%] items-center gap-1 rounded-full border border-white/15 bg-slate-900/95 px-2 py-0.5 text-[9px] text-slate-300 shadow-sm">
              <MapPin className="size-2.5 shrink-0 text-[var(--sakura)]" />
              <span className="truncate font-medium">{scenario.locationJa}</span>
            </div>
          </div>

          {/* Tab Content inside the VN Dialogue Window */}
          {activeTab === "story" && (
            <div className="min-h-[100px] flex flex-col justify-between">
              <div>
                <p className="font-japanese text-[11px] font-bold text-[var(--sakura-light)] truncate">
                  {scenario.titleJa}
                </p>
                <h2 className="mt-0.5 text-[15px] font-extrabold leading-snug text-white line-clamp-1">
                  {scenario.titleEn}
                </h2>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-300">
                  {scenario.descriptionEn}
                </p>
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-1.5 text-[10px] text-slate-400">
                <span className="font-japanese truncate max-w-[75%]">
                  「{initialNode?.npcTextJa.replace(/^[（(]|[）)]$/g, "")}」
                </span>
                <Link
                  href={`/games/dialogue/play/${scenario.id}`}
                  className="inline-flex items-center gap-1 font-bold text-[var(--sakura-light)] hover:underline shrink-0"
                >
                  <span>Play</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          )}

          {activeTab === "options" && (
            <div className="min-h-[100px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--sakura-light)]">
                  Opening Dialogue Options Preview
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("story")}
                  className="text-white/50 hover:text-white cursor-pointer"
                  aria-label="Back to story synopsis"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              <div className="mt-1.5 space-y-1">
                {openingChoices.map((ch, idx) => (
                  <Link
                    key={ch.id}
                    href={`/games/dialogue/play/${scenario.id}`}
                    className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-left transition-colors hover:border-[var(--sakura)]/60 hover:bg-white/10"
                  >
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded bg-[var(--primary)]/80 text-[9px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-japanese truncate text-[11px] font-bold text-white">
                        {ch.textJa}
                      </p>
                      <p className="truncate text-[9px] text-slate-300/80">{ch.textEn}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {activeTab === "vocab" && (
            <div className="min-h-[100px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--sakura-light)]">
                  Key Episode Vocabulary ({vocabList.length})
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("story")}
                  className="text-white/50 hover:text-white cursor-pointer"
                  aria-label="Back to story synopsis"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              <div className="mt-1.5 grid grid-cols-2 gap-1">
                {vocabList.slice(0, 4).map((v) => (
                  <div
                    key={v.ja}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1"
                  >
                    <p className="font-japanese text-[11px] font-bold text-white truncate">
                      {v.ja}{" "}
                      <span className="font-normal text-[9px] text-slate-400">({v.kana})</span>
                    </p>
                    <p className="text-[9px] text-slate-300 truncate">{v.en}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function DialogueHubPage() {
  const [selectedLevel, setSelectedLevel] = useState<"ALL" | "N5" | "N4" | "N3">("ALL");
  const { stopAudio } = useJapaneseAudio();

  useEffect(() => {
    stopAudio();
    stopScenarioSfx();
  }, [stopAudio]);

  const filteredScenarios =
    selectedLevel === "ALL"
      ? DIALOGUE_SCENARIOS
      : DIALOGUE_SCENARIOS.filter((s) => s.level === selectedLevel);

  return (
    <GameLayout label="DIALOGUE QUEST" glyph="話">
      <section className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 sm:px-8">
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
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
                  Visual Novel Roleplay · 会話シミュレーション
                </span>
                <span className="rounded-full bg-[var(--correct)]/15 px-3 py-1 text-[11px] font-bold text-[var(--correct)]">
                  {DIALOGUE_SCENARIOS.length} Episodes · JLPT N5–N3
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Dialogue Quest (<span className="font-japanese">実践・会話ロールプレイ</span>)
              </h1>
              <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
                Choose an episode screen below to step into a voiced Japanese visual novel encounter. Read the social atmosphere (<span className="font-japanese">空気</span>), preview opening choices or vocabulary on each vertical screen card, and start your conversation.
              </p>
            </div>

            {/* Level Filter Pills */}
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Filter scenarios by JLPT level"
            >
              {(["ALL", "N5", "N4", "N3"] as const).map((lvl) => {
                const active = selectedLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedLevel(lvl)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                        : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--sakura)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {lvl === "ALL" ? "All Episodes" : `JLPT ${lvl}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Visual Novel Vertical Screen Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredScenarios.map((scenario, idx) => (
            <VnVerticalStoryCard
              key={scenario.id}
              scenario={scenario}
              episodeNumber={idx + 1}
            />
          ))}
        </div>
      </section>
    </GameLayout>
  );
}
