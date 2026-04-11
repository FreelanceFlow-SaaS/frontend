"use client";

import { Label } from "@/components/ui/label";
import { THEMES, APPEARANCES, type AppearanceId, type ThemeId } from "@/lib/theme/constants";
import { useThemeConfig } from "@/components/theme-provider";

const THEME_LABELS: Record<ThemeId, string> = {
  default: "Par défaut",
  ocean: "Océan",
  forest: "Forêt",
  "high-contrast": "Contraste élevé",
};

const APPEARANCE_LABELS: Record<AppearanceId, string> = {
  system: "Système",
  light: "Clair",
  dark: "Sombre",
};

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, appearance, setTheme, setAppearance } = useThemeConfig();

  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6 ${className ?? ""}`}>
      <div className="grid w-full max-w-xs gap-2">
        <Label htmlFor="theme-select">Thème</Label>
        <select
          id="theme-select"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          value={theme}
          onChange={(e) => setTheme(e.target.value as ThemeId)}
        >
          {THEMES.map((t) => (
            <option key={t} value={t}>
              {THEME_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid w-full max-w-xs gap-2">
        <Label htmlFor="appearance-select">Apparence</Label>
        <select
          id="appearance-select"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          value={appearance}
          onChange={(e) => setAppearance(e.target.value as AppearanceId)}
        >
          {APPEARANCES.map((a) => (
            <option key={a} value={a}>
              {APPEARANCE_LABELS[a]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
