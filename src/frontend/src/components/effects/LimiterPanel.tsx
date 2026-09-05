import { GlassPanel } from "@/components/GlassPanel";
import { RotaryKnob } from "@/components/RotaryKnob";
import { Button } from "@/components/ui/button";
import { formatDb } from "@/lib/audio/dsp";
import type { LimiterSettings } from "@/lib/audio/types";
import { useAudioStore } from "@/lib/store";
import { RotateCcw, Undo2 } from "lucide-react";
import { useRef } from "react";

/** Factory defaults for the limiter module. */
const DEFAULT_LIMITER: LimiterSettings = {
  threshold: -6,
  postGain: 0,
  ratio: 10,
  attack: 0.003,
  release: 0.25,
};

/** Map an attack/release time (seconds) to a Fast/Med/Slow label. */
function formatTime(value: number): string {
  if (value <= 0.05) return "Fast";
  if (value < 0.2) return "Med";
  return "Slow";
}

/**
 * Brickwall output limiter. Dark charcoal with metallic knobs and a
 * signal-red Post Gain knob. Includes undo/reset controls.
 */
export function LimiterPanel() {
  const limiter = useAudioStore((s) => s.settings.effects.limiter);
  const updateLimiter = useAudioStore((s) => s.updateLimiter);
  const undoStack = useRef<LimiterSettings[]>([]);

  const commit = (patch: Partial<LimiterSettings>) => {
    undoStack.current.push(limiter);
    if (undoStack.current.length > 30) undoStack.current.shift();
    updateLimiter(patch);
  };

  const undo = () => {
    const prev = undoStack.current.pop();
    if (prev) updateLimiter(prev);
  };

  const reset = () => {
    undoStack.current.push(limiter);
    updateLimiter(DEFAULT_LIMITER);
  };

  return (
    <GlassPanel className="p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">
            Limiter
          </h2>
          <p className="text-xs text-muted-foreground">
            Brickwall output protection
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            data-ocid="limiter_undo_button"
          >
            <Undo2 className="size-4" aria-hidden="true" />
            Undo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            data-ocid="limiter_reset_button"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
        <RotaryKnob
          value={limiter.threshold}
          min={-30}
          max={0}
          step={0.5}
          onChange={(v) => commit({ threshold: v })}
          label="Threshold"
          format={formatDb}
        />
        <RotaryKnob
          value={limiter.postGain}
          min={0}
          max={10}
          step={0.5}
          onChange={(v) => commit({ postGain: v })}
          label="Post Gain"
          variant="gain"
          format={formatDb}
        />
        <RotaryKnob
          value={limiter.ratio}
          min={1}
          max={20}
          step={1}
          onChange={(v) => commit({ ratio: v })}
          label="Ratio"
          format={(v) => (v >= 20 ? "∞:1" : `${v}:1`)}
        />
        <RotaryKnob
          value={limiter.attack}
          min={0.001}
          max={0.5}
          step={0.001}
          onChange={(v) => commit({ attack: v })}
          label="Attack"
          format={formatTime}
        />
        <RotaryKnob
          value={limiter.release}
          min={0.001}
          max={0.5}
          step={0.001}
          onChange={(v) => commit({ release: v })}
          label="Release"
          format={formatTime}
        />
      </div>
    </GlassPanel>
  );
}
