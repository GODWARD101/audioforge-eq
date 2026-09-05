import type { ThemeId } from "@/lib/audio/types";
import { useAudioStore } from "@/lib/store";
import { isThemeId } from "@/lib/theme";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "audioforge.theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The zustand store is the single source of truth for the theme (it is
  // persisted to 'audioforge.state' and drives export/import). Subscribing to
  // it here keeps the applied `data-theme` attribute in sync whenever the
  // store's theme changes — whether from the picker or from an import.
  const storeTheme = useAudioStore((s) => s.theme);
  const [theme, setThemeState] = useState<ThemeId>(storeTheme);

  useEffect(() => {
    setThemeState(storeTheme);
  }, [storeTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // storage unavailable
    }
  }, [theme]);

  // Selecting a theme updates the store (persisted + exported) and, via the
  // subscription above, the applied `data-theme` attribute.
  const setTheme = (next: ThemeId) => {
    if (!isThemeId(next)) return;
    useAudioStore.getState().setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return ctx;
}
