"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useGameSfx } from "@/hooks/useGameSfx";

export function SfxToggle() {
  const { sfxEnabled, toggleSfx } = useGameSfx();

  return (
    <button
      type="button"
      onClick={toggleSfx}
      aria-pressed={sfxEnabled}
      aria-label={sfxEnabled ? "Mute game sound effects" : "Unmute game sound effects"}
      title={sfxEnabled ? "Game SFX: On" : "Game SFX: Muted"}
      className={`grid size-11 place-items-center rounded-full border transition-colors cursor-pointer ${
        sfxEnabled
          ? "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary-fg)]"
          : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]/50 hover:text-[var(--ink)]"
      }`}
    >
      {sfxEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
  );
}
