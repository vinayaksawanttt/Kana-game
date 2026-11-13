"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, ListOrdered, ArrowRight } from "lucide-react";
import type { LearnDoc } from "@/lib/content/learn-schema";

export function TableOfContents({
  headings,
  practiceHref,
}: {
  headings: LearnDoc["headings"];
  practiceHref: string | null;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const elements = headings
          .map((heading) => document.getElementById(heading.id))
          .filter((element): element is HTMLElement => element instanceof HTMLElement);
        let currentIndex = 0;
        elements.forEach((element, index) => {
          if (element.getBoundingClientRect().top <= 160) currentIndex = index;
        });
        setActiveIndex(currentIndex);

        const article = document.getElementById("learn-reading-content");
        if (article) {
          const bounds = article.getBoundingClientRect();
          const start = bounds.top + window.scrollY;
          const length = Math.max(article.scrollHeight - window.innerHeight, 1);
          const amount = (window.scrollY - start) / length;
          setProgress(Math.round(Math.min(1, Math.max(0, amount)) * 100));
        }
      });
    };

    const observer = new IntersectionObserver(update, { rootMargin: "-20% 0px -65% 0px" });
    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [headings]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", `#${id}`);
    }
    setMobileOpen(false);
  };

  return (
    <aside className="learn-no-print order-first self-start lg:order-last lg:sticky lg:top-6">
      {/* Mobile Collapsible TOC */}
      <div className="mb-4 block rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3.5 shadow-sm lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-toc-list"
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-[var(--sakura-light)] text-[var(--primary)]">
              <ListOrdered className="size-4" aria-hidden="true" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
              On this page ({headings.length})
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="rounded-full bg-[var(--paper-tint)] px-2 py-0.5 text-[10px] font-bold tabular-nums text-[var(--muted)]">
              {progress}% read
            </span>
            <ChevronDown
              className={`size-4 text-[var(--muted)] transition-transform duration-200 ${
                mobileOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </span>
        </button>

        <div
          id="mobile-toc-list"
          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
            mobileOpen ? "mt-3 grid-rows-[1fr] opacity-100 border-t border-[var(--line)] pt-3" : "grid-rows-[0fr] opacity-0"
          }`}
          aria-hidden={!mobileOpen}
        >
          <div className="min-h-0 overflow-hidden">
            <ol className="space-y-1">
              {headings.map((heading, index) => {
                const active = activeIndex === index;
                return (
                  <li key={`mobile-${heading.id}-${heading.level}`}>
                    <a
                      href={`#${heading.id}`}
                      onClick={(e) => handleLinkClick(e, heading.id)}
                      className={`block rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                        heading.level === 3 ? "pl-5 text-[11px]" : "font-semibold"
                      } ${
                        active
                          ? "bg-[var(--sakura-light)] font-bold text-[var(--primary)]"
                          : "text-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {heading.text}
                    </a>
                  </li>
                );
              })}
            </ol>
            {practiceHref && (
              <div className="mt-3 border-t border-[var(--line)] pt-3">
                <Link
                  href={practiceHref}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] px-3 py-2 text-center text-xs font-bold text-white transition hover:bg-[var(--primary-hover)]"
                >
                  <span>Practice related quizzes</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Sticky Sidebar */}
      <div className="hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm lg:block">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--ink)]">On this page</h2>
          <span className="text-[10px] font-bold tabular-nums text-[var(--muted)]">{progress}% read</span>
        </div>
        <div
          role="progressbar"
          aria-label="Reading progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]"
        >
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        {headings.length ? (
          <nav aria-label="On this page" className="mt-5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            <ol className="border-l-2 border-[var(--line)]">
              {headings.map((heading, index) => {
                const active = activeIndex === index;
                const passed = index <= activeIndex;
                return (
                  <li
                    key={`${heading.id}-${heading.level}`}
                    className={`-ml-0.5 border-l-2 transition-colors ${
                      active
                        ? "border-[var(--primary)] bg-[var(--sakura-light)]/60 text-[var(--primary)]"
                        : passed
                          ? "border-[var(--sakura)] text-[var(--ink)]"
                          : "border-transparent text-[var(--muted)]"
                    } ${heading.level === 3 ? "rounded-r-md" : ""}`}
                  >
                    <a
                      href={`#${heading.id}`}
                      onClick={(e) => handleLinkClick(e, heading.id)}
                      className={`block truncate py-1.5 pr-2 text-left leading-snug transition-colors ${
                        heading.level === 3 ? "pl-6 text-[11px]" : "pl-3 text-xs"
                      } ${active ? "font-bold text-[var(--primary)]" : "font-medium hover:text-[var(--primary)]"}`}
                    >
                      {heading.text}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        ) : (
          <p className="mt-3 text-xs text-[var(--muted)]">No section headings found in this document.</p>
        )}
        {practiceHref && (
          <div className="mt-6 border-t border-[var(--line)] pt-4">
            <Link
              href={practiceHref}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-center text-xs font-bold text-white transition hover:bg-[var(--primary-hover)]"
            >
              <span>Practice related quizzes</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
