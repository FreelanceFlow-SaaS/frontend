import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { APPEARANCE_STORAGE_KEY } from "@/lib/theme/constants";

describe("ThemeToggle", () => {
  it("ouvre automatiquement une première fois et persiste l'apparence", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle autoOpenOnFirstLogin />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /sélecteur de thème/i })).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText("Sombre"));

    await waitFor(() => {
      expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe("dark");
    });
  });
});
