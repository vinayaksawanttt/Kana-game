import { SakuraLoader } from "@/components/ui/SakuraLoader";

export default function GamesLoading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
      <SakuraLoader label="Preparing Game..." size="md" />
    </main>
  );
}

