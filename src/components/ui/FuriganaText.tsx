import React from "react";

export interface FuriganaTextProps {
  /** Plain Japanese text without furigana brackets. */
  text: string;
  /** Optional bracket-annotated furigana string, e.g. "この{中|なか}で". */
  furiganaText?: string;
  /** Whether to render <ruby><rt> readings above Kanji. */
  showFurigana: boolean;
  className?: string;
}

const FURIGANA_TOKEN_RE = /\{([^|{}]+)\|([^|{}]+)\}/g;

/**
 * Strips `{漢字|ふりがな}` brackets back to plain `漢字`.
 */
export function stripFuriganaMarkup(input: string): string {
  return input.replace(FURIGANA_TOKEN_RE, "$1");
}

/**
 * Renders Japanese text with optional `<ruby>` furigana above Kanji when `showFurigana` is true.
 */
export function FuriganaText({
  text,
  furiganaText,
  showFurigana,
  className,
}: FuriganaTextProps) {
  const source = furiganaText ?? text;

  if (!showFurigana || !source.includes("{")) {
    return <span className={className}>{stripFuriganaMarkup(text)}</span>;
  }

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(FURIGANA_TOKEN_RE.source, "g");

  while ((match = regex.exec(source)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(source.slice(lastIndex, match.index));
    }
    const kanji = match[1];
    const reading = match[2];
    nodes.push(
      <ruby key={`${match.index}-${kanji}`} className="mx-[0.5px] ruby-align">
        {kanji}
        <rt className="select-none px-0.5 font-japanese text-[0.56em] font-semibold leading-none text-[var(--primary-fg)]">
          {reading}
        </rt>
      </ruby>,
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < source.length) {
    nodes.push(source.slice(lastIndex));
  }

  return <span className={className}>{nodes}</span>;
}
