import { ThemeProvider } from "@/components/ThemeProvider";
import { useAudioStore } from "@/lib/store";
import { SettingsPage } from "@/pages/SettingsPage";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

function renderSettings() {
  return render(
    <ThemeProvider>
      <SettingsPage />
    </ThemeProvider>,
  );
}

describe("SettingsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    useAudioStore.setState({ theme: "charcoal" });
  });

  it("renders the theme picker with all themes", () => {
    renderSettings();
    expect(
      screen.getByRole("heading", { name: "Color theme" }),
    ).toBeInTheDocument();
    for (const name of [
      "Charcoal",
      "Midnight",
      "Ocean",
      "Emerald",
      "Crimson",
      "Amethyst",
    ]) {
      // Theme names appear on the picker card and in the page subtitle.
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }
  });

  it("switches the color theme and persists it", async () => {
    const user = userEvent.setup();
    renderSettings();

    expect(useAudioStore.getState().theme).toBe("charcoal");
    await user.click(screen.getByTestId("theme_crimson"));

    expect(useAudioStore.getState().theme).toBe("crimson");
    // The applied data-theme attribute updates on the document root.
    expect(document.documentElement.getAttribute("data-theme")).toBe("crimson");
    // Persisted to localStorage.
    expect(localStorage.getItem("audioforge.theme")).toBe("crimson");
  });

  it("exports settings as a JSON download", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock");
    const revokeObjectURL = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    renderSettings();
    await user.click(screen.getByTestId("settings_export_button"));

    expect(clickSpy).toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalled();

    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
    clickSpy.mockRestore();
  });

  it("imports settings from a JSON file and applies them", async () => {
    renderSettings();

    const imported = {
      version: 1,
      theme: "ocean",
      settings: useAudioStore.getState().settings,
      presets: [],
      profiles: [],
      activeProfileId: null,
    };
    const file = new File([JSON.stringify(imported)], "settings.json", {
      type: "application/json",
    });

    const input = screen.getByTestId("settings_import_input");
    // jsdom's File does not implement .text(), so the component's async
    // change handler would never resolve. Define it to return the contents.
    const textMock = vi.fn().mockResolvedValue(JSON.stringify(imported));
    Object.defineProperty(File.prototype, "text", {
      configurable: true,
      value: textMock,
    });
    fireEvent.change(input, { target: { files: [file] } });

    // The change handler reads the file asynchronously before applying it.
    // The success toast is not rendered here (no <Toaster> in this harness),
    // so assert on the actual state change the import applies.
    await waitFor(() => {
      expect(useAudioStore.getState().theme).toBe("ocean");
    });
    expect(useAudioStore.getState().theme).toBe("ocean");
  });
});
