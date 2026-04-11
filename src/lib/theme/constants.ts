export const THEME_STORAGE_KEY = "ff_theme";
export const APPEARANCE_STORAGE_KEY = "ff_appearance";

export const THEMES = ["default", "ocean", "forest", "high-contrast"] as const;
export type ThemeId = (typeof THEMES)[number];

export const APPEARANCES = ["system", "light", "dark"] as const;
export type AppearanceId = (typeof APPEARANCES)[number];

export const DEFAULT_THEME: ThemeId = "default";
export const DEFAULT_APPEARANCE: AppearanceId = "system";
