/**
 * Pure DSP helpers for AudioForge EQ.
 * These functions are deterministic and side-effect free so they can be used
 * both by the AudioEngine and by the UI (e.g. drawing the EQ curve).
 */

import type { EqMode, FilterType } from "./types";

/** Standard ISO band centre frequencies for each EQ mode. */
const FREQUENCIES: Record<EqMode, number[]> = {
  10: [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000],
  13: [20, 31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 12000, 16000, 20000],
  21: [
    20, 28, 40, 56, 80, 112, 160, 224, 316, 447, 631, 891, 1259, 1778, 2512,
    3548, 5012, 7079, 10000, 14125, 19952,
  ],
};

/** Default Q for each filter type (peaking is narrower, shelves broader). */
export function defaultQ(filterType: FilterType): number {
  switch (filterType) {
    case "peaking":
      return 1.0;
    case "low-shelf":
    case "high-shelf":
      return Math.SQRT1_2;
    case "low-pass":
    case "high-pass":
      return Math.SQRT1_2;
  }
}

/** Default filter type for a band index (shelves on the extremes). */
export function defaultFilterType(index: number, count: number): FilterType {
  if (index === 0) return "low-shelf";
  if (index === count - 1) return "high-shelf";
  return "peaking";
}

/**
 * Map the domain FilterType (hyphenated shelf names) to the Web Audio
 * BiquadFilterType (unhyphenated).
 */
export function toBiquadType(filterType: FilterType): BiquadFilterType {
  switch (filterType) {
    case "low-shelf":
      return "lowshelf";
    case "high-shelf":
      return "highshelf";
    case "low-pass":
      return "lowpass";
    case "high-pass":
      return "highpass";
    case "peaking":
      return "peaking";
  }
}

/** Centre frequencies for a given EQ mode. */
export function frequenciesForMode(mode: EqMode): number[] {
  return FREQUENCIES[mode];
}

/** Convert a gain in dB to a linear amplitude multiplier. */
export function dbToGain(db: number): number {
  return 10 ** (db / 20);
}

/** Convert a linear amplitude multiplier to dB. */
export function gainToDb(gain: number): number {
  return 20 * Math.log10(Math.max(gain, 1e-6));
}

/** Clamp a value into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Map a value from one range to another. */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  const t = (value - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

/**
 * Exponential smoothing coefficient for click-free parameter changes.
 * `timeConstant` is the 63% settling time in seconds.
 */
export function smoothingCoefficient(
  timeConstant: number,
  sampleRate: number,
): number {
  return 1 - Math.exp(-1 / (timeConstant * sampleRate));
}

/** Format a frequency for display (e.g. 1000 -> "1k"). */
export function formatFrequency(freq: number): string {
  if (freq >= 1000) {
    const k = freq / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return `${Math.round(freq)}`;
}

/** Format a gain in dB for display. */
export function formatDb(db: number): string {
  const rounded = Math.round(db * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(1)}`;
}
