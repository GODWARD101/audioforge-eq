import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useInstallPrompt } from "./use-install-prompt";

/**
 * The PWA install prompt is driven by browser events that jsdom does not fire
 * on its own. These tests dispatch the real `beforeinstallprompt` /
 * `appinstalled` events and drive the native `prompt()`/`userChoice` flow
 * through a fake deferred prompt, asserting the hook's observable state.
 */

function makeDeferredPrompt() {
  const prompt = vi.fn(async () => {});
  // The hook awaits `deferredPrompt.userChoice` as a Promise property (per the
  // BeforeInstallPromptEvent contract), not as a callable function.
  const userChoice = Promise.resolve({ outcome: "accepted", platform: "web" });
  return { prompt, userChoice };
}

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

describe("useInstallPrompt", () => {
  it("is not installable until a beforeinstallprompt event arrives", () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);
    expect(result.current.isInstalled).toBe(false);
  });

  it("becomes installable when beforeinstallprompt fires and prevents the default", () => {
    const { result } = renderHook(() => useInstallPrompt());
    const event = dispatchBeforeInstallPrompt();
    expect(event.defaultPrevented).toBe(true);
    expect(result.current.canInstall).toBe(true);
  });

  it("promptInstall triggers the native prompt and marks the app installed on acceptance", async () => {
    const deferred = makeDeferredPrompt();
    const { result } = renderHook(() => useInstallPrompt());

    const fakeEvent = new Event("beforeinstallprompt", { cancelable: true });
    Object.defineProperty(fakeEvent, "prompt", { value: deferred.prompt });
    Object.defineProperty(fakeEvent, "userChoice", {
      value: deferred.userChoice,
    });
    act(() => {
      window.dispatchEvent(fakeEvent);
    });

    const promptInstall = result.current.promptInstall;
    await act(async () => {
      await promptInstall();
    });

    expect(deferred.prompt).toHaveBeenCalledTimes(1);
    expect(result.current.isInstalled).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it("does not mark the app installed when the user dismisses the prompt", async () => {
    const deferred = makeDeferredPrompt();
    deferred.userChoice = Promise.resolve({
      outcome: "dismissed",
      platform: "web",
    });
    const { result } = renderHook(() => useInstallPrompt());

    const fakeEvent = new Event("beforeinstallprompt", { cancelable: true });
    Object.defineProperty(fakeEvent, "prompt", { value: deferred.prompt });
    Object.defineProperty(fakeEvent, "userChoice", {
      value: deferred.userChoice,
    });
    act(() => {
      window.dispatchEvent(fakeEvent);
    });

    await act(async () => {
      await result.current.promptInstall();
    });

    expect(deferred.prompt).toHaveBeenCalledTimes(1);
    expect(result.current.isInstalled).toBe(false);
    expect(result.current.canInstall).toBe(false);
  });

  it("marks the app installed when the appinstalled event fires", () => {
    const { result } = renderHook(() => useInstallPrompt());
    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });
    expect(result.current.isInstalled).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it("removes its window listeners on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useInstallPrompt());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith(
      "beforeinstallprompt",
      expect.any(Function),
    );
    expect(removeSpy).toHaveBeenCalledWith(
      "appinstalled",
      expect.any(Function),
    );
  });
});
