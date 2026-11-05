"use client";

import { useEffect, useState } from "react";
import {
  getCacheMeta,
  isIndexedDbAvailable,
  saveDictionaryIndexToCache,
  saveShiritoriWordsToCache,
} from "@/lib/srs/cacheDb";
import type { ShiritoriWord } from "@/engine/shiritori";

export interface OfflineHydrationStatus {
  isReady: boolean;
  isOfflineReady: boolean;
  bundleHash?: string;
  error?: string | null;
}

interface ManifestPayload {
  schemaVersion: string;
  bundleHash: string;
  assets: Record<string, { hash: string; bytes: number }>;
}

let isHydrating = false;

export function useOfflineHydration(): OfflineHydrationStatus {
  const [status, setStatus] = useState<OfflineHydrationStatus>({
    isReady: false,
    isOfflineReady: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      // 1. Storage persistence
      try {
        if (typeof navigator !== "undefined" && navigator.storage?.persist) {
          void navigator.storage.persist().catch(() => {});
        }
      } catch {
        // Ignore persistence errors
      }

      if (!isIndexedDbAvailable()) {
        if (!cancelled) {
          setStatus({ isReady: true, isOfflineReady: false });
        }
        return;
      }

      if (isHydrating) return;
      isHydrating = true;

      try {
        // 2. Fetch manifest
        const manifestRes = await fetch("/data/v1/manifest.json", { cache: "no-cache" });
        if (!manifestRes.ok) {
          throw new Error(`Failed to fetch manifest: ${manifestRes.status}`);
        }
        const manifest: ManifestPayload = await manifestRes.json();
        const bundleHash = manifest.bundleHash;

        // 3. Hydrate Shiritori words if needed
        const shiritoriAsset = manifest.assets["shiritori/words.json"];
        if (shiritoriAsset) {
          const cachedMeta = await getCacheMeta("shiritori/words.json");
          if (!cachedMeta || cachedMeta.hash !== shiritoriAsset.hash) {
            const wordsRes = await fetch("/data/v1/shiritori/words.json", { cache: "force-cache" });
            if (wordsRes.ok) {
              const words: ShiritoriWord[] = await wordsRes.json();
              await saveShiritoriWordsToCache(words, shiritoriAsset.hash);
            }
          }
        }

        // 4. Hydrate Dictionary index if needed
        const dictAsset = manifest.assets["dictionary-index.json"];
        if (dictAsset) {
          const cachedMeta = await getCacheMeta("dictionary-index.json");
          if (!cachedMeta || cachedMeta.hash !== dictAsset.hash) {
            const dictRes = await fetch("/data/v1/dictionary-index.json", { cache: "force-cache" });
            if (dictRes.ok) {
              const dictData = await dictRes.json();
              await saveDictionaryIndexToCache(dictData, dictAsset.hash);
            }
          }
        }

        if (!cancelled) {
          setStatus({
            isReady: true,
            isOfflineReady: true,
            bundleHash,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setStatus({
            isReady: true,
            isOfflineReady: false,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      } finally {
        isHydrating = false;
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}

