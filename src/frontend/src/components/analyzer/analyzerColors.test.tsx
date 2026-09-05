import App from "@/App";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Analyzer page removal", () => {
  it("does not render an analyzer page or spectrum analyzer in the app", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: /studio-grade EQ/i });
    expect(
      screen.queryByRole("heading", { name: "Analyzer" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("spectrum_analyzer")).not.toBeInTheDocument();
  });
});
