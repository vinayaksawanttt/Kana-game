import { isValidElement, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { AudioButton } from "@/components/ui/AudioButton";
import { KanjiReadingPill } from "@/components/ui/KanjiReadingPill";

function nodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (node && typeof node === "object" && "props" in node) {
    const props = node.props as { children?: ReactNode; ja?: string };
    return props.ja ?? nodeText(props.children);
  }
  return "";
}

function isJapaneseAudioTarget(rawText: string): boolean {
  const text = rawText.trim();
  if (!text) return false;

  const jaMatches = text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu) ?? [];
  const jaCount = jaMatches.length;
  if (jaCount < 2) return false;

  const enMatches = text.match(/[a-zA-Z]/g) ?? [];
  const enCount = enMatches.length;
  const total = jaCount + enCount;

  // 1. Predominantly Japanese (e.g. vocabulary items, sentences, tables of inflections)
  if (jaCount / total >= 0.45) return true;

  // 2. Starts with Japanese characters (after list markers, quotes, or markdown symbols)
  // e.g. "1. **私は田中です。** (*Watashi wa Tanaka desu.*)"
  // or "猫がいます。 (*There is a cat.*)"
  const stripped = text.replace(/^(\s*[-*+]|\s*[0-9]+[.)]|\s*>\s*|\s*[*_`]+)+/u, "").trim();
  const startsWithJa = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}「『]/u.test(stripped);
  const hasJaSentence = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]{2,}[^a-zA-Z\n]*[。！？」』]/u.test(stripped);

  // If it starts with Japanese and forms an example sentence or phrase with translation
  if (startsWithJa && (hasJaSentence || jaCount >= 3) && enCount < 120) {
    return true;
  }

  return false;
}

function japaneseAudioText(children: ReactNode): string {
  const text = nodeText(children);
  if (!isJapaneseAudioTarget(text)) return "";

  const phrases = text.match(
    /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々〆ヵヶ、。！？「」『』（）〜…]+/gu
  ) ?? [];
  return phrases
    .filter((phrase) => /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]{2,}/u.test(phrase))
    .join("。");
}

function containsComponent(node: ReactNode, component: unknown): boolean {
  if (Array.isArray(node)) return node.some((child) => containsComponent(child, component));
  if (!isValidElement(node)) return false;
  if (node.type === component) return true;
  return containsComponent((node.props as { children?: ReactNode }).children, component);
}

function JapaneseExampleAudio({ children }: { children: ReactNode }) {
  if (containsComponent(children, AudioButton) || containsComponent(children, KanjiReadingPill)) {
    return null;
  }
  const text = japaneseAudioText(children);
  return text ? <AudioButton text={text} size="sm" label={`Listen to ${text}`} className="ml-1 align-middle" /> : null;
}

function AudioParagraph({ children, ...props }: ComponentPropsWithoutRef<"p">) {
  return (
    <p {...props} className="my-4 leading-7 text-[var(--ink)]">
      {children}
      <JapaneseExampleAudio>{children}</JapaneseExampleAudio>
    </p>
  );
}

function headingId(children: ReactNode): string {
  return nodeText(children)
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

export const mdxComponents = {
  h1: (props: ComponentPropsWithoutRef<"h1">) => <h1 {...props} className="sr-only" />,
  h2: ({ children, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2
      {...props}
      id={props.id ?? headingId(children)}
      className="mt-3 scroll-mt-24 border-b border-[var(--line)] pb-2 text-xl font-extrabold text-[var(--ink)] first:mt-0 sm:text-2xl"
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: ComponentPropsWithoutRef<"h3">) => (
    <h3
      {...props}
      id={props.id ?? headingId(children)}
      className="mt-2 scroll-mt-24 rounded-lg border border-[var(--line)] bg-[var(--bg)]/60 px-3 py-2 text-base font-bold text-[var(--primary-fg)]"
    >
      {children}
    </h3>
  ),
  p: AudioParagraph,
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul {...props} className="my-4 list-disc space-y-2 pl-6 leading-7 text-[var(--ink)]" />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol {...props} className="my-4 list-decimal space-y-2 pl-6 leading-7 text-[var(--ink)]" />
  ),
  li: ({ children, ...props }: ComponentPropsWithoutRef<"li">) => {
    const hasParagraphAudio = containsComponent(children, AudioParagraph);
    return (
      <li {...props} className="pl-1">
        {children}
        {!hasParagraphAudio && <JapaneseExampleAudio>{children}</JapaneseExampleAudio>}
      </li>
    );
  },
  a: (props: ComponentPropsWithoutRef<"a">) => (
    <a {...props} className="font-semibold text-[var(--primary-fg)] underline underline-offset-2" />
  ),
  strong: (props: ComponentPropsWithoutRef<"strong">) => (
    <strong {...props} className="font-bold text-[var(--ink)]" />
  ),
  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      {...props}
      className="my-5 rounded-r-xl border-l-4 border-[var(--primary)] bg-[var(--sakura-light)] px-4 py-2 text-[var(--ink)]"
    />
  ),
  table: ({ children, ...props }: ComponentPropsWithoutRef<"table">) => (
    <div className="my-5 overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface)]">
      <table {...props} className="w-full min-w-[560px] border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  ),
  thead: (props: ComponentPropsWithoutRef<"thead">) => (
    <thead {...props} className="bg-[var(--sakura-light)] text-[var(--ink)]" />
  ),
  th: (props: ComponentPropsWithoutRef<"th">) => (
    <th {...props} className="border-b border-[var(--line)] px-3 py-2.5 font-bold" />
  ),
  td: ({ children, ...props }: ComponentPropsWithoutRef<"td">) => (
    <td {...props} className="border-t border-[var(--line)] px-3 py-2.5 align-top">
      {children}
      {!containsComponent(children, AudioParagraph) && (
        <JapaneseExampleAudio>{children}</JapaneseExampleAudio>
      )}
    </td>
  ),
  tr: (props: ComponentPropsWithoutRef<"tr">) => (
    <tr {...props} className="odd:bg-[var(--surface)] even:bg-[var(--bg)]" />
  ),
  code: ({ className, ...props }: ComponentPropsWithoutRef<"code">) => (
    <code
      {...props}
      className={
        className
          ? `${className} font-mono text-[0.9em]`
          : "rounded bg-[var(--sakura-light)] px-1.5 py-0.5 font-japanese text-[0.92em] text-[var(--primary-fg)]"
      }
    />
  ),
  pre: (props: ComponentPropsWithoutRef<"pre">) => (
    <pre
      {...props}
      className="my-5 overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 text-sm leading-relaxed"
    />
  ),
  Ruby: ({ ja, rt }: { ja: string; rt: string }) => (
    <ruby className="font-japanese">
      {ja}
      <rp>(</rp>
      <rt>{rt}</rt>
      <rp>)</rp>
    </ruby>
  ),
  JapaneseExample: ({ ja, en, romaji }: { ja: string; en?: string; romaji?: string }) => (
    <div className="my-3 flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-xs">
      <div className="min-w-0 flex-1">
        <p lang="ja" className="font-japanese text-base font-semibold text-[var(--ink)]">
          {ja}
        </p>
        {en && <p className="mt-1 text-xs text-[var(--muted)]">{en}</p>}
        {romaji && <p className="mt-0.5 text-[11px] text-[var(--muted)]/80 italic">{romaji}</p>}
      </div>
      <AudioButton text={ja} size="sm" label={`Listen to ${ja}`} />
    </div>
  ),
  AudioButton: (props: React.ComponentProps<typeof AudioButton>) => <AudioButton {...props} />,
  KanjiReadingPill: (props: React.ComponentProps<typeof KanjiReadingPill>) => <KanjiReadingPill {...props} />,
};

export function MdxComponents({ source }: { source: string }) {
  return (
    <div className="learn-mdx">
      <MDXRemote
        source={source}
        options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
        components={mdxComponents}
      />
    </div>
  );
}
