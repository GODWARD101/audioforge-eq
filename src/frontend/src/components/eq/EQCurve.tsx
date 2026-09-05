import { clamp, formatDb, formatFrequency, mapRange } from "@/lib/audio/dsp";
import type { EqBand, FilterType } from "@/lib/audio/types";
import { useCallback, useMemo, useRef } from "react";

const MIN_FREQ = 20;
const MAX_FREQ = 20000;
const MIN_GAIN = -12;
const MAX_GAIN = 12;
const WIDTH = 820;
const HEIGHT = 320;
const PAD_X = 16;
const PAD_Y = 20;
const SAMPLE_RATE = 48000;

const LOG_MIN = Math.log10(MIN_FREQ);
const LOG_MAX = Math.log10(MAX_FREQ);

function xForFreq(freq: number): number {
  return mapRange(Math.log10(freq), LOG_MIN, LOG_MAX, PAD_X, WIDTH - PAD_X);
}
function yForGain(gain: number): number {
  return mapRange(gain, MAX_GAIN, MIN_GAIN, PAD_Y, HEIGHT - PAD_Y);
}
function gainForY(y: number): number {
  return mapRange(y, PAD_Y, HEIGHT - PAD_Y, MAX_GAIN, MIN_GAIN);
}

interface Coeffs {
  b0: number;
  b1: number;
  b2: number;
  a0: number;
  a1: number;
  a2: number;
}

/** RBJ cookbook biquad coefficients for a given filter. */
function biquadCoeffs(
  type: FilterType,
  f0: number,
  q: number,
  gainDb: number,
): Coeffs {
  const w0 = (2 * Math.PI * f0) / SAMPLE_RATE;
  const cosw0 = Math.cos(w0);
  const sinw0 = Math.sin(w0);
  const alpha = sinw0 / (2 * q);
  switch (type) {
    case "peaking": {
      const A = 10 ** (gainDb / 40);
      return {
        b0: 1 + alpha * A,
        b1: -2 * cosw0,
        b2: 1 - alpha * A,
        a0: 1 + alpha / A,
        a1: -2 * cosw0,
        a2: 1 - alpha / A,
      };
    }
    case "low-shelf": {
      const A = 10 ** (gainDb / 40);
      const sA = Math.sqrt(A);
      return {
        b0: A * (A + 1 - (A - 1) * cosw0 + 2 * sA * alpha),
        b1: 2 * A * (A - 1 - (A + 1) * cosw0),
        b2: A * (A + 1 - (A - 1) * cosw0 - 2 * sA * alpha),
        a0: A + 1 + (A - 1) * cosw0 + 2 * sA * alpha,
        a1: -2 * (A - 1 + (A + 1) * cosw0),
        a2: A + 1 + (A - 1) * cosw0 - 2 * sA * alpha,
      };
    }
    case "high-shelf": {
      const A = 10 ** (gainDb / 40);
      const sA = Math.sqrt(A);
      return {
        b0: A * (A + 1 + (A - 1) * cosw0 + 2 * sA * alpha),
        b1: -2 * A * (A - 1 + (A + 1) * cosw0),
        b2: A * (A + 1 + (A - 1) * cosw0 - 2 * sA * alpha),
        a0: A + 1 - (A - 1) * cosw0 + 2 * sA * alpha,
        a1: 2 * (A - 1 - (A + 1) * cosw0),
        a2: A + 1 - (A - 1) * cosw0 - 2 * sA * alpha,
      };
    }
    case "low-pass":
      return {
        b0: (1 - cosw0) / 2,
        b1: 1 - cosw0,
        b2: (1 - cosw0) / 2,
        a0: 1 + alpha,
        a1: -2 * cosw0,
        a2: 1 - alpha,
      };
    case "high-pass":
      return {
        b0: (1 + cosw0) / 2,
        b1: -(1 + cosw0),
        b2: (1 + cosw0) / 2,
        a0: 1 + alpha,
        a1: -2 * cosw0,
        a2: 1 - alpha,
      };
  }
}

