import App from "@/App";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

describe("App shell", () => {
  it("loads without a blank screen on the default route", async () => {
    render(<App />);
    // The home page hero heading renders once the router settles.
    expect(
      await screen.findByRole("heading", { name: /studio-grade EQ/i }),
    ).toBeInTheDocument();
    // The layout brand and primary navigation are present (desktop + mobile).
    expect(screen.getByText("AudioForge EQ")).toBeInTheDocument();
    expect(
      screen.getAllByRole("navigation", { name: /primary navigation/i }).length,
    ).toBeGreaterThan(0);
  });

  it("keeps the non-analyzer primary navigation items", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: /studio-grade EQ/i });
    // The analyzer nav item is being removed; the remaining rack pages must
    // stay reachable from the header (desktop + mobile render each item).
    for (const id of [
      "nav_link_overview",
      "nav_link_eq",
      "nav_link_effects",
      "nav_link_presets",
      "nav_link_settings",
    ]) {
      expect(screen.getAllByTestId(id).length).toBeGreaterThan(0);
    }
  });

  it("keeps the non-analyzer home module cards", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: /studio-grade EQ/i });
    // The analyzer module card is being removed; the other rack modules must
    // remain on the landing page.
    for (const id of [
      "home_module_parametric_eq",
      "home_module_effects_rack",
      "home_module_presets_&_profiles",
      "home_module_settings",
    ]) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
  });

  it("navigates from the home page to the EQ page via the primary CTA", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByTestId("home_open_eq_button"));
    expect(
      await screen.findByRole("heading", { name: "Parametric EQ" }),
    ).toBeInTheDocument();
  });
});
