import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";
import { vi } from "vitest";

// Generated components use `data-ocid` as their test hook attribute.
configure({ testIdAttribute: "data-ocid" });

// jsdom does not implement matchMedia, which sonner's Toaster and some
// responsive hooks rely on.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

// jsdom does not implement ResizeObserver, which Radix's use-size hook (used
// by sliders/knobs) relies on during layout effects.
if (!("ResizeObserver" in window)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (window as unknown as { ResizeObserver: unknown }).ResizeObserver =
    ResizeObserverStub;
}

// jsdom does not implement the Blob URL helpers used by export/import.
if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();
}

// jsdom does not implement the MediaDevices API. Provide a stub so tests can
// assert the app never requests microphone access (getUserMedia).
Object.defineProperty(navigator, "mediaDevices", {
  configurable: true,
  value: {
    getUserMedia: vi.fn(async () => {
      throw new Error("getUserMedia is not available in tests");
    }),
    enumerateDevices: vi.fn(async () => []),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

// The AudioEngine depends on the Web Audio API, which jsdom does not provide.
// Mock the class while keeping the pure helpers the store and pages import.
vi.mock("@/lib/audio/AudioEngine", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/audio/AudioEngine")>();
  class MockAudioEngine {
    context = { sampleRate: 48000, currentTime: 0, state: "running" };
    playing = false;
    ensureContext = vi.fn(async () => this.context);
    applySettings = vi.fn();
    updateBand = vi.fn();
    updateEqMasterGain = vi.fn();
    updateLimiter = vi.fn();
    updateCompressor = vi.fn();
    updateEpicenter = vi.fn();
    updateMonoblock = vi.fn();
    updateAmplifier = vi.fn();
    updateBassTuning = vi.fn();
    updateLoudness = vi.fn();
    updateDistortionReduction = vi.fn();
    setMasterVolume = vi.fn();
    loadFile = vi.fn(async () => {});
    playFile = vi.fn();
    pauseFile = vi.fn();
    stop = vi.fn();
  }
  return {
    ...actual,
    AudioEngine: MockAudioEngine,
  };
});
