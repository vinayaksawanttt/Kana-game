import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MdxComponents } from "@/components/learn/MdxComponents";
import { PrintButton } from "@/components/learn/PrintButton";
import { getAllLearnDocs, getLearnDocBySlug } from "@/lib/content/learn";

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
      <div className="mx-auto w-full max-w-6xl px-5 pb-12 pt-6 sm:px-8 sm:pt-9">
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

  return (
    <>
      <title>{`${doc.frontmatter.title} | Learning Hub`}</title>
      {doc.frontmatter.summary && (
        <meta name="description" content={doc.frontmatter.summary} />
      )}
      <div className="learn-no-print mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
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
          <span className="rounded-full bg-[var(--primary)] px-3 py-1.5 text-[11px] font-extrabold text-white">
            {doc.frontmatter.jlpt}
          </span>
          <PrintButton />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
        <article className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_14px_38px_rgba(188,0,45,0.045)] sm:p-8">
          <header className="mb-8 border-b border-[var(--line)] pb-5">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--primary-fg)]">
              {doc.frontmatter.category}
            </p>
            <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">
              {doc.frontmatter.title}
            </h1>
            {doc.frontmatter.summary && (
              <p className="mb-0 mt-3 text-sm leading-relaxed text-[var(--muted)]">
                {doc.frontmatter.summary}
              </p>
            )}
          </header>
          <MdxComponents source={doc.content} />
        </article>

        <aside className="learn-no-print self-start lg:sticky lg:top-6">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
            <h2 className="text-xs font-extrabold uppercase tracking-[0.14em]">
              On this page
            </h2>
            {doc.headings.length ? (
              <nav aria-label="On this page" className="mt-4">
                <ol className="space-y-2.5">
                  {doc.headings.map((heading) => (
                    <li
                      key={`${heading.id}-${heading.level}`}
                      className={heading.level === 3 ? "pl-3 text-xs" : "text-sm"}
                    >
                      <a
                        href={`#${heading.id}`}
                        className="text-[var(--muted)] hover:text-[var(--primary-fg)]"
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            ) : (
              <p className="mt-3 text-xs text-[var(--muted)]">
                No section headings found in this document.
              </p>
            )}

            {practiceHref && (
              <div className="mt-6 border-t border-[var(--line)] pt-5">
                <Link
                  href={practiceHref}
                  className="flex w-full items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2.5 text-center text-xs font-bold text-white transition-opacity hover:opacity-90"
                >
                  Practice related quizzes →
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
