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
import { GameLayout } from "@/components/layout/game-layout";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Compass,
  Filter,
  Headphones,
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
  cafe: "from-amber-950/60 via-stone-900 to-slate-950",
  civic: "from-cyan-900/60 via-slate-900 to-slate-950",
};

const LEVEL_BADGE_STYLES: Record<string, string> = {
  N5: "border-emerald-400/50 bg-emerald-500/20 text-emerald-200",
  N4: "border-sky-400/50 bg-sky-500/20 text-sky-200",
  N3: "border-amber-400/50 bg-amber-500/20 text-amber-200",
  N2: "border-violet-400/50 bg-violet-500/20 text-violet-200",
  N1: "border-rose-400/50 bg-rose-500/20 text-rose-200",
};

function getHoverExpression(scenario: ScenarioMeta): string {
  if (scenario.hoverExpression) return scenario.hoverExpression;
  if (scenario.id === "first-date-sakura") return "embarrased";
  const manifest = DIALOGUE_ASSET_MANIFESTS[scenario.id];
  if (!manifest) return "neutral";
  if (manifest.characterSprites.proud && scenario.defaultExpression !== "proud") return "proud";
  if (manifest.characterSprites.happy && scenario.defaultExpression !== "happy") return "happy";
  if (manifest.characterSprites.relieved && scenario.defaultExpression !== "relieved") return "relieved";
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
    getHoverExpression(scenario)
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
      className="group relative flex h-[600px] flex-col justify-between overflow-hidden rounded-[26px] border-2 border-slate-800/80 bg-slate-950 text-white shadow-[0_18px_44px_rgba(15,23,42,0.28)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--sakura)] hover:shadow-[0_24px_56px_rgba(208,16,76,0.24)] select-none"
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
          <span className="rounded-md border border-white/15 bg-slate-950/70 px-2 py-0.5 text-[10px] font-semibold text-white/85 backdrop-blur-md truncate max-w-[140px] sm:max-w-[180px]">
            {scenario.characterRoleEn}
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-pink-400/50 bg-slate-950/80 px-2.5 py-0.5 text-[10px] font-bold text-pink-200 backdrop-blur-md shrink-0 shadow-xs">
          {hasCustomAssets ? (
            <>
              <Volume2 className="size-3 text-pink-400" />
              <span className="text-pink-200">Voiced VN</span>
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
                <p className="font-japanese text-[11px] font-bold text-pink-200 truncate">
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
                  className="inline-flex items-center gap-1 font-bold text-pink-200 hover:text-pink-100 hover:underline shrink-0"
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
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-200">
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
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-200">
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
  const [selectedLevel, setSelectedLevel] = useState<"ALL" | "N5" | "N4" | "N3" | "N2" | "N1">("ALL");
  const { stopAudio } = useJapaneseAudio();

  useEffect(() => {
    stopAudio();
    stopScenarioSfx();
  }, [stopAudio]);

  const filteredScenarios =
    selectedLevel === "ALL"
      ? DIALOGUE_SCENARIOS
      : DIALOGUE_SCENARIOS.filter((s) => s.level === selectedLevel);

  const levelCounts: Record<"ALL" | "N5" | "N4" | "N3" | "N2" | "N1", number> = {
    ALL: DIALOGUE_SCENARIOS.length,
    N5: DIALOGUE_SCENARIOS.filter((s) => s.level === "N5").length,
    N4: DIALOGUE_SCENARIOS.filter((s) => s.level === "N4").length,
    N3: DIALOGUE_SCENARIOS.filter((s) => s.level === "N3").length,
    N2: DIALOGUE_SCENARIOS.filter((s) => s.level === "N2").length,
    N1: DIALOGUE_SCENARIOS.filter((s) => s.level === "N1").length,
  };

  return (
    <GameLayout label="DIALOGUE QUEST" glyph="話">
      <section className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6 lg:px-8">
        {/* Navigation & Enhanced Hero Header */}
        <div className="pt-6 pb-6 sm:pt-8 sm:pb-8">
          <Link
            href="/"
            className="group mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)] shadow-xs transition-all hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)]"
          >
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Back to Games Hub</span>
          </Link>

          {/* Hero Banner Card */}
          <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface)] to-[var(--sakura-light)]/40 p-6 sm:p-8 shadow-[var(--card-shadow)]">
            {/* Subtle decorative background glows */}
            <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-[var(--sakura)]/15 blur-3xl" />
            <div className="pointer-events-none absolute -left-12 -bottom-12 size-48 rounded-full bg-[var(--primary)]/10 blur-2xl" />

            <div className="relative z-10 flex flex-col gap-6">
              {/* Header Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--primary)]/25 bg-[var(--sakura-light)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--primary)] shadow-xs">
                  <Sparkles className="size-3 text-[var(--primary)]" />
                  Visual Novel Roleplay · 実践・会話シミュレーション
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--correct)]/30 bg-[var(--correct-soft)] px-3 py-1 text-[11px] font-bold text-[var(--correct)] shadow-xs">
                  <Volume2 className="size-3" />
                  10 Voiced Episodes · JLPT N5–N1
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-[11px] font-bold text-violet-600 dark:text-violet-300 shadow-xs">
                  <Headphones className="size-3" />
                  Dual VOICEVOX & Kenpath Audio
                </span>
              </div>

              {/* Main Titles */}
              <div className="max-w-3xl">
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-[var(--ink)]">
                  Dialogue Quest{" "}
                  <span className="block sm:inline font-japanese text-2xl sm:text-3xl font-extrabold text-[var(--primary)] mt-1 sm:mt-0">
                    （実践・会話ロールプレイ）
                  </span>
                </h1>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-[var(--muted)]">
                  Step into 10 authentic Japanese visual novel encounters across daily life, campus, corporate business, municipal affairs, and romance. Read the social atmosphere (<span className="font-japanese font-semibold text-[var(--ink)]">空気</span>), master polite Keigo vs casual distancing, and navigate branching storylines with full Japanese voice acting, expressive anime sounds, and ambient loops.
                </p>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 border-t border-[var(--line)] pt-5 text-xs">
                <div className="flex items-center gap-2.5 rounded-xl bg-[var(--paper)]/80 p-2.5 border border-[var(--line)]/70 shadow-xs">
                  <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                    <Volume2 className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[var(--ink)] leading-tight truncate">Native Voice Acting</p>
                    <p className="text-[10px] text-[var(--muted)] truncate">Voiced NPCs & Player Choices</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl bg-[var(--paper)]/80 p-2.5 border border-[var(--line)]/70 shadow-xs">
                  <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Compass className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[var(--ink)] leading-tight truncate">Read The Air (空気)</p>
                    <p className="text-[10px] text-[var(--muted)] truncate">Honne, Tatemae & Etiquette</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl bg-[var(--paper)]/80 p-2.5 border border-[var(--line)]/70 shadow-xs">
                  <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <BookOpen className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[var(--ink)] leading-tight truncate">Keigo Nuance Rules</p>
                    <p className="text-[10px] text-[var(--muted)] truncate">Sonkeigo, Kenjougo, Teineigo</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl bg-[var(--paper)]/80 p-2.5 border border-[var(--line)]/70 shadow-xs">
                  <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Award className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[var(--ink)] leading-tight truncate">Branching Endings</p>
                    <p className="text-[10px] text-[var(--muted)] truncate">Perfect, Pass & Blunder Paths</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Level Filter Control Bar */}
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center sm:justify-between shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink)] px-1">
              <span className="flex size-6 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                <Filter className="size-3" />
              </span>
              <span>Filter by JLPT Level:</span>
            </div>

            <div
              className="flex flex-wrap items-center gap-1.5"
              role="group"
              aria-label="Filter scenarios by JLPT level"
            >
              {(["ALL", "N5", "N4", "N3", "N2", "N1"] as const).map((lvl) => {
                const active = selectedLevel === lvl;
                const count = levelCounts[lvl];
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedLevel(lvl)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                        : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)] hover:border-[var(--sakura)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <span>{lvl === "ALL" ? "All Episodes" : `JLPT ${lvl}`}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                        active
                          ? "bg-white/25 text-white"
                          : "bg-black/5 dark:bg-white/10 text-[var(--muted)]"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Visual Novel Vertical Screen Cards Grid (2 stories per row: 2*5) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {filteredScenarios.map((scenario, idx) => {
            const globalIndex = DIALOGUE_SCENARIOS.findIndex((s) => s.id === scenario.id);
            const episodeNumber = globalIndex !== -1 ? globalIndex + 1 : idx + 1;
            return (
              <VnVerticalStoryCard
                key={scenario.id}
                scenario={scenario}
                episodeNumber={episodeNumber}
              />
            );
          })}
        </div>
      </section>
    </GameLayout>
  );
}
