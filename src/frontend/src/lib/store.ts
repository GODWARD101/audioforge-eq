/**
 * Global zustand store for AudioForge EQ.
 * Holds all settings, presets, profiles, and theme. Persists to localStorage
 * via the persistence layer. The AudioEngine is applied by the use-audio hook
 * which subscribes to this store.
 */

import { create } from "zustand";
import { rebuildBands } from "./audio/AudioEngine";
import type {
  AppSettings,
  CompressorSettings,
  EffectId,
  EffectsSettings,
  EqBand,
  EqMode,
  EqSettings,
  LimiterSettings,
  PersistedState,
  Preset,
  Profile,
  ThemeId,
} from "./audio/types";
import {
  createDefaultState,
  createProfile,
  createUserPreset,
  loadState,
  saveState,
  uid,
} from "./persistence";

interface AudioForgeState {
  settings: AppSettings;
  theme: ThemeId;
  presets: Preset[];
  profiles: Profile[];
  activeProfileId: string | null;

  // Theme
  setTheme: (theme: ThemeId) => void;

  // EQ
  setEqMode: (mode: EqMode) => void;
  updateBand: (band: EqBand) => void;
  setEqMasterGain: (gain: number) => void;
  setEqBypass: (bypass: boolean) => void;
  resetEq: () => void;

  // Effects
  updateLimiter: (patch: Partial<LimiterSettings>) => void;
  updateCompressor: (patch: Partial<CompressorSettings>) => void;
  updateEffects: (patch: Partial<EffectsSettings>) => void;
  setEffectOrder: (order: EffectsSettings["order"]) => void;
  toggleEffectBypass: (id: EffectId) => void;
  resetEffects: () => void;

  // Master
  setMasterVolume: (volume: number) => void;

  // Presets
  savePreset: (name: string) => void;
  renamePreset: (id: string, name: string) => void;
  deletePreset: (id: string) => void;
  applyPreset: (id: string) => void;

  // Profiles
  saveProfile: (name: string, type: Profile["type"]) => void;
  deleteProfile: (id: string) => void;
  applyProfile: (id: string) => void;

  // Persistence
  importState: (json: string) => void;
  resetAll: () => void;
}

function persist(state: AudioForgeState): void {
  saveState({
    version: 1,
    theme: state.theme,
    settings: state.settings,
    presets: state.presets,
    profiles: state.profiles,
    activeProfileId: state.activeProfileId,
  });
}

const initial = loadState();

