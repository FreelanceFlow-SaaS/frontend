"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Lightbulb, X } from "lucide-react";
import { useThemeConfig } from "@/components/theme-provider";
import { DarkTheme } from "@/components/ui/dark-theme";
import { LightTheme } from "@/components/ui/light-theme";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SystemTheme } from "@/components/ui/system-theme";
import { cn } from "@/lib/utils";

type AppearanceType = "light" | "dark" | "system";

interface ThemeOption {
  value: AppearanceType;
  label: string;
  icon: React.ComponentType;
}

const THEME_PANEL_SEEN_KEY = "ff_theme_panel_seen";

const themes: ThemeOption[] = [
  { value: "light", label: "Clair", icon: LightTheme },
  { value: "dark", label: "Sombre", icon: DarkTheme },
  { value: "system", label: "Système", icon: SystemTheme },
];

export function ThemeToggle({
  className,
  defaultOpen = false,
  autoOpenOnFirstLogin = false,
}: {
  className?: string;
  defaultOpen?: boolean;
  autoOpenOnFirstLogin?: boolean;
}) {
  const [mounted, setMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [systemTheme, setSystemTheme] = React.useState<"dark" | "light">("light");
  const { appearance, setAppearance } = useThemeConfig();

  React.useEffect(() => {
    setMounted(true);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemTheme(media.matches ? "dark" : "light");
    const listener = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? "dark" : "light");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  React.useEffect(() => {
    if (!mounted || !autoOpenOnFirstLogin) return;
    const seen = window.localStorage.getItem(THEME_PANEL_SEEN_KEY);
    if (!seen) {
      setIsOpen(true);
      window.localStorage.setItem(THEME_PANEL_SEEN_KEY, "1");
    }
  }, [autoOpenOnFirstLogin, mounted]);

  if (!mounted) return null;

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm hover:bg-muted"
        aria-expanded={isOpen}
        aria-controls="theme-toggle-panel"
      >
        <Lightbulb className="h-4 w-4" />
        <span>Thème</span>
      </button>

      {isOpen ? (
        <div
          id="theme-toggle-panel"
          className="absolute right-0 z-50 mt-2 w-[320px] rounded-lg border border-border bg-card p-3 shadow-lg"
          role="dialog"
          aria-label="Sélecteur de thème"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              Choisir le mode d&apos;affichage
            </p>
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <RadioGroup
            defaultValue={appearance}
            onValueChange={(value: AppearanceType) => setAppearance(value)}
            className="grid gap-3 sm:grid-cols-3"
          >
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isSelected = appearance === themeOption.value;
              const currentSystemTheme =
                themeOption.value === "system" ? systemTheme : themeOption.value;

              return (
                <div
                  key={themeOption.value}
                  className={cn(
                    "rounded-md border p-2 transition",
                    currentSystemTheme === "dark" ? "bg-zinc-900" : "bg-zinc-50",
                    isSelected && "border-primary ring-2 ring-ring/35",
                  )}
                >
                  <RadioGroupItem
                    value={themeOption.value}
                    id={themeOption.value}
                    className="sr-only"
                  />
                  <label htmlFor={themeOption.value} className="cursor-pointer">
                    <div className="flex justify-center">
                      <Icon />
                    </div>
                    <div className="mt-2 text-center text-sm font-medium text-foreground">
                      {themeOption.label}
                    </div>
                    {isSelected ? (
                      <motion.span
                        className="mx-auto mt-1 block h-0.5 w-10 rounded-full bg-primary"
                        layoutId="activeTheme"
                      />
                    ) : null}
                  </label>
                </div>
              );
            })}
          </RadioGroup>
        </div>
      ) : null}
    </div>
  );
}
