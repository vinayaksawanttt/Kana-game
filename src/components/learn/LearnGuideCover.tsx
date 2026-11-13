"use client";

import { useState } from "react";

const DEFAULT_LEARN_FALLBACK = "/images/learn/fallbacks/default.svg";

type ImageStatus = "loading" | "loaded" | "error";

export function LearnGuideCover({
  src,
  fallback,
  alt,
  className = "",
}: {
  src: string;
  fallback: string;
  alt: string;
  className?: string;
}) {
  const [status, setStatus] = useState<ImageStatus>("loading");
  const [fallbackSrc, setFallbackSrc] = useState(fallback);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fallbackSrc}
        alt=""
        aria-hidden="true"
        data-testid="learn-guide-fallback"
        onError={() => {
          if (fallbackSrc !== DEFAULT_LEARN_FALLBACK) {
            setFallbackSrc(DEFAULT_LEARN_FALLBACK);
          }
        }}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${
          status === "loaded" ? "opacity-0" : "opacity-100"
        }`}
      />
      {status !== "error" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          data-testid="learn-guide-image"
          data-status={status}
          ref={(node) => {
            if (node?.complete && node.naturalWidth > 0 && status === "loading") {
              setStatus("loaded");
            }
          }}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className={`relative z-10 h-full max-h-full w-auto max-w-full object-contain transition-opacity duration-500 motion-reduce:transition-none ${className} ${
            status === "loaded" ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
