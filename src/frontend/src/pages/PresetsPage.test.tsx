import { ThemeProvider } from "@/components/ThemeProvider";
import { useAudioStore } from "@/lib/store";
import { PresetsPage } from "@/pages/PresetsPage";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

function renderPresets() {
  return render(
    <ThemeProvider>
      <PresetsPage />
    </ThemeProvider>,
  );
}

describe("PresetsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    useAudioStore.setState({
      presets: [],
      profiles: [],
      activeProfileId: null,
    });
  });

  it("seeds and renders factory presets", () => {
    renderPresets();
    expect(
      screen.getByRole("heading", { name: "Presets" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Flat")).toBeInTheDocument();
    expect(screen.getByText("Bass Boost")).toBeInTheDocument();
    // "Factory" appears as the section heading and on each factory preset.
    expect(screen.getAllByText("Factory").length).toBeGreaterThan(0);
  });

  it("applies a factory preset to the EQ settings", async () => {
    const user = userEvent.setup();
    renderPresets();

    // Find the "Bass Boost" preset apply button.
    const bassBoost = screen
      .getByText("Bass Boost")
      .closest("[data-ocid^='preset_item']")!;
    const apply = within(bassBoost as HTMLElement).getByTestId(/preset_apply/);
    await user.click(apply);

    const eq = useAudioStore.getState().settings.eq;
    // Bass Boost raises the low bands.
    expect(eq.bands[0].gain).toBeGreaterThan(0);
    expect(eq.bands[1].gain).toBeGreaterThan(0);
  });

  it("saves a user preset and lists it under My presets", async () => {
    const user = userEvent.setup();
    renderPresets();

    await user.click(screen.getByTestId("preset_save_button"));
    await user.type(screen.getByTestId("preset_name_input"), "My mix");
    await user.click(screen.getByTestId("preset_save_confirm"));

    expect(screen.getByText("My mix")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(
      useAudioStore
        .getState()
        .presets.some((p) => p.name === "My mix" && !p.isFactory),
    ).toBe(true);
  });

  it("renders the profile selector with auto-switch", () => {
    renderPresets();
    expect(
      screen.getByRole("heading", { name: "Profiles" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("profile_autoswitch_toggle")).toBeInTheDocument();
  });
});
