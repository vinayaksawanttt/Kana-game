"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SakuraLoader } from "@/components/ui/SakuraLoader";

export default function RadicalPracticePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/games/kanji/reading?view=radicals");
  }, [router]);

  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
      <SakuraLoader label="Redirecting to Kanji & Radical Studio..." size="md" />
    </main>
  );
}
