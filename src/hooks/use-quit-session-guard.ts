"use client";

import { useEffect, useState } from "react";

export function useQuitSessionGuard(enabled: boolean) {
  const [quitDialogOpen, setQuitDialogOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    window.history.pushState({ ...window.history.state, __kanaGameQuitGuard: true }, "", window.location.href);

    function onPopState() {
      setQuitDialogOpen(true);
      window.history.pushState({ ...window.history.state, __kanaGameQuitGuard: true }, "", window.location.href);
    }

    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("popstate", onPopState);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [enabled]);

  return {
    quitDialogOpen,
    requestQuit: () => setQuitDialogOpen(true),
    cancelQuit: () => setQuitDialogOpen(false),
    confirmQuit: () => setQuitDialogOpen(false),
  };
}

