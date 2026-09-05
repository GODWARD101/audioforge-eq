import { GlassPanel } from "@/components/GlassPanel";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { Check, Palette } from "lucide-react";

/**
 * Theme picker. Each theme maps to an accent palette (hue/chroma) applied to
 * the whole rack via the `data-theme` attribute. Selecting a card updates the
 * active theme and persists it.
 */
export function ThemePicker() {
  const { theme, themes, setTheme } = useTheme();

  return (
    <GlassPanel className="p-6 sm:p-8" data-ocid="settings_theme_panel">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Palette className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Color theme
          </h2>
          <p className="text-sm text-muted-foreground">
            Pick an accent palette for the whole rack.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {themes.map((t) => {
          const active = t.id === theme;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              aria-pressed={active}
              data-ocid={`theme_${t.id}`}
              className={cn(
                "group flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                active
                  ? "border-primary/60 bg-primary/10 shadow-subtle"
                  : "border-border bg-card/40 hover:border-border hover:bg-card/70",
              )}
            >
              <span className="flex w-full items-center justify-between">
                <span
                  className="size-8 rounded-full ring-2 ring-white/10"
                  style={{ background: t.swatch }}
                  aria-hidden="true"
                />
                {active && (
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block font-display text-sm font-semibold text-foreground">
                  {t.name}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {t.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </GlassPanel>
  );
}
