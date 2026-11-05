import { SakuraLoader } from "@/components/ui/SakuraLoader";

export default function LearnLoading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
      <SakuraLoader label="Loading Study Guides..." size="md" />
    </main>
  );
}

