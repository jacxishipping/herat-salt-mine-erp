"use client";

import { useEffect } from "react";

export function SwRegistrar() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Ignore registration errors in restricted contexts
      });
    }
  }, []);

  return null;
}
