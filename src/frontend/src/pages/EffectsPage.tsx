import { CompressorPanel } from "@/components/effects/CompressorPanel";
import { EffectChain } from "@/components/effects/EffectChain";
import { LimiterPanel } from "@/components/effects/LimiterPanel";
import { OtherEffects } from "@/components/effects/OtherEffects";
import { Switch } from "@/components/ui/switch";
import { useAudio } from "@/hooks/use-audio";
import { useAudioStore } from "@/lib/store";

/**
 * Effects rack workspace: the full effects chain editor with the limiter,
 * multiband compressor, signal chain order, and tone/character modules.
 */
export function EffectsPage() {
  const effects = useAudioStore((s) => s.settings.effects);
  const updateEffects = useAudioStore((s) => s.updateEffects);

  // Mount the audio engine so effect parameter changes and bypass toggles made
  // on this page are pushed to the AudioEngine in real time, not only after
  // navigating to another page that mounts useAudio().
  useAudio();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Effects Rack
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {effects.order.length} modules · shape dynamics, bass, and tone
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl glass-panel px-4 py-3">
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Master Bypass
            </span>
            <span className="text-xs font-medium text-foreground">
              {effects.masterBypass ? "Bypassed" : "Active"}
            </span>
          </div>
          <Switch
            checked={effects.masterBypass}
            onCheckedChange={(v) => updateEffects({ masterBypass: v })}
            data-ocid="master_bypass_toggle"
          />
        </div>
      </div>

      <div className="space-y-6">
        <EffectChain />
        <div className="grid gap-6 lg:grid-cols-2">
          <LimiterPanel />
          <CompressorPanel />
        </div>
        <OtherEffects />
      </div>
    </div>
  );
}
