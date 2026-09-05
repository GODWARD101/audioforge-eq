import { describe, expect, it, vi } from "vitest";

// The global setup mocks @/lib/audio/AudioEngine for the page suites. This
// file exercises the REAL engine's EQ routing logic, so import the actual
// module and drive it through a fake Web Audio graph that records connections.
const { AudioEngine, buildDefaultSettings } = await vi.importActual<
  typeof import("@/lib/audio/AudioEngine")
>("@/lib/audio/AudioEngine");

/** Minimal AudioParam that records the last target value. */
class FakeAudioParam {
  value: number;
  constructor(value = 0) {
    this.value = value;
  }
  cancelScheduledValues() {}
  setTargetAtTime(value: number) {
    this.value = value;
  }
}

/** Minimal AudioNode that records its outgoing connections. */
class FakeAudioNode {
  connections: FakeAudioNode[] = [];
  connect(dest: FakeAudioNode): FakeAudioNode {
    this.connections.push(dest);
    return dest;
  }
  disconnect(dest?: FakeAudioNode): void {
    if (dest) {
      this.connections = this.connections.filter((c) => c !== dest);
    } else {
      this.connections = [];
    }
  }
}

class FakeGainNode extends FakeAudioNode {
  gain = new FakeAudioParam(1);
}

class FakeBiquadFilterNode extends FakeAudioNode {
  type = "peaking";
  frequency = new FakeAudioParam(1000);
  Q = new FakeAudioParam(1);
  gain = new FakeAudioParam(0);
}

class FakeAnalyserNode extends FakeAudioNode {
  fftSize = 2048;
  smoothingTimeConstant = 0.8;
  frequencyBinCount = 1024;
  getByteFrequencyData() {}
  getFloatTimeDomainData() {}
}

class FakeDynamicsCompressorNode extends FakeAudioNode {
  threshold = new FakeAudioParam(-6);
  ratio = new FakeAudioParam(10);
  attack = new FakeAudioParam(0.003);
  release = new FakeAudioParam(0.25);
  knee = new FakeAudioParam(0);
}

class FakeChannelSplitterNode extends FakeAudioNode {}
class FakeChannelMergerNode extends FakeAudioNode {}
class FakeWaveShaperNode extends FakeAudioNode {
  curve: Float32Array<ArrayBuffer> | null = null;
}
class FakeOscillatorNode extends FakeAudioNode {
  type = "sine";
  frequency = new FakeAudioParam(1000);
  start() {}
  stop() {}
}
class FakeBufferSourceNode extends FakeAudioNode {
  buffer: unknown = null;
  loop = false;
  start() {}
  stop() {}
}

class FakeAudioContext {
  currentTime = 0;
  state: AudioContextState = "running";
  sampleRate = 48000;
  destination = new FakeAudioNode();
  nodes: FakeAudioNode[] = [];
  resume = vi.fn(async () => {});
  close = vi.fn(async () => {});

  private track<T extends FakeAudioNode>(node: T): T {
    this.nodes.push(node);
    return node;
  }

  createGain() {
    return this.track(new FakeGainNode());
  }
  createBiquadFilter() {
    return this.track(new FakeBiquadFilterNode());
  }
  createAnalyser() {
    return this.track(new FakeAnalyserNode());
  }
  createDynamicsCompressor() {
    return this.track(new FakeDynamicsCompressorNode());
  }
  createChannelSplitter() {
    return this.track(new FakeChannelSplitterNode());
  }
  createChannelMerger() {
    return this.track(new FakeChannelMergerNode());
  }
  createWaveShaper() {
    return this.track(new FakeWaveShaperNode());
  }
  createOscillator() {
    return this.track(new FakeOscillatorNode());
  }
  createBufferSource() {
    return this.track(new FakeBufferSourceNode());
  }
  createBuffer() {
    return { getChannelData: () => new Float32Array(0) };
  }
  decodeAudioData() {
    return Promise.resolve({});
  }
}

function installFakeContext(): FakeAudioContext {
  const ctx = new FakeAudioContext();
  // A plain function (not a class constructor) so `new AudioContext()` returns
  // the shared fake instance without tripping noConstructorReturn.
  vi.stubGlobal("AudioContext", function AudioContext() {
    return ctx;
  });
  return ctx;
}

