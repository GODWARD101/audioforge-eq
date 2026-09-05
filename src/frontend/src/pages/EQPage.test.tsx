import { ThemeProvider } from "@/components/ThemeProvider";
import { useAudioStore } from "@/lib/store";
import { EQPage } from "@/pages/EQPage";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

function renderEQ() {
  return render(
    <ThemeProvider>
      <EQPage />
    </ThemeProvider>,
  );
}

describe("EQPage", () => {
  it("renders the 10-band EQ by default", () => {
    renderEQ();
    expect(
      screen.getByRole("heading", { name: "Parametric EQ" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/10-band equalizer/i)).toBeInTheDocument();
    // The mode selector exposes all three modes.
    const selector = screen.getByTestId("eq_mode_selector");
    expect(
      within(selector).getByRole("button", { name: "10-band" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(selector).getByRole("button", { name: "13-band" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(selector).getByRole("button", { name: "21-band" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("switches to 13-band and 21-band modes and updates the band count", async () => {
    const user = userEvent.setup();
    renderEQ();

    await user.click(screen.getByRole("button", { name: "13-band" }));
    expect(useAudioStore.getState().settings.eq.mode).toBe(13);
    expect(useAudioStore.getState().settings.eq.bands).toHaveLength(13);
    expect(screen.getByText(/13-band equalizer/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "21-band" }));
    expect(useAudioStore.getState().settings.eq.mode).toBe(21);
    expect(useAudioStore.getState().settings.eq.bands).toHaveLength(21);
    expect(screen.getByText(/21-band equalizer/i)).toBeInTheDocument();
  });

  it("toggles EQ bypass", async () => {
    const user = userEvent.setup();
    renderEQ();

    const bypass = screen.getByTestId("eq_bypass_toggle");
    expect(useAudioStore.getState().settings.eq.bypass).toBe(false);
    await user.click(bypass);
    expect(useAudioStore.getState().settings.eq.bypass).toBe(true);
    expect(screen.getByText("EQ bypassed")).toBeInTheDocument();
  });

  it("customizes a band's frequency via the frequency knob", async () => {
    const user = userEvent.setup();
    renderEQ();
    const initial = useAudioStore.getState().settings.eq.bands[0].frequency;
    // Each band card exposes a "Freq" rotary knob; target the first band.
    const freqKnob = screen.getAllByRole("slider", { name: "Freq" })[0];
    freqKnob.focus();
    await user.keyboard("{ArrowUp}");
    const updated = useAudioStore.getState().settings.eq.bands[0].frequency;
    expect(updated).toBeGreaterThan(initial);
    // The frequency knob is bounded to the audible range.
    expect(updated).toBeGreaterThanOrEqual(20);
    expect(updated).toBeLessThanOrEqual(20000);
  });

  it("does not request microphone access", () => {
    const getUserMedia = vi.spyOn(navigator.mediaDevices, "getUserMedia");
    renderEQ();
    expect(getUserMedia).not.toHaveBeenCalled();
  });
});
