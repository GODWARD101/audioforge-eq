/**
 * Persistence layer for AudioForge EQ.
 * All settings, presets, profiles, and UI preferences are stored in
 * localStorage. Supports full export/import as a single JSON file.
 */

import { buildDefaultSettings } from "./audio/AudioEngine";
import type {
  AppSettings,
  PersistedState,
  Preset,
  Profile,
  ThemeId,
} from "./audio/types";
import { DEFAULT_THEME, isThemeId } from "./theme";

const STORAGE_KEY = "audioforge.state";
const CURRENT_VERSION = 1;

export function createDefaultState(): PersistedState {
  return {
    version: CURRENT_VERSION,
    theme: DEFAULT_THEME,
    settings: buildDefaultSettings(),
    presets: [],
    profiles: [],
    activeProfileId: null,
  };
}

function safeParse(raw: string | null): PersistedState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (!parsed || typeof parsed !== "object") return null;
    const defaults = createDefaultState();
    return {
      version: parsed.version ?? CURRENT_VERSION,
      theme:
        parsed.theme && isThemeId(parsed.theme) ? parsed.theme : defaults.theme,
      settings: { ...defaults.settings, ...(parsed.settings ?? {}) },
      presets: Array.isArray(parsed.presets) ? parsed.presets : [],
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
      activeProfileId: parsed.activeProfileId ?? null,
    };
  } catch {
    return null;
  }
}

/** Load the persisted state, falling back to defaults. */
export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return safeParse(raw) ?? createDefaultState();
  } catch {
    return createDefaultState();
  }
}

/** Persist the full state. */
export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable — ignore
  }
}

/** Serialize the state to a JSON string for export. */
export function exportState(state: PersistedState): string {
  return JSON.stringify(state, null, 2);
}

/** Parse an imported JSON string back into a valid state. */
export function importState(json: string): PersistedState {
  const parsed = safeParse(json);
  if (!parsed) {
    throw new Error("Invalid settings file");
  }
  return parsed;
}

/** Download the current state as a JSON file. */
export function downloadState(state: PersistedState): void {
  const blob = new Blob([exportState(state)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "audioforge-settings.json";
  a.click();
  URL.revokeObjectURL(url);
}

/** Build a factory preset from a name and a settings template. */
export function createFactoryPreset(
  id: string,
  name: string,
  settings: AppSettings,
): Preset {
  return {
    id,
    name,
    isFactory: true,
    eq: structuredClone(settings.eq),
    effects: structuredClone(settings.effects),
  };
}

/** Build a user preset from the current settings. */
export function createUserPreset(
  id: string,
  name: string,
  settings: AppSettings,
): Preset {
  return {
    id,
    name,
    isFactory: false,
    eq: structuredClone(settings.eq),
    effects: structuredClone(settings.effects),
  };
}

/** Build a profile from the current settings. */
export function createProfile(
  id: string,
  name: string,
  type: Profile["type"],
  settings: AppSettings,
): Profile {
  return {
    id,
    name,
    type,
    eq: structuredClone(settings.eq),
    effects: structuredClone(settings.effects),
  };
}

/** Generate a reasonably unique id. */
export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export type { ThemeId };
