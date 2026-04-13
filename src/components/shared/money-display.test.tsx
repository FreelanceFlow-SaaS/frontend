import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MoneyDisplay } from "@/components/shared/money-display";

describe("MoneyDisplay", () => {
  it("formats EUR in fr-FR with tabular nums class", () => {
    const { container } = render(<MoneyDisplay amount={150} />);
    const el = container.querySelector(".tabular-nums");
    expect(el).toBeInTheDocument();
    expect(screen.getByText(/150[,\s\u00a0]00\s*€/)).toBeInTheDocument();
  });

  it("accepts string decimals from API", () => {
    render(<MoneyDisplay amount="200.50" />);
    expect(screen.getByText(/200[,\s\u00a0]50\s*€/)).toBeInTheDocument();
  });

  it("renders em dash for invalid amount", () => {
    render(<MoneyDisplay amount="not-a-number" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