/** Magnitude response (dB) of a biquad at a given frequency. */
function magnitudeDb(c: Coeffs, f: number): number {
  const w = (2 * Math.PI * f) / SAMPLE_RATE;
  const cw = Math.cos(w);
  const c2w = Math.cos(2 * w);
  const sw = Math.sin(w);
  const s2w = Math.sin(2 * w);
  const num =
    (c.b0 + c.b1 * cw + c.b2 * c2w) ** 2 + (c.b1 * sw + c.b2 * s2w) ** 2;
  const den =
    (c.a0 + c.a1 * cw + c.a2 * c2w) ** 2 + (c.a1 * sw + c.a2 * s2w) ** 2;
  return 10 * Math.log10(Math.max(num / den, 1e-12));
}

/** Sample the combined EQ response across the log frequency axis. */
function computeResponse(bands: EqBand[], bypass: boolean): number[] {
  const anySolo = bands.some((b) => b.soloed);
  const active = bands.filter((b) => {
    if (bypass || !b.enabled) return false;
    if (b.muted) return false;
    if (anySolo && !b.soloed) return false;
    return true;
  });
  const coeffs = active.map((b) =>
    biquadCoeffs(b.filterType, b.frequency, b.q, b.gain),
  );
  const points: number[] = [];
  const N = 160;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const f = 10 ** (LOG_MIN + t * (LOG_MAX - LOG_MIN));
    let db = 0;
    for (const c of coeffs) db += magnitudeDb(c, f);
    points.push(db);
  }
  return points;
}

interface EQCurveProps {
  bands: EqBand[];
  bypass: boolean;
  selectedBandId: string | null;
  onSelectBand: (bandId: string) => void;
  onGainChange: (bandId: string, gain: number) => void;
}

/**
 * Visual draggable EQ curve. The X axis is logarithmic frequency, the Y axis
 * is gain in dB. Nodes are dragged vertically to adjust each band's gain; the
 * rendered curve is the summed magnitude response of all active filters.
 */
