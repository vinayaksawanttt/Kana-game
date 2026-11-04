import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LearnHeader } from "@/components/learn/LearnHeader";
import { MdxComponents } from "@/components/learn/MdxComponents";
import { PrintButton } from "@/components/learn/PrintButton";
import { TableOfContents } from "@/components/learn/TableOfContents";
import { getAllLearnDocs, getLearnDocBySlug } from "@/lib/content/learn";

interface LearnSection {
  lead: string;
  subsections: string[];
}

function splitLearnContent(content: string): { intro: string; sections: LearnSection[] } {
  const introLines: string[] = [];
  const sections: LearnSection[] = [];
  let section: LearnSection | null = null;
  let currentLines: string[] = [];
  let currentKind: "lead" | "subsection" = "lead";
  let fence: string | null = null;

  const flush = () => {
    if (!section || !currentLines.length) return;
    const chunk = currentLines.join("\n").trim();
    if (chunk) {
      if (currentKind === "lead") section.lead = chunk;
      else section.subsections.push(chunk);
    }
    currentLines = [];
  };

  for (const line of content.split(/\r?\n/)) {
    const fenceLine = /^\s*(```+|~~~+)/.exec(line)?.[1];
    if (fenceLine) {
      if (!fence) fence = fenceLine.slice(0, 3);
      else if (fenceLine.startsWith(fence)) fence = null;
      currentLines.push(line);
      continue;
    }

    if (!fence && /^##\s+/.test(line)) {
      flush();
      if (section) sections.push(section);
      section = { lead: "", subsections: [] };
      currentKind = "lead";
      currentLines = [line];
    } else if (!fence && section && /^###\s+/.test(line)) {
      flush();
      currentKind = "subsection";
      currentLines = [line];
    } else if (section) {
      currentLines.push(line);
    } else {
      introLines.push(line);
    }
  }
  flush();
  if (section) sections.push(section);
  return { intro: introLines.join("\n").trim(), sections };
}

export function generateStaticParams() {
  return getAllLearnDocs().map(({ slug }) => ({ slug }));
}

export default function LearnDocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <main className="learn-reader min-h-dvh bg-[var(--bg)] text-[var(--ink)]">
      <LearnHeader />
      <div className="mx-auto w-full max-w-6xl px-5 pb-12 pt-2 sm:px-8 sm:pt-3">
        <Suspense
          fallback={
            <div className="py-16 text-center text-sm text-[var(--muted)]">
              Loading study guide...
            </div>
          }
        >
          <LearnDocumentContent params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function LearnDocumentContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getLearnDocBySlug(slug);
  if (!doc) notFound();

  const practiceHref =
    doc.frontmatter.category === "Kanji"
      ? "/games/kanji/meaning"
      : doc.frontmatter.category === "Verbs" ||
          doc.frontmatter.category === "Particles and grammar"
        ? "/games/grammar"
        : doc.frontmatter.category === "Vocabulary"
          ? "/games/vocabulary"
          : null;
  const { intro, sections } = splitLearnContent(doc.content);

  return (
    <>
      <title>{`${doc.frontmatter.title} | Learning Hub`}</title>
      {doc.frontmatter.summary && (
        <meta name="description" content={doc.frontmatter.summary} />
      )}
      <div className="learn-no-print mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/learn"
            className="font-semibold text-[var(--primary-fg)] hover:underline"
          >
            ← Back to Learning Hub
          </Link>
          <span className="text-[var(--muted)]">/</span>
          <span className="text-[var(--muted)]">{doc.frontmatter.category}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-white shadow-xs whitespace-nowrap">
            {doc.frontmatter.jlpt}
          </span>
          <PrintButton />
        </div>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article id="learn-reading-content" className="min-w-0 space-y-6">
          <header className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm sm:p-8">
            <span className="absolute inset-x-0 top-0 h-1 bg-[var(--sakura)]" aria-hidden="true" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[var(--primary-fg)]">
                {doc.frontmatter.category}
              </span>
              <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-xs whitespace-nowrap">
                {doc.frontmatter.jlpt}
              </span>
            </div>
            <h1 className="mt-4 text-2xl font-extrabold leading-tight sm:text-3xl">{doc.frontmatter.title}</h1>
            {doc.frontmatter.summary && (
              <p className="mb-0 mt-3 text-sm leading-relaxed text-[var(--muted)]">{doc.frontmatter.summary}</p>
            )}
            {intro && <div className="mt-3 border-t border-[var(--line)] pt-2"><MdxComponents source={intro} /></div>}
          </header>
          {sections.map((section, index) => (
            <section key={`${doc.headings.filter((heading) => heading.level === 2)[index]?.id ?? index}`} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm sm:p-8">
              <MdxComponents source={section.lead} />
              {section.subsections.map((subsection, subsectionIndex) => (
                <div key={subsectionIndex} className="my-4 rounded-xl border border-[var(--line)] bg-[var(--bg)]/60 p-4 sm:p-5">
                  <MdxComponents source={subsection} />
                </div>
              ))}
            </section>
          ))}
        </article>

        <TableOfContents headings={doc.headings} practiceHref={practiceHref} />
      </div>
    </>
  );
}