export const useAudioStore = create<AudioForgeState>((set, get) => ({
  settings: initial.settings,
  theme: initial.theme,
  presets: initial.presets,
  profiles: initial.profiles,
  activeProfileId: initial.activeProfileId,

  setTheme: (theme) => {
    set({ theme });
    persist(get());
  },

  setEqMode: (mode) => {
    const { settings } = get();
    const bands = rebuildBands(mode, settings.eq.bands);
    const next: AppSettings = {
      ...settings,
      eq: { ...settings.eq, mode, bands },
    };
    set({ settings: next });
    persist(get());
  },

  updateBand: (band) => {
    const { settings } = get();
    const bands = settings.eq.bands.map((b) => (b.id === band.id ? band : b));
    const next: AppSettings = {
      ...settings,
      eq: { ...settings.eq, bands },
    };
    set({ settings: next });
    persist(get());
  },

  setEqMasterGain: (gain) => {
    const { settings } = get();
    const next: AppSettings = {
      ...settings,
      eq: { ...settings.eq, masterGain: gain },
    };
    set({ settings: next });
    persist(get());
  },

  setEqBypass: (bypass) => {
    const { settings } = get();
    const next: AppSettings = {
      ...settings,
      eq: { ...settings.eq, bypass },
    };
    set({ settings: next });
    persist(get());
  },

  resetEq: () => {
    const { settings } = get();
    const bands = settings.eq.bands.map((b) => ({
      ...b,
      gain: 0,
      muted: false,
      soloed: false,
      enabled: true,
    }));
    const next: AppSettings = {
      ...settings,
      eq: { ...settings.eq, bands, masterGain: 0, bypass: false },
    };
    set({ settings: next });
    persist(get());
  },

  updateLimiter: (patch) => {
    const { settings } = get();
    const next: AppSettings = {
      ...settings,
      effects: {
        ...settings.effects,
        limiter: { ...settings.effects.limiter, ...patch },
      },
    };
    set({ settings: next });
    persist(get());
  },

  updateCompressor: (patch) => {
    const { settings } = get();
    const next: AppSettings = {
      ...settings,
      effects: {
        ...settings.effects,
        compressor: { ...settings.effects.compressor, ...patch },
      },
    };
    set({ settings: next });
    persist(get());
  },

  updateEffects: (patch) => {
    const { settings } = get();
    const next: AppSettings = {
      ...settings,
      effects: { ...settings.effects, ...patch },
    };
    set({ settings: next });
    persist(get());
  },

  setEffectOrder: (order) => {
    const { settings } = get();
    const next: AppSettings = {
      ...settings,
      effects: { ...settings.effects, order },
    };
    set({ settings: next });
    persist(get());
  },

  toggleEffectBypass: (id) => {
    const { settings } = get();
    const bypassed = settings.effects.bypassed.includes(id)
      ? settings.effects.bypassed.filter((e) => e !== id)
      : [...settings.effects.bypassed, id];
    const next: AppSettings = {
      ...settings,
      effects: { ...settings.effects, bypassed },
    };
    set({ settings: next });
    persist(get());
  },

  resetEffects: () => {
    const { settings } = get();
    const fresh = createDefaultState().settings.effects;
    const next: AppSettings = {
      ...settings,
      effects: { ...fresh, order: settings.effects.order },
    };
    set({ settings: next });
    persist(get());
  },

  setMasterVolume: (volume) => {
    const { settings } = get();
    const next: AppSettings = { ...settings, masterVolume: volume };
    set({ settings: next });
    persist(get());
  },

  savePreset: (name) => {
    const { settings, presets } = get();
    const preset = createUserPreset(uid(), name, settings);
    set({ presets: [...presets, preset] });
    persist(get());
  },

  renamePreset: (id, name) => {
    const { presets } = get();
    set({
      presets: presets.map((p) => (p.id === id ? { ...p, name } : p)),
    });
    persist(get());
  },

  deletePreset: (id) => {
    const { presets } = get();
    set({ presets: presets.filter((p) => p.id !== id) });
    persist(get());
  },

  applyPreset: (id) => {
    const { presets, settings } = get();
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    const next: AppSettings = {
      ...settings,
      eq: structuredClone(preset.eq),
      effects: structuredClone(preset.effects),
    };
    set({ settings: next });
    persist(get());
  },

  saveProfile: (name, type) => {
    const { settings, profiles } = get();
    const profile = createProfile(uid(), name, type, settings);
    set({
      profiles: [...profiles, profile],
      activeProfileId: profile.id,
    });
    persist(get());
  },

  deleteProfile: (id) => {
    const { profiles, activeProfileId } = get();
    set({
      profiles: profiles.filter((p) => p.id !== id),
      activeProfileId: activeProfileId === id ? null : activeProfileId,
    });
    persist(get());
  },

  applyProfile: (id) => {
    const { profiles, settings } = get();
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return;
    const next: AppSettings = {
      ...settings,
      eq: structuredClone(profile.eq),
      effects: structuredClone(profile.effects),
    };
    set({ settings: next, activeProfileId: id });
    persist(get());
  },

  importState: (json) => {
    const imported = createDefaultState();
    try {
      const parsed = JSON.parse(json) as Partial<PersistedState>;
      imported.settings = {
        ...imported.settings,
        ...(parsed.settings ?? {}),
      };
      if (parsed.theme) imported.theme = parsed.theme;
      if (Array.isArray(parsed.presets)) imported.presets = parsed.presets;
      if (Array.isArray(parsed.profiles)) imported.profiles = parsed.profiles;
      if (parsed.activeProfileId !== undefined) {
        imported.activeProfileId = parsed.activeProfileId;
      }
    } catch {
      // fall back to defaults on malformed input
    }
    set({
      settings: imported.settings,
      theme: imported.theme,
      presets: imported.presets,
      profiles: imported.profiles,
      activeProfileId: imported.activeProfileId,
    });
    persist(get());
  },

  resetAll: () => {
    const fresh = createDefaultState();
    set({
      settings: fresh.settings,
      presets: [],
      profiles: [],
      activeProfileId: null,
    });
    persist(get());
  },
}));

/** Convenience selector for the EQ settings. */
export const selectEq = (s: AudioForgeState): EqSettings => s.settings.eq;
/** Convenience selector for the effects settings. */
export const selectEffects = (s: AudioForgeState): EffectsSettings =>
  s.settings.effects;
