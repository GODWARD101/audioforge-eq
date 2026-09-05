/**
 * Theme definitions for AudioForge EQ.
 * Each theme maps to a `data-theme` attribute on the document root, which
 * overrides the accent/ring hue tokens in index.css.
 */

import type { ThemeId } from "./audio/types";

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  /** Short description shown in the theme picker. */
  description: string;
  /** Accent swatch (OKLCH) used for the picker preview. */
  swatch: string;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: "charcoal",
    name: "Charcoal",
    description: "Steel-silver on deep charcoal",
    swatch: "oklch(0.75 0.15 260)",
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Cool indigo accent",
    swatch: "oklch(0.66 0.16 250)",
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Deep teal accent",
    swatch: "oklch(0.68 0.15 200)",
  },
  {
    id: "emerald",
    name: "Emerald",
    description: "Vivid green accent",
    swatch: "oklch(0.66 0.16 160)",
  },
  {
    id: "crimson",
    name: "Crimson",
    description: "Signal-red accent",
    swatch: "oklch(0.62 0.2 20)",
  },
  {
    id: "amethyst",
    name: "Amethyst",
    description: "Violet accent",
    swatch: "oklch(0.64 0.17 300)",
  },
];

export const DEFAULT_THEME: ThemeId = "charcoal";

export function isThemeId(value: string): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

export function themeById(id: ThemeId): ThemeDefinition {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
