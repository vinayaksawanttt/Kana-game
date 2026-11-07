"use client";

import { useEffect } from "react";
import { useOfflineHydration } from "@/hooks/useOfflineHydration";

export function PwaRegister() {
  // Triggers background hydration of heavy assets into Dexie (nihongoCacheDb)
  useOfflineHydration();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // In development mode, unregister any lingering service worker so stale cached chunks don't hijack requests
    if (process.env.NODE_ENV === "development") {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          void reg.unregister();
        }
      });
      return;
    }

    // Register service worker in production / browser environments
    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (err) {
        // Suppress registration errors in environments where SW registration is blocked
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

