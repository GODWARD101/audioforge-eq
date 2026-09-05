import { AudioEngine } from "@/lib/audio/AudioEngine";
import type { AppSettings } from "@/lib/audio/types";
import { useAudioStore } from "@/lib/store";
import { useEffect, useRef, useState } from "react";

/**
 * Module-level singleton engine so it survives route changes.
 */
let engine: AudioEngine | null = null;

function getEngine(): AudioEngine {
  if (!engine) {
    engine = new AudioEngine();
  }
  return engine;
}

/**
 * React hook that owns the AudioEngine lifecycle and keeps it in sync with
 * the global store.
 */
export function useAudio() {
  const settings = useAudioStore((s) => s.settings);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastApplied = useRef<AppSettings | null>(null);

  const engineRef = useRef<AudioEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = getEngine();
  }

  // Ensure the context exists and apply the initial settings.
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount to ensure the context and apply initial settings
  useEffect(() => {
    let cancelled = false;
    engineRef.current
      ?.ensureContext()
      .then(() => {
        if (cancelled) return;
        setReady(true);
        engineRef.current?.applySettings(settings);
        lastApplied.current = settings;
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : "Audio engine failed to start",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply settings changes to the engine.
  useEffect(() => {
    const eng = engineRef.current;
    if (!eng || !ready) return;
    const prev = lastApplied.current;
    if (!prev) {
      eng.applySettings(settings);
      lastApplied.current = settings;
      return;
    }

    // EQ
    if (prev.eq !== settings.eq) {
      if (
        prev.eq.mode !== settings.eq.mode ||
        prev.eq.bands.length !== settings.eq.bands.length
      ) {
        eng.applySettings(settings);
      } else {
        for (const band of settings.eq.bands) {
          eng.updateBand(band, settings.eq);
        }
        if (prev.eq.masterGain !== settings.eq.masterGain) {
          eng.updateEqMasterGain(settings.eq);
        }
        if (prev.eq.bypass !== settings.eq.bypass) {
          eng.applySettings(settings);
        }
      }
    }

    // Effects — rebuild only when the chain topology changes (order, master
    // bypass, per-effect bypass, or compressor bypass); otherwise update the
    // individual effect parameters in place for click-free real-time control.
    if (prev.effects !== settings.effects) {
      const pfx = prev.effects;
      const fx = settings.effects;
      const topologyChanged =
        pfx.order !== fx.order ||
        pfx.masterBypass !== fx.masterBypass ||
        pfx.bypassed !== fx.bypassed ||
        pfx.compressor.bypass !== fx.compressor.bypass;
      if (topologyChanged) {
        eng.applySettings(settings);
      } else {
        if (pfx.limiter !== fx.limiter) eng.updateLimiter(fx.limiter);
        if (pfx.compressor !== fx.compressor)
          eng.updateCompressor(fx.compressor);
        if (pfx.epicenter !== fx.epicenter) eng.updateEpicenter(fx.epicenter);
        if (pfx.monoblock !== fx.monoblock) eng.updateMonoblock(fx.monoblock);
        if (pfx.amplifier !== fx.amplifier) eng.updateAmplifier(fx.amplifier);
        if (pfx.bassTuning !== fx.bassTuning)
          eng.updateBassTuning(fx.bassTuning.curve);
        if (pfx.loudness !== fx.loudness) eng.updateLoudness(fx.loudness.curve);
        if (pfx.distortionReduction !== fx.distortionReduction)
          eng.updateDistortionReduction(fx.distortionReduction.amount);
      }
    }

    // Master volume
    if (prev.masterVolume !== settings.masterVolume) {
      eng.setMasterVolume(settings.masterVolume);
    }

    lastApplied.current = settings;
  }, [settings, ready]);

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      // Keep the singleton alive across route changes; only dispose on full
      // app teardown is intentionally skipped to preserve playback.
    };
  }, []);

  return {
    engine: engineRef.current,
    ready,
    error,
  };
}
