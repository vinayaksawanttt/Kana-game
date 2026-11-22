"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Loader2, WifiOff } from "lucide-react";
import { collectTextbookOfflineAssetUrls } from "@/features/books/engine/offlinePack";
import { cn } from "./ui/tokens";

const OFFLINE_CACHE_NAME = "textbook-offline-v1";
const CONCURRENCY = 8;

type PackState = "idle" | "downloading" | "ready" | "error";

/**
 * Pre-caches all Textbook Companion JSONs, book covers, dialogue scene backgrounds,
 * character avatars, and 374 Gemini TTS dialogue audio clips into CacheStorage.
 */
export function TextbookOfflineButton() {
  const assetUrls = useMemo(() => collectTextbookOfflineAssetUrls(), []);
  const [state, setState] = useState<PackState>("idle");
  const [progress, setProgress] = useState({ done: 0, total: assetUrls.length });
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (typeof window === "undefined" || !("caches" in window)) {
          if (!cancelled) setSupported(false);
          return null;
        }
        return window.caches.open(OFFLINE_CACHE_NAME).then((cache) => cache.keys());
      })
      .then((keys) => {
        if (cancelled || !keys) return;
        const cachedCount = keys.length;
        if (cachedCount >= assetUrls.length) {
          setState("ready");
          setProgress({ done: assetUrls.length, total: assetUrls.length });
        } else if (cachedCount > 0) {
          setProgress({ done: cachedCount, total: assetUrls.length });
        }
      })
      .catch(() => {
        // Ignore CacheStorage errors in restricted contexts
      });

    return () => {
      cancelled = true;
    };
  }, [assetUrls.length]);

  const handleDownload = useCallback(async () => {
    if (typeof window === "undefined" || !("caches" in window)) return;
    setState("downloading");
    setProgress({ done: 0, total: assetUrls.length });

    try {
      const cache = await window.caches.open(OFFLINE_CACHE_NAME);
      let completed = 0;
      let cursor = 0;
      let failed = 0;

      const worker = async () => {
        while (cursor < assetUrls.length) {
          const url = assetUrls[cursor++];
          try {
            const existing = await cache.match(url);
            if (!existing) {
              const res = await fetch(url);
              if (res.ok) {
                await cache.put(url, res);
              } else {
                failed++;
              }
            }
          } catch {
            failed++;
          } finally {
            completed++;
            setProgress({ done: completed, total: assetUrls.length });
          }
        }
      };

      await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
      setState(failed === 0 ? "ready" : "error");
    } catch {
      setState("error");
    }
  }, [assetUrls]);

  if (!supported) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--tb-text-secondary)]"
        title="Offline caching requires HTTPS or localhost"
      >
        <WifiOff className="size-3.5" />
        <span>HTTPS / localhost needed for offline</span>
      </span>
    );
  }

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={state === "downloading"}
      className={cn(
        "tb-focus-ring inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer disabled:cursor-wait",
        state === "ready"
          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : state === "error"
          ? "border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          : "border border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] hover:text-[var(--primary-fg)]"
      )}
      title="Download all Textbook Companion JSONs, dialogue art, avatars, and 374 dialogue audios (~20 MB) for 100% offline use"
    >
      {state === "downloading" ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          <span>
            Caching {progress.done}/{progress.total} ({pct}%)
          </span>
        </>
      ) : state === "ready" ? (
        <>
          <CheckCircle2 className="size-3.5" />
          <span>Offline Ready ({assetUrls.length} files)</span>
        </>
      ) : state === "error" ? (
        <>
          <Download className="size-3.5" />
          <span>Retry Offline Pack ({progress.done}/{progress.total})</span>
        </>
      ) : (
        <>
          <Download className="size-3.5" />
          <span>Save Dialogues & Art Offline (~20 MB)</span>
        </>
      )}
    </button>
  );
}
