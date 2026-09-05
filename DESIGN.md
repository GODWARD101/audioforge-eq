# Design Brief

## Direction

AudioForge EQ — a skeuomorphic hardware rack translated into liquid glassmorphism: dark charcoal surfaces, brushed-metallic rotary knobs, and a signal-red accent reserved for Post Gain / Out Gain.

## Tone

Refined industrial / analog-instrument: dark charcoal glass panels with real depth, metallic rotary controls, and disciplined restraint — every accent earns its place.

## Differentiation

The "signal-red gain" rule: a single red face on the Out/Post Gain knob amid silver controls makes the most dangerous control instantly legible, like a hardware compressor.

## Color Palette

| Token      | OKLCH           | Role                              |
| ---------- | --------------- | --------------------------------- |
| background | 0.13 0.012 260  | deep charcoal base                |
| foreground | 0.94 0.008 260  | primary text                      |
| card       | 0.17 0.014 260  | glass panel surface               |
| primary    | 0.72 0.16 25    | default accent (red)              |
| accent     | 0.72 0.16 25    | theme hue (swaps per `data-theme`)|
| gain       | 0.55 0.2 25     | signal red for Post/Out Gain      |
| destructive| 0.58 0.22 25    | destructive / bypass-off          |
| muted      | 0.22 0.02 260   | secondary surface                 |

## Typography

- Display: Space Grotesk — headings, knob labels, section titles
- Body: DM Sans — UI labels, descriptions, body text
- Mono: JetBrains Mono — numeric values, frequencies, gain readouts
- Scale: hero `text-4xl md:text-5xl font-bold tracking-tight`, h2 `text-2xl font-semibold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase`, body `text-sm md:text-base`

## Elevation & Depth

Glass panels use `backdrop-blur(18px)` + inset top highlight + deep drop shadow; knobs use `--knob-face` / `--knob-ring` brushed-metal gradients with inset highlights and shadows for 3D depth; background stays flat charcoal so panels and knobs pop.

## Structural Zones

| Zone    | Background            | Border          | Notes                                    |
| ------- | --------------------- | --------------- | ---------------------------------------- |
| Header  | `glass-panel`         | `border-b`      | theme selector + app title, frosted      |
| Content | `bg-background`       | —               | EQ band strips alternate `bg-muted/30`   |
| Footer  | `glass-panel`         | `border-t`      | Bypass + Compact toggles, gain readout   |

## Spacing & Rhythm

Section gaps `gap-8 md:gap-10`; control groups `gap-4`; knob-to-label `gap-2`; consistent `p-5 md:p-6` panel padding for a dense but breathable instrument layout.

## Component Patterns

- Buttons: rounded-full, `bg-primary` or `bg-destructive` red, hover lift via `shadow-elevated`
- Cards: `glass-panel` / `glass-panel-strong` rounded-2xl, backdrop blur, subtle border
- Knobs: circular `--knob-face` / `--knob-ring` tokens with `--knob-indicator` pointer, mono value readout
- Badges: rounded-full, `bg-muted` with `text-muted-foreground`

## Motion

- Entrance: `fade-up` 0.5s staggered per panel
- Hover: `transition-smooth` 0.3s, subtle lift + border brighten
- Decorative: `knob-glow` 2.4s pulse on active gain knob only

## Constraints

- EQ processes audio via Web Audio API nodes — never the microphone
- Fluid, non-freezing: GPU-friendly blur, `will-change` only on interactive knobs
- AA+ contrast in dark mode; keep C and H stable when swapping theme hue
- Token-only styling: no raw hex or arbitrary color classes in components

## Signature Detail

The single signal-red gain knob — one red face among silver, reserved exclusively for Post/Out Gain — is the interface's memorable, safety-first signature.
