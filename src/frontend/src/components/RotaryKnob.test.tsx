import { RotaryKnob } from "@/components/RotaryKnob";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("RotaryKnob", () => {
  it("renders slider semantics and the formatted readout", () => {
    render(
      <RotaryKnob
        value={1000}
        min={20}
        max={20000}
        label="Freq"
        format={(v) => `${v} Hz`}
        onChange={() => {}}
        log
      />,
    );
    const slider = screen.getByRole("slider", { name: "Freq" });
    expect(slider).toHaveAttribute("aria-valuenow", "1000");
    expect(slider).toHaveAttribute("aria-valuemin", "20");
    expect(slider).toHaveAttribute("aria-valuemax", "20000");
    expect(screen.getByText("1000 Hz")).toBeInTheDocument();
  });

  it("adjusts on a logarithmic scale when log is set", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RotaryKnob
        value={1000}
        min={20}
        max={20000}
        step={1}
        label="Freq"
        onChange={onChange}
        log
      />,
    );
    const slider = screen.getByRole("slider", { name: "Freq" });
    slider.focus();
    await user.keyboard("{ArrowUp}");
    expect(onChange).toHaveBeenCalled();
    const [next] = onChange.mock.calls[0];
    expect(next).toBeGreaterThan(1000);
    expect(next).toBeLessThanOrEqual(20000);
  });
});
