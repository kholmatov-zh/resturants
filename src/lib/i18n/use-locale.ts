"use client";
import { useEffect, useSyncExternalStore } from "react";
import type { Locale } from "./dictionaries";
let fallback: Locale = "uz";
function subscribe(callback: () => void) {
  window.addEventListener("dasturxon-locale", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("dasturxon-locale", callback);
    window.removeEventListener("storage", callback);
  };
}
function snapshot(): Locale {
  try {
    const saved = localStorage.getItem("dasturxon-locale");
    return saved === "ru" ? "ru" : saved === "uz" ? "uz" : fallback;
  } catch {
    return fallback;
  }
}
const serverSnapshot = (): Locale => "uz";
export function useLocale() {
  const locale = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  function changeLocale(next: Locale) {
    fallback = next;
    try {
      localStorage.setItem("dasturxon-locale", next);
    } catch {
      /* Use in-memory preference if storage is unavailable. */
    }
    window.dispatchEvent(new Event("dasturxon-locale"));
  }
  return { locale, changeLocale };
}
