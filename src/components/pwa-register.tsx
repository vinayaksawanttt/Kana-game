"use client";

import { useEffect } from "react";
import { useOfflineHydration } from "@/hooks/useOfflineHydration";

export function PwaRegister() {
  // Triggers background hydration of heavy assets into Dexie (nihongoCacheDb)
  useOfflineHydration();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Register service worker in production / browser environments
    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (err) {
        // Suppress registration errors in environments where SW registration is blocked or dev mode
        if (process.env.NODE_ENV === "development") {
          console.debug("[PwaRegister] Service Worker registration skipped or failed:", err);
        }
      }
    };

    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener("load", () => void register(), { once: true });
    }
  }, []);

  return null;
}

