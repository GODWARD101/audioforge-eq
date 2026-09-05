import type { EqMode } from "@/lib/audio/types";
import { cn } from "@/lib/utils";

const MODES: EqMode[] = [10, 13, 21];

interface EQModeSelectorProps {
  mode: EqMode;
  onChange: (mode: EqMode) => void;
}

/**
 * Segmented control to switch between 10, 13, and 21-band EQ modes.
 */
export function EQModeSelector({ mode, onChange }: EQModeSelectorProps) {
  return (
    <fieldset
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-card/60 p-1"
      aria-label="EQ mode"
      data-ocid="eq_mode_selector"
    >
      {MODES.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          aria-pressed={mode === m}
          className={cn(
            "rounded-md px-3 py-1.5 font-mono text-xs font-semibold transition-colors",
            mode === m
              ? "bg-accent text-accent-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
          )}
          data-ocid={`eq_mode.${m}`}
        >
          {m}-band
        </button>
      ))}
    </fieldset>
  );
}
