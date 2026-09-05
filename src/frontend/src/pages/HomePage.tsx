import { GlassPanel } from "@/components/GlassPanel";
import { RotaryKnob } from "@/components/RotaryKnob";
import { useAudioStore } from "@/lib/store";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  AudioWaveform,
  Gauge,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Waves,
  Zap,
} from "lucide-react";

const MODULES = [
  {
    to: "/eq",
    title: "Parametric EQ",
    description:
      "10, 13, or 21-band equalizer with draggable curve, per-band filter types, mute/solo, and click-free parameter smoothing.",
    icon: SlidersHorizontal,
  },
  {
    to: "/effects",
    title: "Effects Rack",
    description:
      "Limiter, multiband compressor, epicenter bass, monoblock, amplifier, and tuning systems in a reorderable chain.",
    icon: Waves,
  },
  {
    to: "/presets",
    title: "Presets & Profiles",
    description:
      "Factory and user presets, plus headphone and speaker profiles that capture every EQ and effect parameter.",
    icon: AudioWaveform,
  },
  {
    to: "/settings",
    title: "Settings",
    description:
      "Multiple color themes, accent selection, master volume, and full export/import of your configuration.",
    icon: Settings2,
  },
];

const FEATURES = [
  {
    icon: Gauge,
    title: "Real-time DSP",
    description:
      "Web Audio API processing with smoothed, click-free parameter changes for fluid, non-freezing performance.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    description:
      "All processing happens locally in your browser. The EQ never touches your microphone.",
  },
];

/**
 * Landing / overview page for AudioForge EQ.
 */
export function HomePage() {
  const masterVolume = useAudioStore((s) => s.settings.masterVolume);
  const setMasterVolume = useAudioStore((s) => s.setMasterVolume);
  const eqMode = useAudioStore((s) => s.settings.eq.mode);

  return (
    <div className="relative overflow-hidden">
      {/* Ambient glow backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent/10 blur-[100px]" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Hero */}
        <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              Professional audio rack · runs entirely in your browser
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
              Shape your sound with a{" "}
              <span className="text-gradient">studio-grade EQ</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              AudioForge EQ is a parametric equalizer and effects rack with a
              draggable curve, multiband compressor, and limiter — all processed
              locally with a liquid glassmorphism interface.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/eq"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-subtle transition-colors hover:bg-primary/90"
                data-ocid="home_open_eq_button"
              >
                Open the EQ
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Hero rack panel */}
          <GlassPanel strong className="animate-fade-up p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-sm font-semibold text-foreground">
                  Master output
                </p>
                <p className="text-xs text-muted-foreground">
                  {eqMode}-band EQ active
                </p>
              </div>
              <span className="rounded-md bg-primary/15 px-2 py-1 font-mono text-xs text-primary">
                READY
              </span>
            </div>
            <div className="mt-6 flex items-center justify-center">
              <RotaryKnob
                value={masterVolume}
                min={0}
                max={1}
                step={0.01}
                onChange={setMasterVolume}
                label="Volume"
                format={(v) => `${Math.round(v * 100)}%`}
                size={96}
                active
              />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { label: "EQ", value: "10/13/21" },
                { label: "FX", value: "8 modules" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="glass-inset rounded-xl px-3 py-3 text-center"
                >
                  <p className="font-mono text-sm font-semibold text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </GlassPanel>
        </section>

        {/* Feature highlights */}
        <section
          className="mt-16 grid gap-4 sm:grid-cols-3"
          data-ocid="home_features"
        >
          {FEATURES.map((feature) => (
            <GlassPanel key={feature.title} className="p-6">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <feature.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </GlassPanel>
          ))}
        </section>

        {/* Module grid */}
        <section className="mt-16" data-ocid="home_modules">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                The full rack
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Every module is a dedicated workspace.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((mod) => (
              <Link
                key={mod.to}
                to={mod.to}
                className="group"
                data-ocid={`home_module_${mod.title.toLowerCase().replace(/\s+/g, "_")}`}
              >
                <GlassPanel className="h-full p-6 transition-transform duration-300 group-hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                      <mod.icon className="size-5" aria-hidden="true" />
                    </span>
                    <ArrowRight
                      className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                    {mod.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {mod.description}
                  </p>
                </GlassPanel>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
