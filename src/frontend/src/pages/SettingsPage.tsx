import { GlassPanel } from "@/components/GlassPanel";
import { RotaryKnob } from "@/components/RotaryKnob";
import { ExportImport } from "@/components/settings/ExportImport";
import { ThemePicker } from "@/components/settings/ThemePicker";
import { useTheme } from "@/hooks/use-theme";
import { useAudioStore } from "@/lib/store";
import { Volume2 } from "lucide-react";

/**
 * Settings workspace: color theme + accent selection, master volume, and
 * full export/import of the configuration as a single JSON file.
 */
export function SettingsPage() {
  const { themeDefinition } = useTheme();
  const masterVolume = useAudioStore((s) => s.settings.masterVolume);
  const setMasterVolume = useAudioStore((s) => s.setMasterVolume);

  return (
    <div className="relative overflow-hidden">
      {/* Ambient glow backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-24 right-0 h-80 w-80 rounded-full bg-accent/10 blur-[110px]" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theme · {themeDefinition.name} — tune the look and manage your
            configuration.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-6">
            <ThemePicker />
            <ExportImport />
          </div>

          <GlassPanel
            strong
            className="h-fit p-6 sm:p-8"
            data-ocid="settings_volume_panel"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Volume2 className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Master volume
                </h2>
                <p className="text-sm text-muted-foreground">
                  Global output level for the rack.
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center">
              <RotaryKnob
                value={masterVolume}
                min={0}
                max={1}
                step={0.01}
                onChange={setMasterVolume}
                label="Volume"
                format={(v) => `${Math.round(v * 100)}%`}
                size={120}
                active
              />
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { label: "Theme", value: themeDefinition.name },
                { label: "EQ", value: "10/13/21" },
                { label: "FX", value: "8 modules" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="glass-inset rounded-xl px-3 py-3 text-center"
                >
                  <p className="truncate font-mono text-xs font-semibold text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
