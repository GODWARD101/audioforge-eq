/**
 * Shared domain types for AudioForge EQ.
 * These are the contracts consumed by the page tasks (EQ, Effects, Presets,
 * Settings) and by the persistence layer.
 */

export type FilterType =
  | "peaking"
  | "low-shelf"
  | "high-shelf"
  | "low-pass"
  | "high-pass";

export type EqMode = 10 | 13 | 21;

export interface EqBand {
  id: string;
  frequency: number;
  q: number;
  gain: number;
  filterType: FilterType;
  enabled: boolean;
  muted: boolean;
  soloed: boolean;
}

export interface EqSettings {
  mode: EqMode;
  bands: EqBand[];
  masterGain: number; // dB
  bypass: boolean;
}

export interface LimiterSettings {
  threshold: number; // 0 to -30 dB
  postGain: number; // 0 to 10 dB
  ratio: number; // 1:1 to infinity
  attack: number; // seconds
  release: number; // seconds
}

export interface CompressorSettings {
  lowXover: number; // 60 - 1200 Hz
  highXover: number; // 1200 - 6000 Hz
  attack: number; // seconds
  release: number; // seconds
  ratio: number; // 1:1 - 10:1
  inputGain: number; // -10 to +10 dB
  threshold: number; // Off (-Infinity) to -20 dB
  outGain: number; // -15 to +15 dB
  bypass: boolean;
  compact: boolean;
}

export interface EpicenterSettings {
  intensity: number; // 0 - 100
}

export interface MonoblockSettings {
  blend: number; // 0 - 100
}

export interface AmplifierSettings {
  drive: number; // 0 - 100
  gain: number; // -20 to +20 dB
  tone: number; // -10 to +10
}

export interface BassTuningSettings {
  curve: number; // -100 to +100
}

export interface LoudnessSettings {
  curve: number; // -100 to +100
}

export interface DistortionReductionSettings {
  amount: number; // 0 - 100
}

export interface EffectsSettings {
  limiter: LimiterSettings;
  compressor: CompressorSettings;
  epicenter: EpicenterSettings;
  monoblock: MonoblockSettings;
  amplifier: AmplifierSettings;
  bassTuning: BassTuningSettings;
  loudness: LoudnessSettings;
  distortionReduction: DistortionReductionSettings;
  order: EffectId[];
  masterBypass: boolean;
  /** Effects individually bypassed in the signal chain. */
  bypassed: EffectId[];
}

export type EffectId =
  | "limiter"
  | "compressor"
  | "epicenter"
  | "monoblock"
  | "amplifier"
  | "bassTuning"
  | "loudness"
  | "distortionReduction";

export interface AppSettings {
  masterVolume: number; // 0 - 1
  eq: EqSettings;
  effects: EffectsSettings;
}

export type ThemeId =
  | "charcoal"
  | "midnight"
  | "ocean"
  | "emerald"
  | "crimson"
  | "amethyst";

export interface Preset {
  id: string;
  name: string;
  isFactory: boolean;
  eq: EqSettings;
  effects: EffectsSettings;
}

export type ProfileType = "builtin" | "wired" | "bluetooth" | "usb-dac";

export interface Profile {
  id: string;
  name: string;
  type: ProfileType;
  eq: EqSettings;
  effects: EffectsSettings;
}

export interface PersistedState {
  version: number;
  theme: ThemeId;
  settings: AppSettings;
  presets: Preset[];
  profiles: Profile[];
  activeProfileId: string | null;
}
