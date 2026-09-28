"use client";

import { useEffect } from "react";

const STORAGE_KEY = "rutero:last-build-id:v2";
const RELOAD_FLAG_KEY = "rutero:reload-in-progress";
const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const AUTH_PATHS = new Set(["/login", "/mobile-login", "/register", "/device-setup"]);

async function clearNativeWebCaches() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}

async function getServerBuildId() {
  const response = await fetch(`/api/app-version?ts=${Date.now()}`, {
    cache: "no-store",
    headers: { Accept: "application/json" }
  });
  if (!response.ok) return null;
  const payload = await response.json() as { buildId?: unknown };
  return typeof payload.buildId === "string" && payload.buildId ? payload.buildId : null;
}

function canReloadNow() {
  if (document.visibilityState !== "visible") return false;
  if (document.readyState !== "complete") return false;
  return !AUTH_PATHS.has(window.location.pathname);
}

export function NativeAutoUpdate() {
  useEffect(() => {
    let disposed = false;
    let checking = false;
    let intervalId: number | null = null;
    let isNative = false;

    async function checkForUpdate() {
      if (!isNative || checking || disposed) return;
      checking = true;
      try {
        const buildId = await getServerBuildId();
        if (!buildId || disposed) return;

        const previousBuildId = window.localStorage.getItem(STORAGE_KEY);
        if (!previousBuildId) {
          window.localStorage.setItem(STORAGE_KEY, buildId);
          return;
        }

        if (previousBuildId !== buildId && canReloadNow()) {
          window.localStorage.setItem(STORAGE_KEY, buildId);
          window.sessionStorage.setItem(RELOAD_FLAG_KEY, "1");
          await clearNativeWebCaches();
          window.setTimeout(() => {
            const url = new URL(window.location.href);
            url.searchParams.set("rutero_build", buildId);
            window.location.replace(url.toString());
          }, 1500);
        } else if (window.sessionStorage.getItem(RELOAD_FLAG_KEY) === "1") {
          window.sessionStorage.removeItem(RELOAD_FLAG_KEY);
        }
      } catch {
        // Network and transient server errors should not block the mobile app.
      } finally {
        checking = false;
      }
    }

    void import("@capacitor/core").then(({ Capacitor }) => {
      if (!Capacitor.isNativePlatform() || disposed) return;

      isNative = true;
      void checkForUpdate();
      intervalId = window.setInterval(() => void checkForUpdate(), CHECK_INTERVAL_MS);
    });

    const onFocus = () => void checkForUpdate();
    const onResume = () => {
      if (document.visibilityState === "visible") void checkForUpdate();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onResume);

    return () => {
      disposed = true;
      if (intervalId) window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onResume);
    };
  }, []);

  return null;
}
