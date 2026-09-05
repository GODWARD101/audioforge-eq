import { RotaryKnob } from "@/components/RotaryKnob";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { defaultQ, formatDb, formatFrequency } from "@/lib/audio/dsp";
import type { EqBand, FilterType } from "@/lib/audio/types";
import { cn } from "@/lib/utils";
import { Headphones, VolumeX } from "lucide-react";

const FILTER_TYPES: FilterType[] = [
  "peaking",
  "low-shelf",
  "high-shelf",
  "low-pass",
  "high-pass",
];

const FILTER_LABELS: Record<FilterType, string> = {
  peaking: "Peaking",
  "low-shelf": "Low Shelf",
  "high-shelf": "High Shelf",
  "low-pass": "Low Pass",
  "high-pass": "High Pass",
};

const MIN_FREQ = 20;
const MAX_FREQ = 20000;

interface BandControlsProps {
  bands: EqBand[];
  selectedBandId: string | null;
  onSelectBand: (bandId: string) => void;
  onUpdateBand: (band: EqBand) => void;
}

/**
 * Horizontal, scrollable strip of per-band control cards. Each card exposes
 * the band's frequency, Q, filter type, mute/solo, and enable state. Gain is
 * edited on the EQ curve. Frequency and Q changes flow through onUpdateBand
 * and are applied to the AudioEngine in real time with click-free smoothing.
 */
export function BandControls({
  bands,
  selectedBandId,
  onSelectBand,
  onUpdateBand,
}: BandControlsProps) {
  return (
    <div
      className="scrollbar-thin flex gap-3 overflow-x-auto pb-2"
      data-ocid="band_controls"
    >
      {bands.map((band, i) => {
        const selected = band.id === selectedBandId;
        const patch = (p: Partial<EqBand>) => onUpdateBand({ ...band, ...p });
        return (
          <div
            key={band.id}
            className={cn(
              "flex w-44 shrink-0 flex-col gap-3 rounded-xl border p-3 transition-colors",
              selected
                ? "border-accent/60 bg-accent/10"
                : "border-border bg-card/40",
            )}
            data-ocid={`band_card.${i}`}
          >
            <button
              type="button"
              onClick={() => onSelectBand(band.id)}
              className="flex items-center justify-between text-left"
              data-ocid={`band_select.${i}`}
            >
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Band {i + 1}
              </span>
              <span className="font-mono text-sm font-bold text-foreground">
                {formatFrequency(band.frequency)}
              </span>
            </button>

            <Select
              value={band.filterType}
              onValueChange={(v) => {
                const filterType = v as FilterType;
                patch({ filterType, q: defaultQ(filterType) });
              }}
            >
              <SelectTrigger
                size="sm"
                className="w-full"
                data-ocid={`band_filter_type.${i}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {FILTER_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-start justify-between gap-1">
              <RotaryKnob
                value={band.frequency}
                min={MIN_FREQ}
                max={MAX_FREQ}
                step={1}
                onChange={(frequency) => patch({ frequency })}
                label="Freq"
                format={(v) => formatFrequency(v)}
                size={48}
                log
                active={selected}
              />
              <RotaryKnob
                value={band.q}
                min={0.1}
                max={12}
                step={0.1}
                onChange={(q) => patch({ q })}
                label="Q"
                format={(v) => v.toFixed(1)}
                size={48}
                active={selected}
              />
            </div>

            <div className="flex items-center justify-between gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={band.muted ? "default" : "ghost"}
                    size="icon"
                    className="size-8"
                    onClick={() => patch({ muted: !band.muted })}
                    aria-label={`Mute band ${i + 1}`}
                    aria-pressed={band.muted}
                    data-ocid={`band_mute.${i}`}
                  >
                    <VolumeX className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mute</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={band.soloed ? "default" : "ghost"}
                    size="icon"
                    className="size-8"
                    onClick={() => patch({ soloed: !band.soloed })}
                    aria-label={`Solo band ${i + 1}`}
                    aria-pressed={band.soloed}
                    data-ocid={`band_solo.${i}`}
                  >
                    <Headphones className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Solo</TooltipContent>
              </Tooltip>
              <div className="flex items-center gap-1.5">
                <Switch
                  checked={band.enabled}
                  onCheckedChange={(enabled) => patch({ enabled })}
                  aria-label={`Enable band ${i + 1}`}
                  data-ocid={`band_enable.${i}`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Gain
              </span>
              <span className="font-mono text-xs font-semibold text-foreground">
                {formatDb(band.gain)} dB
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
