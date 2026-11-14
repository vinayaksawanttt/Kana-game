"use client";

import React, { useState, useEffect } from "react";
import { getScenarioBackgroundUrl } from "@/data/dialogue/assets";

interface VnBackgroundProps {
  scenarioId: string;
  backgroundKey?: string;
  theme?: string;
  locationName?: string;
}

const THEME_GRADIENTS: Record<string, string> = {
  street: "from-amber-900/30 via-slate-900/40 to-slate-950/70",
  station: "from-blue-900/30 via-slate-900/40 to-slate-950/70",
  office: "from-emerald-900/20 via-slate-900/30 to-slate-950/70",
  store: "from-orange-900/25 via-slate-900/35 to-slate-950/70",
  apartment: "from-rose-900/20 via-slate-900/35 to-slate-950/70",
  countryside: "from-lime-900/25 via-emerald-950/40 to-slate-950/70",
};

export const VnBackground: React.FC<VnBackgroundProps> = ({
  scenarioId,
  backgroundKey,
  theme = "street",
}) => {
  const bgUrl = getScenarioBackgroundUrl(scenarioId, backgroundKey);
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(bgUrl);
  const [fadeOpacity, setFadeOpacity] = useState(1);

  // Smooth cross-fade transition without locking to black
  useEffect(() => {
    let active = true;
    if (bgUrl && bgUrl !== currentUrl) {
      setFadeOpacity(0.4);
      const timer = setTimeout(() => {
        if (active) {
          setCurrentUrl(bgUrl);
          setFadeOpacity(1);
        }
      }, 150);

      return () => {
        active = false;
        clearTimeout(timer);
      };
    } else if (bgUrl && !currentUrl) {
      setCurrentUrl(bgUrl);
      setFadeOpacity(1);
    }
  }, [bgUrl, currentUrl]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950 select-none">
      {currentUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentUrl}
          alt="Visual novel scene background"
          className="h-full w-full object-cover object-center transition-opacity duration-300 ease-out"
          style={{ opacity: fadeOpacity }}
        />
      ) : (
        /* Procedural Fallback when custom artwork is not yet supplied */
        <div className="relative h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(244,114,182,0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        </div>
      )}

      {/* Cinematic Vignette & Lighting Gradients */}
      <div
        className={`absolute inset-0 bg-gradient-to-t ${
          THEME_GRADIENTS[theme] || THEME_GRADIENTS.street
        } pointer-events-none`}
      />
      {/* Bottom shadow gradient to ensure text readability */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
      {/* Top subtle shadow for HUD bar contrast */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
    </div>
  );
};
