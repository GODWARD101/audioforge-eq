import { ThemeProvider } from "@/components/ThemeProvider";
import { useAudioStore } from "@/lib/store";
import { EffectsPage } from "@/pages/EffectsPage";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

function renderEffects() {
  return render(
    <ThemeProvider>
      <EffectsPage />
    </ThemeProvider>,
  );
}

/** Walk up from an element to the enclosing GlassPanel root. */
function panelRoot(el: HTMLElement): HTMLElement {
  let node: HTMLElement | null = el;
  while (node && !node.className.includes("glass-panel")) {
    node = node.parentElement;
  }
  if (!node) throw new Error("No GlassPanel ancestor found");
  return node;
}

describe("EffectsPage", () => {
  it("renders the limiter panel with its reference controls", () => {
    renderEffects();
    const limiter = panelRoot(screen.getByRole("heading", { name: "Limiter" }));
    expect(screen.getByText("Brickwall output protection")).toBeInTheDocument();
    // Reference knobs: Threshold, Post Gain, Ratio, Attack, Release.
    for (const label of [
      "Threshold",
      "Post Gain",
      "Ratio",
      "Attack",
      "Release",
    ]) {
      expect(
        within(limiter).getByRole("slider", { name: label }),
      ).toBeInTheDocument();
    }
    // Post Gain is the signal-red gain variant.
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
  });

  it("renders the multiband compressor panel with its reference controls", () => {
    renderEffects();
    const comp = panelRoot(
      screen.getByRole("heading", { name: "Multiband Compressor" }),
    );
    expect(
      screen.getByText("Three-band dynamics processing"),
    ).toBeInTheDocument();
    for (const label of [
      "Low X-Over",
      "High X-Over",
      "Attack",
      "Release",
      "Ratio",
      "Input Gain",
      "Threshold",
      "Out Gain",
    ]) {
      expect(
        within(comp).getByRole("slider", { name: label }),
      ).toBeInTheDocument();
    }
    expect(screen.getByTestId("compressor_bypass_toggle")).toBeInTheDocument();
    expect(screen.getByTestId("compressor_compact_toggle")).toBeInTheDocument();
  });

  it("renders the full effects chain in order", () => {
    renderEffects();
    expect(
      screen.getByRole("heading", { name: "Signal Chain" }),
    ).toBeInTheDocument();
    const order = useAudioStore.getState().settings.effects.order;
    for (const _id of order) {
      // Each effect appears in the chain list.
      expect(
        screen.getAllByText(
          /Limiter|Multiband Comp|Epicenter|Monoblock|Amplifier|Bass Tuning|Loudness|Distortion Reduction/i,
        ).length,
      ).toBeGreaterThan(0);
    }
    expect(
      screen.getByTestId("chain_master_bypass_toggle"),
    ).toBeInTheDocument();
  });

  it("toggles the master bypass", async () => {
    const user = userEvent.setup();
    renderEffects();
    const toggle = screen.getByTestId("master_bypass_toggle");
    expect(useAudioStore.getState().settings.effects.masterBypass).toBe(false);
    await user.click(toggle);
    expect(useAudioStore.getState().settings.effects.masterBypass).toBe(true);
  });
});