export function EQCurve({
  bands,
  bypass,
  selectedBandId,
  onSelectBand,
  onGainChange,
}: EQCurveProps) {
  const dragRef = useRef<{
    bandId: string;
    startY: number;
    startGain: number;
  } | null>(null);

  const response = useMemo(
    () => computeResponse(bands, bypass),
    [bands, bypass],
  );

  const pathD = useMemo(() => {
    let d = "";
    for (let i = 0; i < response.length; i++) {
      const t = i / (response.length - 1);
      const f = 10 ** (LOG_MIN + t * (LOG_MAX - LOG_MIN));
      const x = xForFreq(f);
      const y = yForGain(clamp(response[i], MIN_GAIN, MAX_GAIN));
      d += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }
    return d;
  }, [response]);

  const handleNodePointerDown = useCallback(
    (e: React.PointerEvent<SVGCircleElement>, bandId: string, gain: number) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = { bandId, startY: e.clientY, startGain: gain };
      onSelectBand(bandId);
    },
    [onSelectBand],
  );

  const handleNodePointerMove = useCallback(
    (e: React.PointerEvent<SVGCircleElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const svg = e.currentTarget.ownerSVGElement;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleY = HEIGHT / rect.height;
      const y = (e.clientY - rect.top) * scaleY;
      const gain = clamp(gainForY(y), MIN_GAIN, MAX_GAIN);
      onGainChange(drag.bandId, Math.round(gain * 10) / 10);
    },
    [onGainChange],
  );

  const handleNodePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleNodeKeyDown = useCallback(
    (
      e: React.KeyboardEvent<SVGCircleElement>,
      bandId: string,
      gain: number,
    ) => {
      let delta = 0;
      if (e.key === "ArrowUp") delta = 1;
      else if (e.key === "ArrowDown") delta = -1;
      else return;
      e.preventDefault();
      onGainChange(bandId, clamp(gain + delta, MIN_GAIN, MAX_GAIN));
    },
    [onGainChange],
  );

  const gridLines = useMemo(() => {
    const gains = [-12, -6, 0, 6, 12];
    const freqs = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    return { gains, freqs };
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-xl glass-inset">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block w-full"
        role="img"
        aria-label="Equalizer response curve. Drag the nodes vertically to adjust each band's gain."
        data-ocid="eq_curve"
      >
        {/* Horizontal gain grid */}
        {gridLines.gains.map((g) => {
          const y = yForGain(g);
          return (
            <g key={g}>
              <line
                x1={PAD_X}
                y1={y}
                x2={WIDTH - PAD_X}
                y2={y}
                stroke="oklch(var(--border) / 0.5)"
                strokeWidth={g === 0 ? 1.4 : 0.7}
                strokeDasharray={g === 0 ? undefined : "3 4"}
              />
              <text
                x={PAD_X - 4}
                y={y + 3}
                textAnchor="end"
                fontSize="9"
                fill="oklch(var(--muted-foreground) / 0.8)"
                fontFamily="var(--font-mono)"
              >
                {g > 0 ? `+${g}` : g}
              </text>
            </g>
          );
        })}

        {/* Vertical frequency grid */}
        {gridLines.freqs.map((f) => {
          const x = xForFreq(f);
          return (
            <g key={f}>
              <line
                x1={x}
                y1={PAD_Y}
                x2={x}
                y2={HEIGHT - PAD_Y}
                stroke="oklch(var(--border) / 0.35)"
                strokeWidth={0.7}
                strokeDasharray="2 4"
              />
              <text
                x={x}
                y={HEIGHT - PAD_Y + 12}
                textAnchor="middle"
                fontSize="9"
                fill="oklch(var(--muted-foreground) / 0.8)"
                fontFamily="var(--font-mono)"
              >
                {formatFrequency(f)}
              </text>
            </g>
          );
        })}

        {/* Response curve */}
        <path
          d={pathD}
          fill="none"
          stroke="oklch(var(--accent))"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 6px oklch(var(--accent) / 0.5))" }}
        />

        {/* Band nodes */}
        {bands.map((band) => {
          const x = xForFreq(band.frequency);
          const y = yForGain(band.gain);
          const selected = band.id === selectedBandId;
          const inactive = bypass || !band.enabled || band.muted;
          return (
            <g key={band.id}>
              <circle
                cx={x}
                cy={y}
                r={selected ? 13 : 11}
                fill="transparent"
                onPointerDown={(e) =>
                  handleNodePointerDown(e, band.id, band.gain)
                }
                onPointerMove={handleNodePointerMove}
                onPointerUp={handleNodePointerUp}
                onPointerCancel={handleNodePointerUp}
                onKeyDown={(e) => handleNodeKeyDown(e, band.id, band.gain)}
                tabIndex={0}
                role="slider"
                aria-label={`Band ${formatFrequency(band.frequency)} gain`}
                aria-valuemin={MIN_GAIN}
                aria-valuemax={MAX_GAIN}
                aria-valuenow={band.gain}
                aria-valuetext={`${formatDb(band.gain)} dB`}
                className="cursor-ns-resize outline-none focus-visible:stroke-ring"
                data-ocid={`eq_node.${bands.indexOf(band)}`}
              />
              <circle
                cx={x}
                cy={y}
                r={selected ? 7 : 5.5}
                fill={
                  inactive
                    ? "oklch(var(--muted-foreground))"
                    : "oklch(var(--accent))"
                }
                stroke="oklch(var(--card))"
                strokeWidth={2}
                style={{
                  filter: selected
                    ? "drop-shadow(0 0 5px oklch(var(--accent) / 0.9))"
                    : undefined,
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
