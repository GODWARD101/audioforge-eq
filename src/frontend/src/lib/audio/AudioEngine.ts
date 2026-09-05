/**
 * AudioForge EQ — Web Audio API engine.
 *
 * Builds the full processing graph: source -> EQ -> effects chain -> master
 * volume -> output. All parameter changes are smoothed with setTargetAtTime
 * for click-free operation.
 *
 * The EQ NEVER uses the microphone — all processing happens locally in the
 * browser.
 */

import {
  dbToGain,
  defaultFilterType,
  defaultQ,
  frequenciesForMode,
  toBiquadType,
} from "./dsp";
import type {
  AmplifierSettings,
  AppSettings,
  CompressorSettings,
  EffectId,
  EffectsSettings,
  EpicenterSettings,
  EqBand,
  EqMode,
  EqSettings,
  LimiterSettings,
  MonoblockSettings,
} from "./types";

const SMOOTH_TIME = 0.03; // seconds for click-free parameter changes

export class AudioEngine {
  private ctx: AudioContext | null = null;

  // Source
  private sourceGain: GainNode | null = null;

  // EQ
  private eqInput: GainNode | null = null;
  private eqOutput: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  // Tracks which EQ routing path is currently wired so we never leave the
  // direct dry path connected in parallel with the filter chain.
  private eqDirectConnected = false;
  private eqChainConnected = false;

  // Effects
  private fxInput: GainNode | null = null;
  private fxOutput: GainNode | null = null;
  private effectNodes: Partial<Record<EffectId, AudioNode[]>> = {};

  // Master
  private masterGain: GainNode | null = null;

  // State
  private settings: AppSettings | null = null;