/** Collect the chain of nodes reachable from `start` via single connections. */
function chainFrom(start: FakeAudioNode): FakeAudioNode[] {
  const out: FakeAudioNode[] = [];
  let cur: FakeAudioNode | undefined = start;
  while (cur) {
    out.push(cur);
    cur = cur.connections[0];
  }
  return out;
}

describe("AudioEngine EQ routing", () => {
  it("wires all EQ filters in series so every band is in the signal path", async () => {
    const ctx = installFakeContext();
    const engine = new AudioEngine();
    await engine.ensureContext();

    const settings = buildDefaultSettings();
    engine.applySettings(settings);

    // The EQ stage is eqInput -> eqFilters[0] -> ... -> eqFilters[n-1] -> eqOutput.
    // Find the eqInput node: it is the node the sourceGain connects to.
    const sourceGain = ctx.nodes.find(
      (n) => n instanceof FakeGainNode && n.connections.length > 0,
    ) as FakeGainNode;
    const eqInput = sourceGain.connections[0] as FakeGainNode;

    // eqInput should connect to the first filter (series chain), not directly
    // to eqOutput while filters exist.
    const firstFilter = eqInput.connections[0] as FakeBiquadFilterNode;
    expect(firstFilter).toBeInstanceOf(FakeBiquadFilterNode);

    // Walk the series chain: every filter connects to exactly one next node,
    // and the final filter connects to eqOutput (a GainNode).
    const filters: FakeBiquadFilterNode[] = [];
    let cur = eqInput;
    while (cur.connections[0] instanceof FakeBiquadFilterNode) {
      const f = cur.connections[0] as FakeBiquadFilterNode;
      filters.push(f);
      cur = f;
    }
    expect(filters.length).toBe(settings.eq.bands.length);
    // Each filter feeds the next in series; the last feeds the eqOutput gain.
    for (let i = 0; i < filters.length; i++) {
      const next = filters[i].connections[0];
      if (i < filters.length - 1) {
        expect(next).toBe(filters[i + 1]);
      } else {
        expect(next).toBeInstanceOf(FakeGainNode);
      }
    }

    engine.dispose();
  });

  it("routes around the filter chain with a direct dry path when bypassed", async () => {
    const ctx = installFakeContext();
    const engine = new AudioEngine();
    await engine.ensureContext();

    const settings = buildDefaultSettings();
    settings.eq.bypass = true;
    engine.applySettings(settings);

    const sourceGain = ctx.nodes.find(
      (n) => n instanceof FakeGainNode && n.connections.length > 0,
    ) as FakeGainNode;
    const eqInput = sourceGain.connections[0] as FakeGainNode;

    // When bypassed, eqInput connects directly to eqOutput (a GainNode), and
    // the filter chain is not in the path.
    const direct = eqInput.connections[0];
    expect(direct).toBeInstanceOf(FakeGainNode);
    // No filter is reachable from the EQ input while bypassed.
    const chain = chainFrom(eqInput);
    expect(chain.some((n) => n instanceof FakeBiquadFilterNode)).toBe(false);

    engine.dispose();
  });

  it("never leaves the direct dry path connected in parallel with the filter chain", async () => {
    const ctx = installFakeContext();
    const engine = new AudioEngine();
    await engine.ensureContext();

    const settings = buildDefaultSettings();

    // Start with filters active, then bypass, then re-enable.
    engine.applySettings(settings);
    settings.eq.bypass = true;
    engine.applySettings(settings);
    settings.eq.bypass = false;
    engine.applySettings(settings);

    const sourceGain = ctx.nodes.find(
      (n) => n instanceof FakeGainNode && n.connections.length > 0,
    ) as FakeGainNode;
    const eqInput = sourceGain.connections[0] as FakeGainNode;

    // After toggling back to active, eqInput must connect to exactly one node
    // (the first filter) — never a parallel direct path alongside the chain.
    expect(eqInput.connections.length).toBe(1);
    expect(eqInput.connections[0]).toBeInstanceOf(FakeBiquadFilterNode);

    engine.dispose();
  });
});
