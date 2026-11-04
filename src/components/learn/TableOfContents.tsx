"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

  return (
    <aside className="learn-no-print self-start lg:sticky lg:top-6">
      <div className="rounded-2xl border border-(--line) bg-(--surface) p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-extrabold uppercase tracking-[0.14em]">On this page</h2>
          <span className="text-[10px] font-bold tabular-nums text-(--muted)">{progress}% read</span>
        </div>
        <div
          role="progressbar"
          aria-label="Reading progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-(--line)"
        >
          <div className="h-full rounded-full bg-(--primary) transition-[width] duration-200" style={{ width: `${progress}%` }} />
        </div>
        {headings.length ? (
          <nav aria-label="On this page" className="mt-5">
            <ol className="border-l-2 border-(--line)">
              {headings.map((heading, index) => {
                const active = activeIndex === index;
                const passed = index <= activeIndex;
                return (
                  <li
                    key={`${heading.id}-${heading.level}`}
                    className={`-ml-0.5 border-l-2 transition-colors ${
                      active
                        ? "border-(--primary) bg-(--sakura-light)/50 text-(--primary-fg)"
                        : passed
                          ? "border-(--sakura) text-(--primary-fg)"
                          : "border-transparent text-(--muted)"
                    } ${heading.level === 3 ? "rounded-r-md" : ""}`}
                  >
                    <a
                      href={`#${heading.id}`}
                      className={`block truncate py-1.5 pr-2 text-left leading-snug transition-colors ${
                        heading.level === 3 ? "pl-6 text-[11px]" : "pl-3 text-xs"
                      } ${active ? "font-bold" : "font-medium hover:text-(--primary-fg)"}`}
                    >
                      {heading.text}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        ) : (
          <p className="mt-3 text-xs text-(--muted)">No section headings found in this document.</p>
        )}
        {practiceHref && (
          <div className="mt-6 border-t border-(--line) pt-5">
            <Link
              href={practiceHref}
              className="flex w-full items-center justify-center rounded-xl bg-(--primary) px-4 py-2.5 text-center text-xs font-bold text-white transition-opacity hover:opacity-90"
            >
              Practice related quizzes →
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