  /** Lazily create and resume the AudioContext. */
  async ensureContext(): Promise<AudioContext> {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new Ctor();
      this.buildGraph();
    }
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
    return this.ctx;
  }

  get context(): AudioContext | null {
    return this.ctx;
  }

  /** Build the full processing graph. Call after ctx exists. */
  private buildGraph(): void {
    const ctx = this.ctx!;

    // Source stage
    this.sourceGain = ctx.createGain();

    // EQ stage
    this.eqInput = ctx.createGain();
    this.eqOutput = ctx.createGain();

    // Effects stage
    this.fxInput = ctx.createGain();
    this.fxOutput = ctx.createGain();

    // Master
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 1;

    // Wire: source -> EQ -> FX -> master -> destination
    this.sourceGain.connect(this.eqInput);

    // The eqInput -> eqOutput routing is owned by applyEq (it wires either the
    // filter chain in series or a direct dry path, never both).
    this.eqOutput.connect(this.fxInput);

    this.fxInput.connect(this.fxOutput);
    this.fxOutput.connect(this.masterGain);

    this.masterGain.connect(ctx.destination);
  }

  /** Apply the full settings to the graph. */
  applySettings(settings: AppSettings): void {
    this.settings = settings;
    this.applyEq(settings.eq);
    this.applyEffects(settings.effects);
    this.applyMaster(settings.masterVolume);
  }

  // -------------------------------------------------------------------------
  // EQ
  // -------------------------------------------------------------------------

  private applyEq(eq: EqSettings): void {
    const ctx = this.ctx;
    if (!ctx || !this.eqInput || !this.eqOutput) return;

    // Tear down the previous EQ routing so the filter chain and the direct
    // dry path never coexist (a parallel unity-gain path would make the EQ
    // inaudible).
    this.teardownEqRouting();

    // Rebuild filters to match the current mode.
    const targetCount = eq.bands.length;
    while (this.eqFilters.length < targetCount) {
      const filter = ctx.createBiquadFilter();
      filter.type = "peaking";
      filter.frequency.value = 1000;
      filter.Q.value = 1;
      filter.gain.value = 0;
      this.eqFilters.push(filter);
    }
    while (this.eqFilters.length > targetCount) {
      const filter = this.eqFilters.pop()!;
      filter.disconnect();
    }

    // Route the signal through the filter chain when bands exist and EQ is
    // not bypassed; otherwise use a direct eqInput -> eqOutput path so bypass
    // passes audio through unchanged.
    const useFilters = this.eqFilters.length > 0 && !eq.bypass;
    this.setEqRouting(useFilters);

    const anySolo = eq.bands.some((b) => b.soloed);
    eq.bands.forEach((band, i) => {
      const filter = this.eqFilters[i];
      if (!filter) return;
      filter.type = toBiquadType(band.filterType);
      this.smooth(filter.frequency, band.frequency);
      this.smooth(filter.Q, band.q);

      const effectiveGain = this.bandEffectiveGain(band, eq.bypass, anySolo);
      this.smooth(filter.gain, effectiveGain);
    });

    // The stage output gain is the EQ master gain only — never zeroed on
    // bypass (bypass is handled by routing around the filter chain above).
    this.smooth(this.eqOutput!.gain, dbToGain(eq.masterGain));
  }

  /** Disconnect both the direct dry path and the filter chain from the path. */
  private teardownEqRouting(): void {
    if (!this.eqInput || !this.eqOutput) return;
    if (this.eqDirectConnected) {
      this.eqInput.disconnect(this.eqOutput);
      this.eqDirectConnected = false;
    }
    if (this.eqChainConnected && this.eqFilters.length > 0) {
      this.eqInput.disconnect(this.eqFilters[0]);
      // Disconnect every series link so a later rewire never leaves duplicate
      // parallel connections between the same filter pairs.
      for (let i = 0; i < this.eqFilters.length - 1; i++) {
        this.eqFilters[i].disconnect(this.eqFilters[i + 1]);
      }
      this.eqFilters[this.eqFilters.length - 1].disconnect(this.eqOutput);
      this.eqChainConnected = false;
    }
  }

  /** Wire the EQ stage: filter chain in series, or a direct dry path. */
  private setEqRouting(useFilters: boolean): void {
    if (!this.eqInput || !this.eqOutput) return;
    if (useFilters) {
      if (this.eqFilters.length > 0) {
        // Chain ALL filters in series so every band receives input and its
        // output reaches the next stage:
        //   eqInput -> eqFilters[0] -> eqFilters[1] -> ... -> eqFilters[n-1]
        //   -> eqOutput
        this.eqInput.connect(this.eqFilters[0]);
        for (let i = 0; i < this.eqFilters.length - 1; i++) {
          this.eqFilters[i].connect(this.eqFilters[i + 1]);
        }
        this.eqFilters[this.eqFilters.length - 1].connect(this.eqOutput);
        this.eqChainConnected = true;
      }
    } else {
      this.eqInput.connect(this.eqOutput);
      this.eqDirectConnected = true;
    }
  }

  private bandEffectiveGain(
    band: EqBand,
    bypass: boolean,
    anySolo: boolean,
  ): number {
    if (bypass || !band.enabled) return 0;
    if (band.muted) return Number.NEGATIVE_INFINITY;
    if (anySolo && !band.soloed) return Number.NEGATIVE_INFINITY;
    return band.gain;
  }

  /** Update a single band's parameters without rebuilding the chain. */
  updateBand(band: EqBand, eq: EqSettings): void {
    const index = eq.bands.findIndex((b) => b.id === band.id);
    if (index < 0 || index >= this.eqFilters.length) return;
    const filter = this.eqFilters[index];
    if (!filter) return;
    filter.type = toBiquadType(band.filterType);
    this.smooth(filter.frequency, band.frequency);
    this.smooth(filter.Q, band.q);
    const anySolo = eq.bands.some((b) => b.soloed);
    this.smooth(filter.gain, this.bandEffectiveGain(band, eq.bypass, anySolo));
  }

  /** Update the EQ master gain in place (click-free) without rebuilding. */
  updateEqMasterGain(eq: EqSettings): void {
    if (!this.eqOutput) return;
    // Bypass is handled by routing around the filter chain in applyEq, so the
    // stage output gain is always the master gain — never zeroed on bypass.
    this.smooth(this.eqOutput.gain, dbToGain(eq.masterGain));
  }

  // -------------------------------------------------------------------------
  // Effects chain
  // -------------------------------------------------------------------------

  private applyEffects(effects: EffectsSettings): void {
    const ctx = this.ctx;
    if (!ctx || !this.fxInput || !this.fxOutput) return;

    // Tear down the previous chain.
    for (const nodes of Object.values(this.effectNodes)) {
      for (const node of nodes) {
        try {
          node.disconnect();
        } catch {
          // already disconnected
        }
      }
    }
    this.effectNodes = {};

    if (effects.masterBypass) {
      this.fxInput.connect(this.fxOutput);
      return;
    }

    // Build the chain in the configured order.
    let tail: AudioNode = this.fxInput;
    const connectNext = (node: AudioNode) => {
      tail.connect(node);
      tail = node;
    };

    for (const id of effects.order) {
      if (effects.bypassed.includes(id)) continue;
      switch (id) {
        case "limiter":
          connectNext(this.buildLimiter(effects.limiter));
          break;
        case "compressor":
          connectNext(this.buildCompressor(effects.compressor));
          break;
        case "epicenter":
          connectNext(this.buildEpicenter(effects.epicenter));
          break;
        case "monoblock":
          connectNext(this.buildMonoblock(effects.monoblock));
          break;
        case "amplifier":
          connectNext(this.buildAmplifier(effects.amplifier));
          break;
        case "bassTuning":
          connectNext(this.buildBassTuning(effects.bassTuning.curve));
          break;
        case "loudness":
          connectNext(this.buildLoudness(effects.loudness.curve));
          break;
        case "distortionReduction":
          connectNext(
            this.buildDistortionReduction(effects.distortionReduction.amount),
          );
          break;
      }
    }

    tail.connect(this.fxOutput);
  }

  private buildLimiter(s: LimiterSettings): AudioNode {
    const ctx = this.ctx!;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = s.threshold;
    comp.ratio.value = s.ratio;
    comp.attack.value = s.attack;
    comp.release.value = s.release;
    comp.knee.value = 0;
    const post = ctx.createGain();
    post.gain.value = dbToGain(s.postGain);
    comp.connect(post);
    this.effectNodes.limiter = [comp, post];
    return comp;
  }

  private buildCompressor(s: CompressorSettings): AudioNode {
    const ctx = this.ctx!;
    if (s.bypass) {
      const pass = ctx.createGain();
      pass.gain.value = 1;
      this.effectNodes.compressor = [pass];
      return pass;
    }
    const input = ctx.createGain();
    input.gain.value = dbToGain(s.inputGain);

    const splitter = ctx.createChannelSplitter(2);
    const merger = ctx.createChannelMerger(2);

    // Low band
    const lowPass = ctx.createBiquadFilter();
    lowPass.type = "lowpass";
    lowPass.frequency.value = s.lowXover;
    const lowComp = ctx.createDynamicsCompressor();
    lowComp.threshold.value = s.threshold;
    lowComp.ratio.value = s.ratio;
    lowComp.attack.value = s.attack;
    lowComp.release.value = s.release;
    lowPass.connect(lowComp);
    lowComp.connect(merger, 0, 0);
    lowComp.connect(merger, 0, 1);

    // Mid band
    const midLow = ctx.createBiquadFilter();
    midLow.type = "highpass";
    midLow.frequency.value = s.lowXover;
    const midHigh = ctx.createBiquadFilter();
    midHigh.type = "lowpass";
    midHigh.frequency.value = s.highXover;
    const midComp = ctx.createDynamicsCompressor();
    midComp.threshold.value = s.threshold;
    midComp.ratio.value = s.ratio;
    midComp.attack.value = s.attack;
    midComp.release.value = s.release;
    midLow.connect(midHigh);
    midHigh.connect(midComp);
    midComp.connect(merger, 0, 0);
    midComp.connect(merger, 0, 1);

    // High band
    const highPass = ctx.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = s.highXover;
    const highComp = ctx.createDynamicsCompressor();
    highComp.threshold.value = s.threshold;
    highComp.ratio.value = s.ratio;
    highComp.attack.value = s.attack;
    highComp.release.value = s.release;
    highPass.connect(highComp);
    highComp.connect(merger, 0, 0);
    highComp.connect(merger, 0, 1);

    input.connect(splitter);
    splitter.connect(lowPass, 0);
    splitter.connect(midLow, 0);
    splitter.connect(highPass, 0);

    const out = ctx.createGain();
    out.gain.value = dbToGain(s.outGain);
    merger.connect(out);

    this.effectNodes.compressor = [
      input,
      splitter,
      lowPass,
      lowComp,
      midLow,
      midHigh,
      midComp,
      highPass,
      highComp,
      merger,
      out,
    ];
    return input;
  }

  private buildEpicenter(s: EpicenterSettings): AudioNode {
    const ctx = this.ctx!;
    const input = ctx.createGain();
    const dry = ctx.createGain();
    dry.gain.value = 1;
    const wet = ctx.createGain();
    wet.gain.value = s.intensity / 100;
    const shelf = ctx.createBiquadFilter();
    shelf.type = "lowshelf";
    shelf.frequency.value = 120;
    shelf.gain.value = 12;
    const out = ctx.createGain();
    input.connect(dry);
    input.connect(shelf);
    shelf.connect(wet);
    dry.connect(out);
    wet.connect(out);
    this.effectNodes.epicenter = [input, dry, wet, shelf, out];
    return input;
  }

  private buildMonoblock(s: MonoblockSettings): AudioNode {
    const ctx = this.ctx!;
    const input = ctx.createGain();
    const dry = ctx.createGain();
    dry.gain.value = 1;
    const mono = ctx.createGain();
    mono.gain.value = s.blend / 100;
    const merger = ctx.createChannelMerger(2);
    const out = ctx.createGain();
    input.connect(dry);
    input.connect(mono);
    mono.connect(merger, 0, 0);
    mono.connect(merger, 0, 1);
    dry.connect(out);
    merger.connect(out);
    this.effectNodes.monoblock = [input, dry, mono, merger, out];
    return input;
  }

  private buildAmplifier(s: AmplifierSettings): AudioNode {
    const ctx = this.ctx!;
    const input = ctx.createGain();
    const shaper = ctx.createWaveShaper();
    shaper.curve = this.driveCurve(s.drive);
    const gain = ctx.createGain();
    gain.gain.value = dbToGain(s.gain);
    const tone = ctx.createBiquadFilter();
    tone.type = "peaking";
    tone.frequency.value = 2500;
    tone.Q.value = 0.7;
    tone.gain.value = s.tone;
    input.connect(shaper);
    shaper.connect(gain);
    gain.connect(tone);
    this.effectNodes.amplifier = [input, shaper, gain, tone];
    return input;
  }

  private driveCurve(drive: number): Float32Array<ArrayBuffer> {
    const n = 1024;
    const curve = new Float32Array(n);
    const k = 1 + drive / 40;
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      curve[i] = Math.tanh(x * k);
    }
    return curve;
  }

  private buildBassTuning(curve: number): AudioNode {
    const ctx = this.ctx!;
    const shelf = ctx.createBiquadFilter();
    shelf.type = "lowshelf";
    shelf.frequency.value = 100;
    shelf.gain.value = curve;
    this.effectNodes.bassTuning = [shelf];
    return shelf;
  }

  private buildLoudness(curve: number): AudioNode {
    const ctx = this.ctx!;
    const shelf = ctx.createBiquadFilter();
    shelf.type = "highshelf";
    shelf.frequency.value = 3000;
    shelf.gain.value = curve;
    this.effectNodes.loudness = [shelf];
    return shelf;
  }

  private buildDistortionReduction(amount: number): AudioNode {
    const ctx = this.ctx!;
    const input = ctx.createGain();
    const dry = ctx.createGain();
    dry.gain.value = 1;
    const wet = ctx.createGain();
    wet.gain.value = amount / 100;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 8000;
    const out = ctx.createGain();
    input.connect(dry);
    input.connect(lp);
    lp.connect(wet);
    dry.connect(out);
    wet.connect(out);
    this.effectNodes.distortionReduction = [input, dry, wet, lp, out];
    return input;
  }

  // -------------------------------------------------------------------------
  // Effects — live parameter updates (click-free, in-place)
  // -------------------------------------------------------------------------

  /** Update limiter parameters without rebuilding the chain. */
  updateLimiter(s: LimiterSettings): void {
    const nodes = this.effectNodes.limiter;
    if (!nodes || nodes.length < 2) return;
    const comp = nodes[0] as DynamicsCompressorNode;
    const post = nodes[1] as GainNode;
    this.smooth(comp.threshold, s.threshold);
    this.smooth(comp.ratio, s.ratio);
    this.smooth(comp.attack, s.attack);
    this.smooth(comp.release, s.release);
    this.smooth(post.gain, dbToGain(s.postGain));
  }

  /** Update multiband compressor parameters without rebuilding the chain. */
  updateCompressor(s: CompressorSettings): void {
    const nodes = this.effectNodes.compressor;
    if (!nodes || nodes.length < 11) return;
    const input = nodes[0] as GainNode;
    const lowPass = nodes[2] as BiquadFilterNode;
    const lowComp = nodes[3] as DynamicsCompressorNode;
    const midLow = nodes[4] as BiquadFilterNode;
    const midHigh = nodes[5] as BiquadFilterNode;
    const midComp = nodes[6] as DynamicsCompressorNode;
    const highPass = nodes[7] as BiquadFilterNode;
    const highComp = nodes[8] as DynamicsCompressorNode;
    const out = nodes[10] as GainNode;
    this.smooth(input.gain, dbToGain(s.inputGain));
    this.smooth(lowPass.frequency, s.lowXover);
    this.smooth(midLow.frequency, s.lowXover);
    this.smooth(midHigh.frequency, s.highXover);
    this.smooth(highPass.frequency, s.highXover);
    for (const comp of [lowComp, midComp, highComp]) {
      this.smooth(comp.threshold, s.threshold);
      this.smooth(comp.ratio, s.ratio);
      this.smooth(comp.attack, s.attack);
      this.smooth(comp.release, s.release);
    }
    this.smooth(out.gain, dbToGain(s.outGain));
  }

  /** Update epicenter intensity without rebuilding the chain. */
  updateEpicenter(s: EpicenterSettings): void {
    const nodes = this.effectNodes.epicenter;
    if (!nodes || nodes.length < 5) return;
    const wet = nodes[2] as GainNode;
    this.smooth(wet.gain, s.intensity / 100);
  }

  /** Update monoblock blend without rebuilding the chain. */
  updateMonoblock(s: MonoblockSettings): void {
    const nodes = this.effectNodes.monoblock;
    if (!nodes || nodes.length < 5) return;
    const mono = nodes[2] as GainNode;
    this.smooth(mono.gain, s.blend / 100);
  }

  /** Update amplifier drive/gain/tone without rebuilding the chain. */
  updateAmplifier(s: AmplifierSettings): void {
    const nodes = this.effectNodes.amplifier;
    if (!nodes || nodes.length < 4) return;
    const shaper = nodes[1] as WaveShaperNode;
    const gain = nodes[2] as GainNode;
    const tone = nodes[3] as BiquadFilterNode;
    shaper.curve = this.driveCurve(s.drive);
    this.smooth(gain.gain, dbToGain(s.gain));
    this.smooth(tone.gain, s.tone);
  }

  /** Update bass tuning curve without rebuilding the chain. */
  updateBassTuning(curve: number): void {
    const nodes = this.effectNodes.bassTuning;
    if (!nodes || nodes.length < 1) return;
    const shelf = nodes[0] as BiquadFilterNode;
    this.smooth(shelf.gain, curve);
  }

  /** Update loudness curve without rebuilding the chain. */
  updateLoudness(curve: number): void {
    const nodes = this.effectNodes.loudness;
    if (!nodes || nodes.length < 1) return;
    const shelf = nodes[0] as BiquadFilterNode;
    this.smooth(shelf.gain, curve);
  }

  /** Update distortion reduction amount without rebuilding the chain. */
  updateDistortionReduction(amount: number): void {
    const nodes = this.effectNodes.distortionReduction;
    if (!nodes || nodes.length < 5) return;
    const wet = nodes[2] as GainNode;
    this.smooth(wet.gain, amount / 100);
  }

  // -------------------------------------------------------------------------
  // Master
  // -------------------------------------------------------------------------

  private applyMaster(volume: number): void {
    if (!this.masterGain) return;
    this.smooth(this.masterGain.gain, volume);
  }

  setMasterVolume(volume: number): void {
    if (!this.masterGain) return;
    this.smooth(this.masterGain.gain, volume);
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /** Smooth a parameter toward a target value (click-free). */
  private smooth(param: AudioParam, value: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    param.cancelScheduledValues(t);
    param.setTargetAtTime(value, t, SMOOTH_TIME);
  }

  /** Dispose the engine and all nodes. */
  dispose(): void {
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.eqFilters = [];
    this.eqDirectConnected = false;
    this.eqChainConnected = false;
    this.effectNodes = {};
  }
}

