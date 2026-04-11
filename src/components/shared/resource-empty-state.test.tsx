import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResourceEmptyState } from "@/components/shared/resource-empty-state";

describe("ResourceEmptyState", () => {
  it("renders French copy and exposes a titled region", () => {
    render(
      <ResourceEmptyState
        title="Aucun élément"
        description="Créez votre premier élément pour commencer."
        action={<a href="/new">Créer</a>}
      />,
    );
    expect(screen.getByRole("region", { name: /aucun élément/i })).toBeInTheDocument();
    expect(screen.getByText(/créez votre premier élément/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /créer/i })).toHaveAttribute("href", "/new");
  });
});
