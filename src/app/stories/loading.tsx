import { SakuraLoader } from "@/components/ui/SakuraLoader";

export default function StoriesLoading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
      <SakuraLoader label="Loading Stories..." size="md" />
    </main>
  );
}

