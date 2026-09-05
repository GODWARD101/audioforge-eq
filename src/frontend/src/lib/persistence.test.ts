import {
  createDefaultState,
  exportState,
  importState,
  loadState,
  saveState,
} from "@/lib/persistence";
import { useAudioStore } from "@/lib/store";
import { beforeEach, describe, expect, it } from "vitest";

/**
 * Characterization of the offline-capable data layer.
 *
 * The PWA change adds a service worker and offline support. The core EQ/effects
 * workflow must keep working with no network connection once installed. That
 * depends on the app's state being fully client-side: persisted to localStorage
 * and round-trippable through the export/import JSON format, with no backend or
 * network dependency. These tests freeze that self-contained behavior so the
 * PWA work does not accidentally introduce a network dependency into the core
 * workflow.
 */
describe("offline-capable persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    useAudioStore.setState(createDefaultState());
  });

  it("persists EQ and effects settings to localStorage on change", () => {
    useAudioStore.getState().setEqBypass(true);
    useAudioStore.getState().updateLimiter({ threshold: -12 });

    const raw = localStorage.getItem("audioforge.state");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed.settings.eq.bypass).toBe(true);
    expect(parsed.settings.effects.limiter.threshold).toBe(-12);
  });

  it("restores persisted settings on a fresh store load (offline reload)", () => {
    // Simulate a prior session writing to localStorage, then a fresh load.
    useAudioStore.getState().setEqMasterGain(0.5);
    useAudioStore.getState().savePreset("Offline mix");

    const reloaded = loadState();
    expect(reloaded.settings.eq.masterGain).toBe(0.5);
    expect(reloaded.presets.some((p) => p.name === "Offline mix")).toBe(true);
  });

  it("round-trips the full state through the export/import JSON format", () => {
    useAudioStore.getState().setTheme("ocean");
    useAudioStore.getState().setEqMode(13);
    useAudioStore.getState().savePreset("Exported preset");

    const json = exportState(loadState());
    const imported = importState(json);

    expect(imported.theme).toBe("ocean");
    expect(imported.settings.eq.mode).toBe(13);
    expect(imported.presets.some((p) => p.name === "Exported preset")).toBe(
      true,
    );
  });

  it("keeps the core workflow independent of the backend actor", () => {
    // The EQ/effects workflow must not depend on any backend call. The store
    // and persistence layer operate purely on localStorage; assert the core
    // settings can be mutated and persisted with no actor in the picture.
    const before = useAudioStore.getState().settings.eq.bands[0].gain;
    useAudioStore.getState().updateBand({
      ...useAudioStore.getState().settings.eq.bands[0],
      gain: before + 3,
    });
    expect(useAudioStore.getState().settings.eq.bands[0].gain).toBe(before + 3);
    expect(localStorage.getItem("audioforge.state")).not.toBeNull();
  });
});
