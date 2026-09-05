import { GlassPanel } from "@/components/GlassPanel";
import { RotaryKnob } from "@/components/RotaryKnob";
import { Switch } from "@/components/ui/switch";
import { formatDb, formatFrequency } from "@/lib/audio/dsp";
import { useAudioStore } from "@/lib/store";

/** Map an attack/release time (seconds) to a Fast/Med/Slow label. */
function formatTime(value: number): string {
  if (value <= 0.05) return "Fast";
  if (value < 0.2) return "Med";
  return "Slow";
}

/**
 * Three-band multiband compressor. Silver knobs with a signal-red Out Gain,
 * crossover controls, and Bypass/Compact toggles.
 */
export function CompressorPanel() {
  const comp = useAudioStore((s) => s.settings.effects.compressor);
  const updateCompressor = useAudioStore((s) => s.updateCompressor);

  return (
    <GlassPanel className="p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">
            Multiband Compressor
          </h2>
          <p className="text-xs text-muted-foreground">
            Three-band dynamics processing
          </p>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            Bypass
            <Switch
              checked={comp.bypass}
              onCheckedChange={(v) => updateCompressor({ bypass: v })}
              aria-label="Bypass compressor"
              data-ocid="compressor_bypass_toggle"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            Compact
            <Switch
              checked={comp.compact}
              onCheckedChange={(v) => updateCompressor({ compact: v })}
              aria-label="Compact view"
              data-ocid="compressor_compact_toggle"
            />
          </div>
        </div>
      </div>

      {/* Crossover sections */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-4">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Low X-Over
          </span>
          <RotaryKnob
            value={comp.lowXover}
            min={60}
            max={1200}
            step={10}
            onChange={(v) => updateCompressor({ lowXover: v })}
            label="Low X-Over"
            format={formatFrequency}
          />
        </div>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-4">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            High X-Over
          </span>
          <RotaryKnob
            value={comp.highXover}
            min={1200}
            max={6000}
            step={50}
            onChange={(v) => updateCompressor({ highXover: v })}
            label="High X-Over"
            format={formatFrequency}
          />
        </div>
      </div>

      {/* Parameter knobs */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        <RotaryKnob
          value={comp.attack}
          min={0.001}
          max={0.5}
          step={0.001}
          onChange={(v) => updateCompressor({ attack: v })}
          label="Attack"
          format={formatTime}
        />
        <RotaryKnob
          value={comp.release}
          min={0.001}
          max={0.5}
          step={0.001}
          onChange={(v) => updateCompressor({ release: v })}
          label="Release"
          format={formatTime}
        />
        <RotaryKnob
          value={comp.ratio}
          min={1}
          max={10}
          step={0.5}
          onChange={(v) => updateCompressor({ ratio: v })}
          label="Ratio"
          format={(v) => `${v.toFixed(1)}:1`}
        />
        <RotaryKnob
          value={comp.inputGain}
          min={-10}
          max={10}
          step={0.5}
          onChange={(v) => updateCompressor({ inputGain: v })}
          label="Input Gain"
          format={formatDb}
        />
        <RotaryKnob
          value={comp.threshold}
          min={-20}
          max={0}
          step={0.5}
          onChange={(v) => updateCompressor({ threshold: v })}
          label="Threshold"
          format={(v) => (v >= 0 ? "Off" : `${v.toFixed(1)} dB`)}
        />
        <RotaryKnob
          value={comp.outGain}
          min={-15}
          max={15}
          step={0.5}
          onChange={(v) => updateCompressor({ outGain: v })}
          label="Out Gain"
          variant="gain"
          format={formatDb}
        />
      </div>
    </GlassPanel>
  );
}
