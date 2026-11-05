import { SakuraLoader } from "@/components/ui/SakuraLoader";

export default function GlobalLoading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
      <SakuraLoader label="Loading Kana Game..." size="lg" />
    </main>
  );
}

