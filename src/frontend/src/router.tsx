import { Layout } from "@/components/Layout";
import { EQPage } from "@/pages/EQPage";
import { EffectsPage } from "@/pages/EffectsPage";
import { HomePage } from "@/pages/HomePage";
import { PresetsPage } from "@/pages/PresetsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: Layout,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const eqRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/eq",
  component: EQPage,
});

const effectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/effects",
  component: EffectsPage,
});

const presetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/presets",
  component: PresetsPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  eqRoute,
  effectsRoute,
  presetsRoute,
  settingsRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
