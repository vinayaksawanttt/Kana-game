"use client";

import React from "react";
import { Sparkles, AlertTriangle, Skull, CheckCircle } from "lucide-react";

interface AtmosphereMeterProps {
  value: number; // 0 to 100
}

export const AtmosphereMeter: React.FC<AtmosphereMeterProps> = ({ value }) => {
  // Determine color and mood label based on current value
  let moodLabel = "Normal";
  let moodColor = "text-amber-400";
  let barGradient = "from-amber-500 to-emerald-400";
  let Icon = Sparkles;

  if (value >= 85) {
    moodLabel = "Very Warm & Friendly (大好評)";
    moodColor = "text-emerald-400";
    barGradient = "from-emerald-500 to-teal-300";
    Icon = CheckCircle;
  } else if (value >= 60) {
    moodLabel = "Polite & Helpful (良好)";
    moodColor = "text-emerald-300";
    barGradient = "from-emerald-400 to-emerald-500";
    Icon = Sparkles;
  } else if (value >= 35) {
    moodLabel = "Slightly Awkward (ぎこちない)";
    moodColor = "text-amber-400";
    barGradient = "from-amber-500 to-orange-400";
    Icon = AlertTriangle;
  } else {
    moodLabel = "Cold / Disturbed (気まずい)";
    moodColor = "text-rose-400";
    barGradient = "from-rose-600 to-rose-400";
    Icon = Skull;
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] px-4 py-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium text-[var(--muted)]">
          <Icon className={`size-3.5 ${moodColor}`} />
          Social Atmosphere (空気)
        </span>
        <span className={`font-semibold ${moodColor}`}>
          {value}% · {moodLabel}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/20">
        <div
          className={`h-full bg-gradient-to-r ${barGradient} transition-all duration-500 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};
