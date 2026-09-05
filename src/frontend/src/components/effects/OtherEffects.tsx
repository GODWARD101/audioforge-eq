import { GlassPanel } from "@/components/GlassPanel";
import { RotaryKnob } from "@/components/RotaryKnob";
import { formatDb } from "@/lib/audio/dsp";
import { useAudioStore } from "@/lib/store";
import type { ReactNode } from "react";

/** Format a signed curve value (-100..+100) for display. */
function formatCurve(value: number): string {
  return `${value > 0 ? "+" : ""}${value}`;
}

/**
 * Tone & character modules: epicenter bass enhancement, monoblock,
 * amplifier, bass tuning, loudness tuning, and distortion reduction.
 */
export function OtherEffects() {
  const effects = useAudioStore((s) => s.settings.effects);
  const updateEffects = useAudioStore((s) => s.updateEffects);

  return (
    <GlassPanel className="p-6">
      <div className="mb-6">
        <h2 className="font-display text-lg font-bold text-foreground">
          Tone & Character
        </h2>
        <p className="text-xs text-muted-foreground">
          Bass, loudness, and harmonic shaping
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Module title="Epicenter" subtitle="Bass enhancement">
          <RotaryKnob
            value={effects.epicenter.intensity}
            min={0}
            max={100}
            step={1}
            onChange={(v) => updateEffects({ epicenter: { intensity: v } })}
            label="Intensity"
            format={(v) => `${v}%`}
          />
        </Module>

        <Module title="Monoblock" subtitle="Stereo to mono">
          <RotaryKnob
            value={effects.monoblock.blend}
            min={0}
            max={100}
            step={1}
            onChange={(v) => updateEffects({ monoblock: { blend: v } })}
            label="Blend"
            format={(v) => `${v}%`}
          />
        </Module>

        <Module title="Amplifier" subtitle="Drive & tone">
          <div className="grid grid-cols-3 gap-4">
            <RotaryKnob
              value={effects.amplifier.drive}
              min={0}
              max={100}
              step={1}
              onChange={(v) =>
                updateEffects({
                  amplifier: { ...effects.amplifier, drive: v },
                })
              }
              label="Drive"
              format={(v) => `${v}%`}
            />
            <RotaryKnob
              value={effects.amplifier.gain}
              min={-20}
              max={20}
              step={0.5}
              onChange={(v) =>
                updateEffects({
                  amplifier: { ...effects.amplifier, gain: v },
                })
              }
              label="Gain"
              format={formatDb}
            />
            <RotaryKnob
              value={effects.amplifier.tone}
              min={-10}
              max={10}
              step={0.5}
              onChange={(v) =>
                updateEffects({
                  amplifier: { ...effects.amplifier, tone: v },
                })
              }
              label="Tone"
              format={formatDb}
            />
          </div>
        </Module>

        <Module title="Bass Tuning" subtitle="Low-end curve">
          <RotaryKnob
            value={effects.bassTuning.curve}
            min={-100}
            max={100}
            step={1}
            onChange={(v) => updateEffects({ bassTuning: { curve: v } })}
            label="Curve"
            format={formatCurve}
          />
        </Module>

        <Module title="Loudness" subtitle="High-end curve">
          <RotaryKnob
            value={effects.loudness.curve}
            min={-100}
            max={100}
            step={1}
            onChange={(v) => updateEffects({ loudness: { curve: v } })}
            label="Curve"
            format={formatCurve}
          />
        </Module>

        <Module title="Distortion Reduction" subtitle="Clean up harshness">
          <RotaryKnob
            value={effects.distortionReduction.amount}
            min={0}
            max={100}
            step={1}
            onChange={(v) =>
              updateEffects({ distortionReduction: { amount: v } })
            }
            label="Amount"
            format={(v) => `${v}%`}
          />
        </Module>
      </div>
    </GlassPanel>
  );
}

function Module({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-5">
      <div className="mb-4">
        <h3 className="font-display text-sm font-bold text-foreground">
          {title}
        </h3>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex justify-center">{children}</div>
    </div>
  );
}