/** Build a default EQ band set for a given mode. */
export function buildDefaultBands(mode: EqMode): EqBand[] {
  const freqs = frequenciesForMode(mode);
  return freqs.map((frequency, i) => ({
    id: `band-${i}`,
    frequency,
    q: defaultQ(defaultFilterType(i, freqs.length)),
    gain: 0,
    filterType: defaultFilterType(i, freqs.length),
    enabled: true,
    muted: false,
    soloed: false,
  }));
}

/** Rebuild a band set for a new mode, preserving gain where frequencies match. */
export function rebuildBands(mode: EqMode, previous: EqBand[]): EqBand[] {
  const freqs = frequenciesForMode(mode);
  return freqs.map((frequency, i) => {
    const match = previous.find((b) => Math.abs(b.frequency - frequency) < 1);
    return {
      id: `band-${i}`,
      frequency,
      q: match?.q ?? defaultQ(defaultFilterType(i, freqs.length)),
      gain: match?.gain ?? 0,
      filterType: match?.filterType ?? defaultFilterType(i, freqs.length),
      enabled: match?.enabled ?? true,
      muted: match?.muted ?? false,
      soloed: match?.soloed ?? false,
    };
  });
}

/** Default effects chain order. */
export const DEFAULT_EFFECT_ORDER: EffectId[] = [
  "limiter",
  "compressor",
  "epicenter",
  "monoblock",
  "amplifier",
  "bassTuning",
  "loudness",
  "distortionReduction",
];

/** Build default settings for a fresh engine. */
export function buildDefaultSettings(): AppSettings {
  const eq: EqSettings = {
    mode: 10,
    bands: buildDefaultBands(10),
    masterGain: 0,
    bypass: false,
  };
  const effects: EffectsSettings = {
    limiter: {
      threshold: -6,
      postGain: 0,
      ratio: 10,
      attack: 0.003,
      release: 0.25,
    },
    compressor: {
      lowXover: 200,
      highXover: 4000,
      attack: 0.02,
      release: 0.2,
      ratio: 4,
      inputGain: 0,
      threshold: -20,
      outGain: 0,
      bypass: false,
      compact: false,
    },
    epicenter: { intensity: 0 },
    monoblock: { blend: 0 },
    amplifier: { drive: 0, gain: 0, tone: 0 },
    bassTuning: { curve: 0 },
    loudness: { curve: 0 },
    distortionReduction: { amount: 0 },
    order: [...DEFAULT_EFFECT_ORDER],
    masterBypass: false,
    bypassed: [],
  };
  return {
    masterVolume: 0.8,
    eq,
    effects,
  };
}
