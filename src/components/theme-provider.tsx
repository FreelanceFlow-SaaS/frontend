"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
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
  const [theme, setThemeState] = useState<ThemeId>(() =>
    typeof window !== "undefined" ? readStoredTheme() : DEFAULT_THEME,
  );
  const [appearance, setAppearanceState] = useState<AppearanceId>(() =>
    typeof window !== "undefined" ? readStoredAppearance() : DEFAULT_APPEARANCE,
  );

  useLayoutEffect(() => {
    paintDom(theme, appearance);
  }, [theme, appearance]);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, appearance);
  }, [theme, appearance]);

  useEffect(() => {
    if (appearance !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => paintDom(theme, appearance);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [appearance, theme]);

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
