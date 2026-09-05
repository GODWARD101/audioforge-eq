import { GlassPanel } from "@/components/GlassPanel";
import { RotaryKnob } from "@/components/RotaryKnob";
import { BandControls } from "@/components/eq/BandControls";
import { EQCurve } from "@/components/eq/EQCurve";
import { EQModeSelector } from "@/components/eq/EQModeSelector";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAudio } from "@/hooks/use-audio";
import { formatDb } from "@/lib/audio/dsp";
import { useAudioStore } from "@/lib/store";
import { RotateCcw } from "lucide-react";
import { useState } from "react";

/**
 * Parametric EQ workspace. Composes the mode selector, the draggable EQ
 * curve, per-band controls, master gain, and bypass. All changes flow through
 * the global store and are applied to the AudioEngine in real time with
 * click-free smoothing. The EQ never uses the microphone.
 */
export function EQPage() {
  const eq = useAudioStore((s) => s.settings.eq);
  const setEqMode = useAudioStore((s) => s.setEqMode);
  const updateBand = useAudioStore((s) => s.updateBand);
  const setEqMasterGain = useAudioStore((s) => s.setEqMasterGain);
  const setEqBypass = useAudioStore((s) => s.setEqBypass);
  const resetEq = useAudioStore((s) => s.resetEq);

  // Keep the AudioEngine alive and synced with the store for real-time audio.
  useAudio();

  const [selectedBandId, setSelectedBandId] = useState<string | null>(
    eq.bands[0]?.id ?? null,
  );

  const anySolo = eq.bands.some((b) => b.soloed);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Parametric EQ
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {eq.mode}-band equalizer · drag nodes on the curve to shape your
            sound
          </p>
        </div>
        <div className="flex items-center gap-3">
          <EQModeSelector mode={eq.mode} onChange={setEqMode} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetEq}
            data-ocid="eq_reset_button"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset
          </Button>
        </div>
      </div>

      {/* Bypass banner */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-card/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <Switch
            checked={eq.bypass}
            onCheckedChange={setEqBypass}
            aria-label="Bypass EQ"
            data-ocid="eq_bypass_toggle"
          />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {eq.bypass ? "EQ bypassed" : "EQ active"}
            </p>
            <p className="text-xs text-muted-foreground">
              {eq.bypass
                ? "The equalizer is bypassed — audio passes through unchanged."
                : anySolo
                  ? "Solo active — only soloed bands are audible."
                  : "Processing audio in real time."}
            </p>
          </div>
        </div>
        <span
          className={
            eq.bypass
              ? "font-mono text-xs font-semibold text-muted-foreground"
              : "font-mono text-xs font-semibold text-success"
          }
        >
          {eq.bypass ? "OFF" : "ON"}
        </span>
      </div>

      {/* Curve + master gain */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <GlassPanel className="p-4 sm:p-5">
          <EQCurve
            bands={eq.bands}
            bypass={eq.bypass}
            selectedBandId={selectedBandId}
            onSelectBand={setSelectedBandId}
            onGainChange={(bandId, gain) => {
              const band = eq.bands.find((b) => b.id === bandId);
              if (band) updateBand({ ...band, gain });
            }}
          />
        </GlassPanel>

        <GlassPanel className="flex flex-col items-center justify-center gap-4 p-5">
          <RotaryKnob
            value={eq.masterGain}
            min={-12}
            max={12}
            step={0.5}
            onChange={setEqMasterGain}
            label="Master Gain"
            format={(v) => formatDb(v)}
            variant="gain"
            size={88}
          />
          <p className="max-w-[9rem] text-center text-[11px] leading-snug text-muted-foreground">
            Output trim for the whole EQ stage
          </p>
        </GlassPanel>
      </div>

      {/* Band controls */}
      <div className="mt-4">
        <GlassPanel className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-foreground">
              Band controls
            </h2>
            <span className="font-mono text-xs text-muted-foreground">
              {eq.bands.length} bands
            </span>
          </div>
          <BandControls
            bands={eq.bands}
            selectedBandId={selectedBandId}
            onSelectBand={setSelectedBandId}
            onUpdateBand={updateBand}
          />
        </GlassPanel>
      </div>
    </div>
  );
}
