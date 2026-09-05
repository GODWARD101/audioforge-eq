/**
 * PWA registration helpers. Registers the offline-first service worker on
 * load so the app shell and assets are cached and the full EQ/effects
 * workflow runs with no network connection once installed.
 */
export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      // Non-fatal: the app still works online if SW registration fails.
      console.error("Service worker registration failed:", error);
    });
  });
}
