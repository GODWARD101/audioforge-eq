import { GlassPanel } from "@/components/GlassPanel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { EffectId } from "@/lib/audio/types";
import { useAudioStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  AudioWaveform,
  Gauge,
  Layers,
  type LucideIcon,
  Music2,
  Radio,
  SlidersHorizontal,
  Volume2,
  Waves,
} from "lucide-react";

const EFFECT_META: Record<EffectId, { label: string; icon: LucideIcon }> = {
  limiter: { label: "Limiter", icon: Gauge },
  compressor: { label: "Multiband Comp", icon: SlidersHorizontal },
  epicenter: { label: "Epicenter", icon: Waves },
  monoblock: { label: "Monoblock", icon: Layers },
  amplifier: { label: "Amplifier", icon: Volume2 },
  bassTuning: { label: "Bass Tuning", icon: Music2 },
  loudness: { label: "Loudness", icon: AudioWaveform },
  distortionReduction: { label: "Distortion Reduction", icon: Radio },
};

/**
 * Displays the effects chain processing order with per-effect bypass,
 * reorder controls, and a master bypass for the whole chain.
 */
export function EffectChain() {
  const order = useAudioStore((s) => s.settings.effects.order);
  const masterBypass = useAudioStore((s) => s.settings.effects.masterBypass);
  const bypassed = useAudioStore((s) => s.settings.effects.bypassed);
  const setEffectOrder = useAudioStore((s) => s.setEffectOrder);
  const updateEffects = useAudioStore((s) => s.updateEffects);
  const toggleEffectBypass = useAudioStore((s) => s.toggleEffectBypass);

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setEffectOrder(next);
  };

  return (
    <GlassPanel className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">
            Signal Chain
          </h2>
          <p className="text-xs text-muted-foreground">
            Processing order · top to bottom
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">
            {masterBypass ? "Chain bypassed" : "Chain active"}
          </span>
          <Switch
            checked={masterBypass}
            onCheckedChange={(v) => updateEffects({ masterBypass: v })}
            data-ocid="chain_master_bypass_toggle"
          />
        </div>
      </div>

      <ol className="space-y-2">
        {order.map((id, index) => {
          const meta = EFFECT_META[id];
          const Icon = meta.icon;
          const isBypassed = bypassed.includes(id);
          return (
            <li
              key={id}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 transition-opacity",
                isBypassed && "opacity-50",
              )}
              data-ocid={`chain_item_${index + 1}`}
            >
              <span className="w-6 text-center font-mono text-xs text-muted-foreground">
                {index + 1}
              </span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {meta.label}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${meta.label} up`}
                  data-ocid={`chain_move_up_${index + 1}`}
                >
                  <ArrowUp className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => move(index, 1)}
                  disabled={index === order.length - 1}
                  aria-label={`Move ${meta.label} down`}
                  data-ocid={`chain_move_down_${index + 1}`}
                >
                  <ArrowDown className="size-4" aria-hidden="true" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-7 text-right text-xs text-muted-foreground">
                  {isBypassed ? "Off" : "On"}
                </span>
                <Switch
                  checked={!isBypassed}
                  onCheckedChange={() => toggleEffectBypass(id)}
                  data-ocid={`chain_bypass_${index + 1}`}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </GlassPanel>
  );
}
