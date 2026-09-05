import { clamp } from "@/lib/audio/dsp";
import { cn } from "@/lib/utils";
import { useCallback, useRef } from "react";

interface RotaryKnobProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  /** Format the value for the readout. */
  format?: (value: number) => string;
  /** "metal" for silver controls, "gain" for the signal-red Post/Out Gain. */
  variant?: "metal" | "gain";
  size?: number;
  /** Optional accent glow on the active knob. */
  active?: boolean;
  /** Use a logarithmic scale (e.g. for frequency). min/max must be > 0. */
  log?: boolean;
  className?: string;
}

const SWEEP = 270; // degrees of rotation
const START_ANGLE = -135;

/** Normalize a value into [0, 1] on a linear or logarithmic scale. */
function toNorm(value: number, min: number, max: number, log: boolean): number {
  if (log) {
    return (
      (Math.log10(value) - Math.log10(min)) /
      (Math.log10(max) - Math.log10(min))
    );
  }
  return (value - min) / (max - min);
}

/** Map a normalized [0, 1] position back to a value on the chosen scale. */
function fromNorm(t: number, min: number, max: number, log: boolean): number {
  if (log) {
    return 10 ** (Math.log10(min) + t * (Math.log10(max) - Math.log10(min)));
  }
  return min + t * (max - min);
}

function valueToAngle(
  value: number,
  min: number,
  max: number,
  log: boolean,
): number {
  return START_ANGLE + toNorm(value, min, max, log) * SWEEP;
}

/**
 * Metallic rotary knob with a pointer line and mono value readout.
 * Drag vertically (or use arrow keys) to adjust. The `gain` variant renders
 * the signal-red face reserved for Post/Out Gain.
 */
export function RotaryKnob({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  format,
  variant = "metal",
  size = 64,
  active = false,
  log = false,
  className,
}: RotaryKnobProps) {
  const dragRef = useRef<{ startY: number; startValue: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = { startY: e.clientY, startValue: value };
    },
    [value],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dy = drag.startY - e.clientY;
      const t = toNorm(drag.startValue, min, max, log) + dy / 150;
      const next = fromNorm(t, min, max, log);
      const stepped = Math.round(next / step) * step;
      onChange(clamp(stepped, min, max));
    },
    [min, max, step, log, onChange],
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      let delta = 0;
      if (e.key === "ArrowUp" || e.key === "ArrowRight") delta = step;
      else if (e.key === "ArrowDown" || e.key === "ArrowLeft") delta = -step;
      else if (e.key === "Home") {
        onChange(min);
        return;
      } else if (e.key === "End") {
        onChange(max);
        return;
      } else {
        return;
      }
      e.preventDefault();
      const t = toNorm(value, min, max, log) + delta;
      onChange(clamp(fromNorm(t, min, max, log), min, max));
    },
    [step, min, max, log, value, onChange],
  );

  const angle = valueToAngle(value, min, max, log);
  const display = format ? format(value) : value.toFixed(0);

  return (
    <div
      className={cn("flex flex-col items-center gap-2 select-none", className)}
    >
      <div
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={display}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative cursor-ns-resize rounded-full outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/60",
          active && "animate-knob-glow",
        )}
        style={{ width: size, height: size }}
        data-ocid="rotary_knob"
      >
        {/* Knob body */}
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            variant === "gain" ? "knob-gain" : "knob-metal",
          )}
        />
        {/* Indicator line */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `translate(-50%, -100%) rotate(${angle}deg)`,
            transformOrigin: "50% 100%",
          }}
        >
          <div
            className={cn(
              "h-[38%] w-[3px] rounded-full",
              variant === "gain" ? "bg-gain-foreground" : "knob-indicator",
            )}
            style={{ marginTop: `-${size * 0.19}px` }}
          />
        </div>
        {/* Center cap */}
        <div className="absolute left-1/2 top-1/2 h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/40 shadow-inner" />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="font-mono text-xs text-foreground">{display}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}
