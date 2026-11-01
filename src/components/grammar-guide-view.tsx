"use client";

import type { ComponentPropsWithoutRef } from "react";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

const mdxComponents = {
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2
      {...props}
      className="mt-6 mb-2.5 border-b border-[var(--line)] pb-1.5 text-sm font-bold tracking-[0.14em] text-[var(--primary)] uppercase first:mt-0"
    />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p {...props} className="my-2.5 text-sm leading-relaxed text-[var(--ink)]" />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol {...props} className="my-3 list-decimal space-y-3 pl-5 text-sm text-[var(--ink)]" />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul {...props} className="my-1.5 list-disc space-y-1 pl-5 text-xs text-[var(--muted)]" />
  ),
  li: (props: ComponentPropsWithoutRef<"li">) => (
    <li {...props} className="leading-relaxed" />
  ),
  strong: (props: ComponentPropsWithoutRef<"strong">) => (
    <strong {...props} lang="ja" className="font-japanese text-base font-semibold text-[var(--ink)]" />
  ),
  em: (props: ComponentPropsWithoutRef<"em">) => (
    <em {...props} className="text-xs not-italic text-[var(--muted)]" />
  ),
  code: (props: ComponentPropsWithoutRef<"code">) => (
    <code
      {...props}
      className="inline-block rounded-md border border-[var(--line)] bg-[var(--paper-tint)] px-3 py-1.5 font-japanese text-sm font-semibold text-[var(--ink)]"
    />
  ),
};

export function GrammarGuideView({ mdxSource }: { mdxSource: MDXRemoteSerializeResult }) {
  return (
    <div className="grammar-mdx">
      <MDXRemote {...mdxSource} components={mdxComponents} />
    </div>
  );
}

