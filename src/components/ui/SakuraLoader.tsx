import React from "react";

interface SakuraLoaderProps {
  /** Optional loading text displayed underneath */
  label?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Optional custom class name */
  className?: string;
}

export function SakuraLoader({
  label = "Loading...",
  size = "md",
  className = "",
}: SakuraLoaderProps) {
  const sizeMap = {
    sm: "size-8",
    md: "size-12",
    lg: "size-16",
  };

  const kanjiSizeMap = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  const selectedSize = sizeMap[size];

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 p-4 text-center select-none ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="relative flex items-center justify-center">
        {/* Subtle background pulse ring */}
        <div
          className={`${selectedSize} absolute rounded-full bg-[var(--primary)] opacity-10 animate-ping`}
        />

        {/* Animated Sakura SVG */}
        <svg
          className={`${selectedSize} animate-spin text-[var(--primary)] transition-colors duration-300`}
          viewBox="0 0 200 200"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          style={{ animationDuration: "3s" }}
        >
          {/* Sakura Petal Path derived from sakura_loading.svg */}
          <path d="M 96.48 27.2 c 0.96 2.24 2.56 4 3.52 4 0.96 -0 2.56 -1.76 3.52 -4 2.24 -4.8 4.32 -4.96 9.76 -0.8 6.4 4.96 12.32 18.72 13.44 30.88 0.64 7.84 1.6 10.72 2.88 10.08 1.12 -0.32 6.4 -1.6 11.68 -2.56 11.68 -2.4 25.6 -0 32 5.6 l 4.32 3.68 -3.52 3.84 c -4.8 5.12 -4.64 5.6 1.92 6.72 3.04 0.64 5.6 1.76 5.6 2.72 0 3.36 -6.4 13.6 -11.52 18.56 -5.12 4.96 -20.8 13.28 -24.96 13.28 -1.28 -0 -0.48 2.08 2.08 5.44 6.08 8 10.4 20.48 10.4 30.24 0 11.04 -2.56 14.72 -8.48 12.48 -6.08 -2.4 -5.92 -2.56 -5.92 3.84 0 5.44 -0.16 5.6 -6.56 5.6 -9.28 -0 -19.68 -5.6 -28.8 -15.68 l -7.84 -8.64 -7.84 8.64 c -9.12 10.08 -19.52 15.68 -28.8 15.68 -6.4 -0 -6.56 -0.16 -6.56 -5.6 0 -6.4 0.16 -6.24 -5.92 -3.84 -5.92 2.24 -8.48 -1.44 -8.48 -12.48 0 -9.76 4.32 -22.24 10.4 -30.24 2.56 -3.36 3.36 -5.44 2.08 -5.44 -4.16 -0 -19.84 -8.32 -24.96 -13.28 -5.12 -4.96 -11.52 -15.2 -11.52 -18.56 0 -0.96 2.56 -2.08 5.6 -2.72 6.56 -1.12 6.72 -1.6 2.08 -6.72 l -3.68 -3.84 4.32 -3.68 c 6.4 -5.6 20.32 -8 32 -5.6 5.28 0.96 10.56 2.24 11.84 2.72 1.76 0.64 2.24 -0.8 2.24 -5.6 0 -10.4 5.92 -26.72 11.84 -33.12 6.24 -6.56 9.44 -7.04 11.84 -1.6 z" />
          {/* Inner center circle cutout for legible kanji */}
          <circle cx="100" cy="100" r="24" className="fill-[var(--bg)]" />
        </svg>

        {/* Japanese Kanji Accent in Center */}
        <span
          className={`absolute font-japanese font-bold text-[var(--primary)] pointer-events-none select-none ${kanjiSizeMap[size]}`}
          aria-hidden="true"
        >
          待
        </span>
      </div>

      {label && (
        <p className="text-xs font-medium tracking-widest text-[var(--muted)] uppercase font-sans">
          {label}
        </p>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
}

