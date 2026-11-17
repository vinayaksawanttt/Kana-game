"use client";

import { useEffect, useState } from "react";
import { getDueCards } from "@/lib/srs/service";

export function DueReviewCount() {
  const [dueCount, setDueCount] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    getDueCards()
      .then((dueCards) => {
        if (active) setDueCount(dueCards.length);
      })
      .catch((error: unknown) => {
        console.error("Could not load the due review count.", error);
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <span
      className="min-w-28 rounded-xl bg-[var(--sakura-light)] px-4 py-3 text-center"
      aria-live="polite"
      aria-label={
        loadError
          ? "Review count unavailable"
          : dueCount === null
          ? "Review counts are loading"
          : `${dueCount} cards due for review`
      }
    >
      <strong className="block font-japanese text-2xl leading-none text-[var(--primary-fg)]">
        {loadError ? "—" : dueCount ?? "…"}
      </strong>
      <span className="mt-1 block text-[11px] font-semibold text-[var(--muted)]">
        {loadError ? "count unavailable" : dueCount === 1 ? "card due" : "cards due"}
      </span>
    </span>
  );
}
