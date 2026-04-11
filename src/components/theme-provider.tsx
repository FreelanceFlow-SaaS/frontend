"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  type AppearanceId,
  type ThemeId,
} from "@/lib/theme/constants";

type ColorMode = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeId;
  appearance: AppearanceId;
  setTheme: (t: ThemeId) => void;
  setAppearance: (a: AppearanceId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const v = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (v === "default" || v === "ocean" || v === "forest" || v === "high-contrast") return v;
  return DEFAULT_THEME;
}

function readStoredAppearance(): AppearanceId {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE;
  const v = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
  if (v === "system" || v === "light" || v === "dark") return v;
  return DEFAULT_APPEARANCE;
}

function resolveColorMode(appearance: AppearanceId): ColorMode {
  if (appearance === "dark") return "dark";
  if (appearance === "light") return "light";
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function paintDom(theme: ThemeId, appearance: AppearanceId) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.dataset.appearance = appearance;
  root.dataset.colorMode = resolveColorMode(appearance);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);
  const [appearance, setAppearanceState] = useState<AppearanceId>(DEFAULT_APPEARANCE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const t = readStoredTheme();
    const a = readStoredAppearance();
    setThemeState(t);
    setAppearanceState(a);
    paintDom(t, a);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    paintDom(theme, appearance);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, appearance);
  }, [theme, appearance, hydrated]);

  useEffect(() => {
    if (!hydrated || appearance !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => paintDom(theme, appearance);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [appearance, theme, hydrated]);

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
  }, []);

  const setAppearance = useCallback((a: AppearanceId) => {
    setAppearanceState(a);
  }, []);

  const value = useMemo(
    () => ({ theme, appearance, setTheme, setAppearance }),
    [theme, appearance, setTheme, setAppearance],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeConfig() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeConfig must be used within ThemeProvider");
  }
  return ctx;
}
