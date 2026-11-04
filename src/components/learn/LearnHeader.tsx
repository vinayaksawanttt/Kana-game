import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function LearnHeader() {
  return (
    <nav className="pt-safe mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5">
      <Link
        href="/"
        className="flex min-h-11 items-center gap-2.5 transition-opacity hover:opacity-85"
        aria-label="Learning Hub home"
      >
        <span className="grid size-9 place-items-center rounded-full bg-[var(--primary)] font-japanese text-xl text-white">
          学
        </span>
        <span className="text-xs font-bold tracking-[0.18em] sm:text-sm">LEARNING HUB</span>
      </Link>
      <ThemeToggle />
    </nav>
  );
}
