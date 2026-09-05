import App from "@/App";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Analyzer removal", () => {
  it("removes the analyzer nav item from the app shell", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: /studio-grade EQ/i });
    expect(screen.queryByTestId("nav_link_analyzer")).not.toBeInTheDocument();
  });

  it("removes the analyzer module card from the home page", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: /studio-grade EQ/i });
    expect(
      screen.queryByTestId("home_module_analyzer"),
    ).not.toBeInTheDocument();
  });
});
