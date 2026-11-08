"use client";

import React, { useCallback, useEffect, useRef } from "react";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  Mail,
  MapPin,
  Megaphone,
  ShoppingBag,
  Sparkles,
  StickyNote,
  Tag,
  Volume2,
} from "lucide-react";
import type {
  InfoBlock,
  InfoScannerCategory,
  SessionDocumentItem,
} from "@/engine/jlptInfoScanner";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";

export interface InfoScannerDocumentViewerProps {
  document: SessionDocumentItem;
  highlightedBlockIds?: string[];
  isRevealed?: boolean;
  onBlockClick?: (blockId: string) => void;
  className?: string;
}

export function InfoScannerDocumentViewer({
  document,
  highlightedBlockIds = [],
  isRevealed = false,
  onBlockClick,
  className = "",
}: InfoScannerDocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { playSentence, isPlaying, activeKey } = useJapaneseAudio();

  const highlightedSet = React.useMemo(
    () => new Set(highlightedBlockIds),
    [highlightedBlockIds]
  );

  // Auto-scroll to first evidence block on reveal
  useEffect(() => {
    if (!isRevealed || highlightedBlockIds.length === 0) return;
    const firstId = highlightedBlockIds[0];
    if (!firstId || !containerRef.current) return;

    const el = containerRef.current.querySelector(`[data-block-id="${firstId}"]`);
    if (el) {
      el.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
    }
  }, [isRevealed, highlightedBlockIds]);

  const handlePlayAudio = useCallback(
    (e: React.MouseEvent, block: InfoBlock) => {
      e.stopPropagation();

      let textToSpeak = "";
      if (block.contentJa) {
        textToSpeak = `${block.titleJa ? block.titleJa + "。" : ""} ${block.contentJa}`;
      } else if (block.itemsJa && block.itemsJa.length > 0) {
        textToSpeak = `${block.titleJa ? block.titleJa + "。" : ""} ${block.itemsJa.join("。")}`;
      } else if (block.rows && block.rows.length > 0) {
        const rowTexts = block.rows.map((r) =>
          Object.values(r.cells).join("、")
        );
        textToSpeak = `${block.titleJa ? block.titleJa + "。" : ""} ${rowTexts.join("。")}`;
      } else if (block.titleJa) {
        textToSpeak = block.titleJa;
      }

      if (textToSpeak.trim()) {
        playSentence(textToSpeak.trim(), block.id);
      }
    },
    [playSentence]
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl border transition-all ${getDocumentCategoryWrapper(
        document.category
      )} ${className}`}
    >
      {/* Category Visual Banner & Watermark Seal */}
      <DocumentMetaHeader document={document} />

      {/* Main Content Area: Render each structured block */}
      <div className="space-y-4 p-4 sm:p-6 md:p-8">
        {document.blocks.map((block) => {
          const isHighlighted = isRevealed && highlightedSet.has(block.id);
          const isAudioActive = activeKey === block.id && isPlaying;

          return (
            <section
              key={block.id}
              id={block.id}
              data-block-id={block.id}
              onClick={() => onBlockClick?.(block.id)}
              className={`group relative rounded-xl transition-all duration-300 ${
                isHighlighted
                  ? "ring-2 ring-emerald-500/90 bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.28)]"
                  : "border border-transparent hover:border-[var(--line)]/60"
              }`}
            >
              {/* Floating Green Evidence Pill when revealed */}
              {isHighlighted && (
                <div className="absolute -top-3 left-4 z-10 flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-0.5 text-[11px] font-bold text-white shadow-md animate-pulse">
                  <CheckCircle2 className="size-3.5" />
                  <span>正解の根拠 (Evidence Clue)</span>
                </div>
              )}

              {/* Block audio speaker button */}
              {isRevealed && (
                <button
                  type="button"
                  onClick={(e) => handlePlayAudio(e, block)}
                  aria-label={`Listen to ${block.titleJa ?? "block"}`}
                  className={`absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold shadow-xs transition cursor-pointer ${
                    isAudioActive
                      ? "bg-emerald-600 text-white"
                      : isHighlighted
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/80 dark:text-emerald-200"
                      : "bg-[var(--surface)] text-[var(--muted)] opacity-60 hover:opacity-100 border border-[var(--line)]"
                  }`}
                  title="Listen to this block in Japanese"
                >
                  <Volume2 className={`size-3.5 ${isAudioActive ? "animate-bounce" : ""}`} />
                  <span className="text-[10px] hidden sm:inline">音声</span>
                </button>
              )}

              {/* Individual Block Content Renderer */}
              <div className="p-3 sm:p-4">
                <BlockContentRenderer
                  block={block}
                  category={document.category}
                  isHighlighted={isHighlighted}
                />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// CATEGORY TEMPLATE HEADER & ACCENT WRAPPERS
// =============================================================================

function getDocumentCategoryWrapper(category: InfoScannerCategory): string {
  switch (category) {
    case "flyer-store":
      return "border-rose-300 dark:border-rose-900/60 bg-gradient-to-b from-rose-50/40 to-[var(--surface)] dark:from-rose-950/20 shadow-[0_12px_36px_rgba(244,63,94,0.06)]";
    case "memo-notice":
      return "border-amber-300 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 shadow-[0_12px_36px_rgba(245,158,11,0.06)] font-sans";
    case "schedule-transport":
      return "border-sky-300 dark:border-sky-900/60 bg-sky-50/30 dark:bg-sky-950/20 shadow-[0_12px_36px_rgba(14,165,233,0.06)]";
    case "public-guide":
      return "border-teal-300 dark:border-teal-900/60 bg-teal-50/30 dark:bg-teal-950/20 shadow-[0_12px_36px_rgba(20,184,166,0.06)]";
    case "business-email":
      return "border-indigo-300 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-[0_12px_36px_rgba(99,102,241,0.06)] font-mono-subtle";
    case "application-form":
      return "border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-[0_12px_36px_rgba(16,185,129,0.06)]";
    default:
      return "border-[var(--line)] bg-[var(--surface)] shadow-[var(--card-shadow)]";
  }
}

function DocumentMetaHeader({ document }: { document: SessionDocumentItem }) {
  const { category, documentTypeJa, documentTypeEn, level, titleJa, titleEn } = document;

  return (
    <div className="border-b border-[var(--line)]/60 bg-[var(--surface)]/90 px-4 py-3 sm:px-6 rounded-t-2xl space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CategoryIcon category={category} className="size-4 text-[var(--primary)]" />
          <span className="font-japanese text-xs font-bold text-[var(--ink)]">
            {documentTypeJa}
          </span>
          <span className="text-xs text-[var(--muted)]">({documentTypeEn})</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-xs font-extrabold text-white">
            {level}
          </span>
          <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2 py-0.5 font-japanese text-[11px] font-semibold text-[var(--muted)]">
            情報検索
          </span>
        </div>
      </div>

      <div className="pt-1 border-t border-[var(--line)]/30">
        <h1 className="font-japanese text-base sm:text-lg font-bold text-[var(--ink)]">
          {titleJa}
        </h1>
        {titleEn && (
          <p className="text-xs text-[var(--muted)]">{titleEn}</p>
        )}
      </div>
    </div>
  );
}

function CategoryIcon({
  category,
  className,
}: {
  category: InfoScannerCategory;
  className?: string;
}) {
  switch (category) {
    case "flyer-store":
      return <ShoppingBag className={className} />;
    case "memo-notice":
      return <StickyNote className={className} />;
    case "schedule-transport":
      return <Clock className={className} />;
    case "public-guide":
      return <Building2 className={className} />;
    case "business-email":
      return <Mail className={className} />;
    case "application-form":
      return <FileText className={className} />;
  }
}

// =============================================================================
// BLOCK CONTENT RENDERER
// =============================================================================

function BlockContentRenderer({
  block,
  category,
  isHighlighted,
}: {
  block: InfoBlock;
  category: InfoScannerCategory;
  isHighlighted: boolean;
}) {
  switch (block.type) {
    case "header":
      return <HeaderBlock block={block} category={category} />;
    case "paragraph":
      return <ParagraphBlock block={block} />;
    case "bullet-list":
      return <BulletListBlock block={block} />;
    case "table":
      return <TableBlock block={block} category={category} />;
    case "footnote":
      return <FootnoteBlock block={block} isHighlighted={isHighlighted} />;
    case "notice-box":
      return <NoticeBoxBlock block={block} />;
    default:
      return null;
  }
}

// 1. Header Block
function HeaderBlock({
  block,
  category,
}: {
  block: InfoBlock;
  category: InfoScannerCategory;
}) {
  const isFlyer = category === "flyer-store";
  const isMemo = category === "memo-notice";

  return (
    <div className="space-y-1">
      {block.badgeJa && (
        <span
          className={`inline-block rounded-md px-2 py-0.5 font-japanese text-[11px] font-black ${
            isFlyer
              ? "bg-rose-500 text-white animate-pulse"
              : isMemo
              ? "bg-amber-600 text-white"
              : "bg-[var(--primary)] text-white"
          }`}
        >
          {block.badgeJa}
        </span>
      )}

      {block.titleJa && (
        <h2 className="font-japanese text-lg sm:text-xl font-bold tracking-tight text-[var(--ink)]">
          {block.titleJa}
        </h2>
      )}

      {block.titleEn && (
        <p className="text-xs font-medium text-[var(--muted)]">{block.titleEn}</p>
      )}

      {block.contentJa && (
        <p className="mt-1 font-japanese text-sm leading-relaxed text-[var(--ink)]/80">
          {block.contentJa}
        </p>
      )}
    </div>
  );
}

// 2. Paragraph Block
function ParagraphBlock({ block }: { block: InfoBlock }) {
  return (
    <div className="space-y-1">
      {block.titleJa && (
        <h3 className="font-japanese text-sm font-bold text-[var(--ink)]">
          {block.titleJa}
        </h3>
      )}
      {block.contentJa && (
        <p className="font-japanese text-sm leading-relaxed text-[var(--ink)] whitespace-pre-line">
          {block.contentJa}
        </p>
      )}
      {block.contentEn && (
        <p className="text-xs text-[var(--muted)] italic">{block.contentEn}</p>
      )}
    </div>
  );
}

// 3. Bullet List Block
function BulletListBlock({ block }: { block: InfoBlock }) {
  return (
    <div className="space-y-2">
      {block.titleJa && (
        <h3 className="font-japanese text-sm font-bold text-[var(--primary-fg)] flex items-center gap-1.5">
          <Tag className="size-3.5 text-[var(--primary)]" />
          <span>{block.titleJa}</span>
        </h3>
      )}

      {block.itemsJa && block.itemsJa.length > 0 && (
        <ul className="space-y-1.5 pl-1">
          {block.itemsJa.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 font-japanese text-xs sm:text-sm text-[var(--ink)]"
            >
              <span className="mt-1 flex size-2 shrink-0 rounded-full bg-[var(--primary)]" />
              <div className="flex-1">
                <span>{item}</span>
                {block.itemsEn?.[idx] && (
                  <span className="block text-[11px] text-[var(--muted)]">
                    {block.itemsEn[idx]}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// 4. Table Block (Timetables, Pricing matrices, Criteria grids)
function TableBlock({
  block,
  category,
}: {
  block: InfoBlock;
  category: InfoScannerCategory;
}) {
  if (!block.columns || !block.rows) return null;

  const isSchedule = category === "schedule-transport";
  const isFlyer = category === "flyer-store";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {block.titleJa && (
          <h3 className="font-japanese text-sm font-bold text-[var(--ink)] flex items-center gap-1.5">
            <FileSpreadsheet className="size-3.5 text-[var(--primary)]" />
            <span>{block.titleJa}</span>
          </h3>
        )}
        {block.badgeJa && (
          <span className="rounded bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 px-2 py-0.5 font-japanese text-[11px] font-bold">
            {block.badgeJa}
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-xs">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--bg)]/80 text-[var(--muted)]">
              {block.columns.map((col) => (
                <th
                  key={col.key}
                  className={`p-2.5 sm:p-3 font-japanese font-bold text-[var(--ink)] ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left"
                  }`}
                >
                  <div>{col.headerJa}</div>
                  {col.headerEn && (
                    <div className="text-[10px] font-normal text-[var(--muted)]">
                      {col.headerEn}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]/50">
            {block.rows.map((row, rIdx) => (
              <tr
                key={row.id ?? rIdx}
                className="transition hover:bg-[var(--bg)]/40"
              >
                {block.columns?.map((col) => {
                  const cellVal = row.cells[col.key] ?? "";
                  const isPriceOrTime =
                    col.key.toLowerCase().includes("price") ||
                    col.key.toLowerCase().includes("fare") ||
                    col.key.toLowerCase().includes("time");

                  return (
                    <td
                      key={col.key}
                      className={`p-2.5 sm:p-3 font-japanese ${
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left"
                      } ${
                        isPriceOrTime && isFlyer
                          ? "font-bold text-rose-600 dark:text-rose-400"
                          : isPriceOrTime && isSchedule
                          ? "font-mono font-semibold text-sky-700 dark:text-sky-300"
                          : "text-[var(--ink)]"
                      }`}
                    >
                      {cellVal}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 5. Footnote Block (Asterisks, conditions, fine print where exam traps live!)
function FootnoteBlock({
  block,
  isHighlighted,
}: {
  block: InfoBlock;
  isHighlighted: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 text-xs leading-relaxed transition-all ${
        isHighlighted
          ? "border-emerald-500 bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 font-semibold"
          : "border-dashed border-[var(--line)] bg-[var(--paper-tint)]/60 text-[var(--muted)]"
      }`}
    >
      <div className="flex items-start gap-2">
        <AlertCircle
          className={`size-4 mt-0.5 shrink-0 ${
            isHighlighted ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"
          }`}
        />
        <div className="space-y-1">
          {block.titleJa && (
            <div className="font-japanese font-bold text-[var(--ink)]">
              {block.titleJa}
            </div>
          )}
          {block.contentJa && (
            <p className="font-japanese text-xs leading-relaxed text-[var(--ink)] whitespace-pre-line">
              {block.contentJa}
            </p>
          )}
          {block.contentEn && (
            <p className="text-[11px] text-[var(--muted)] italic">
              {block.contentEn}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// 6. Notice Box Block (Highlighted callouts, special cautions)
function NoticeBoxBlock({ block }: { block: InfoBlock }) {
  return (
    <div className="rounded-xl border border-amber-300 dark:border-amber-800/70 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 text-xs text-[var(--ink)] shadow-xs">
      <div className="mb-1 flex items-center gap-1.5 font-japanese font-bold text-amber-800 dark:text-amber-300">
        <Megaphone className="size-3.5 shrink-0" />
        <span>{block.titleJa ?? "お知らせ・重要事項"}</span>
      </div>
      {block.contentJa && (
        <p className="font-japanese text-xs leading-relaxed text-[var(--ink)]">
          {block.contentJa}
        </p>
      )}
      {block.contentEn && (
        <p className="mt-1 text-[11px] text-[var(--muted)]">{block.contentEn}</p>
      )}
    </div>
  );
}
