import { useThemeContext } from "@/components/ThemeProvider";
import type { ThemeId } from "@/lib/audio/types";
import { THEMES, themeById } from "@/lib/theme";

/**
 * Theme hook. Returns the active theme id, the full theme definition, the
 * list of available themes, and a setter.
 */
export function useTheme() {
  const { theme, setTheme } = useThemeContext();
  return {
    theme,
    themeDefinition: themeById(theme),
    themes: THEMES,
    setTheme,
  };
}

export type { ThemeId };
