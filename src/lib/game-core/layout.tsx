import Link from "next/link";
import type { PointerEventHandler, ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SfxToggle } from "@/components/sfx-toggle";

export function GameHeader({
  label,
  glyph,
  rightSlot,
  onNavigateHome,
  homeHref = "/",
}: {
  label: string;
  glyph: string;
  rightSlot?: ReactNode;
  onNavigateHome?: () => void;
  homeHref?: string;
}) {
  return (
    <nav className="pt-safe mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8 sm:py-6">
      <Link
        className="flex min-h-11 items-center gap-2.5"
        href={homeHref}
        aria-label={`${label} home`}
        {...(onNavigateHome
          ? {
              onClick: (event) => {
                event.preventDefault();
                onNavigateHome();
              },
            }
          : {})}
      >
        <span className="grid size-9 place-items-center rounded-full bg-[var(--primary)] font-japanese text-xl text-white">
          {glyph}
        </span>
        <span className="text-sm font-bold tracking-[0.18em]">{label}</span>
      </Link>
      <div className="flex items-center gap-2.5">
        {rightSlot}
        <SfxToggle />
        <ThemeToggle />
      </div>
    </nav>
  );
}

export function GameLayout({
  label,
  glyph,
  children,
  className = "",
  rightSlot,
  onNavigateHome,
  homeHref = "/",
  onPointerDown,
}: {
  label: string;
  glyph: string;
  children: ReactNode;
  className?: string;
  rightSlot?: ReactNode;
  onNavigateHome?: () => void;
  homeHref?: string;
  onPointerDown?: PointerEventHandler<HTMLElement>;
}) {
  return (
    <main
      className={`pb-safe relative flex min-h-dvh flex-col bg-[var(--bg)] text-[var(--ink)] ${className}`}
      onPointerDown={onPointerDown}
    >
      <GameHeader
        label={label}
        glyph={glyph}
        rightSlot={rightSlot}
        onNavigateHome={onNavigateHome}
        homeHref={homeHref}
      />
      {children}
    </main>
  );
}
