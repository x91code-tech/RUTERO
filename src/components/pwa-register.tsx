"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;

    void import("@capacitor/core").then(({ Capacitor }) => {
      if (Capacitor.isNativePlatform()) {
        void navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => void registration.unregister());
        });
        if ("caches" in window) {
          void caches.keys().then((keys) => keys.forEach((key) => void caches.delete(key)));
        }
        return;
      }

      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }).catch(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    });
  }, []);

  return null;
}
