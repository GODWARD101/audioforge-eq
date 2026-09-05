import App from "@/App";
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Critical journey: the install button must surface in the app header once the
 * PWA meets installability criteria (a `beforeinstallprompt` event), and stay
 * hidden otherwise. This exercises the real Layout + InstallPrompt wiring
 * through the app shell.
 */

function dispatchBeforeInstallPrompt() {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Layout install prompt", () => {
  it("shows no install button until the app is installable", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: /studio-grade EQ/i });
    expect(screen.queryByRole("button", { name: /install app/i })).toBeNull();
  });

  it("shows the install button in the header once installable", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: /studio-grade EQ/i });
    dispatchBeforeInstallPrompt();
    expect(
      screen.getByRole("button", { name: /install app/i }),
    ).toBeInTheDocument();
  });
});
