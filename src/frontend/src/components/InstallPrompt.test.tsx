import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InstallPrompt } from "./InstallPrompt";

/**
 * The InstallPrompt button is the user-facing surface of the PWA install flow.
 * It must render nothing when the app is not installable, and trigger the
 * native install prompt when clicked once a `beforeinstallprompt` event has
 * arrived.
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

describe("InstallPrompt", () => {
  it("renders nothing when the app is not installable", () => {
    render(<InstallPrompt />);
    expect(screen.queryByRole("button", { name: /install app/i })).toBeNull();
  });

  it("renders an install button once the app becomes installable", () => {
    render(<InstallPrompt />);
    dispatchBeforeInstallPrompt();
    expect(
      screen.getByRole("button", { name: /install app/i }),
    ).toBeInTheDocument();
  });

  it("triggers the native install prompt when clicked", async () => {
    const user = userEvent.setup();
    const prompt = vi.fn(async () => {});
    const userChoice = vi.fn(async () => ({
      outcome: "accepted",
      platform: "web",
    }));

    render(<InstallPrompt />);
    const event = dispatchBeforeInstallPrompt();
    Object.defineProperty(event, "prompt", { value: prompt });
    Object.defineProperty(event, "userChoice", { value: userChoice });

    await user.click(screen.getByRole("button", { name: /install app/i }));
    expect(prompt).toHaveBeenCalledTimes(1);
  });
});
