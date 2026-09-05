import { afterEach, describe, expect, it, vi } from "vitest";
import { registerServiceWorker } from "./pwa";

/**
 * registerServiceWorker wires the offline-first service worker on page load.
 * jsdom does not implement the Service Worker API, so we stub
 * navigator.serviceWorker and invoke the captured `load` handler directly to
 * observe the registration call and its error handling.
 */

function stubServiceWorker(register: () => Promise<unknown>) {
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { register },
  });
}

/** Capture the `load` handler registerServiceWorker attaches, then invoke it. */
function invokeLoadHandler() {
  const addSpy = vi.spyOn(window, "addEventListener");
  registerServiceWorker();
  const handler = addSpy.mock.calls.find(([type]) => type === "load")?.[1];
  expect(handler).toBeDefined();
  (handler as EventListener)(new Event("load"));
}

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, "serviceWorker");
});

describe("registerServiceWorker", () => {
  it("registers the service worker on the load event", () => {
    const register = vi.fn(async () => ({}));
    stubServiceWorker(register);
    invokeLoadHandler();
    expect(register).toHaveBeenCalledWith("/sw.js");
  });

  it("does nothing when the Service Worker API is unavailable", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    registerServiceWorker();
    expect(addSpy).not.toHaveBeenCalled();
  });

  it("logs but does not throw when registration fails", async () => {
    const error = new Error("registration failed");
    const register = vi.fn(async () => {
      throw error;
    });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    stubServiceWorker(register);
    invokeLoadHandler();
    // Flush the rejected registration promise so the catch handler runs.
    await Promise.resolve();
    await Promise.resolve();
    expect(consoleError).toHaveBeenCalledWith(
      "Service worker registration failed:",
      error,
    );
  });
});
