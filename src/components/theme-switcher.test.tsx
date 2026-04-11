import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { THEME_STORAGE_KEY } from "@/lib/theme/constants";

describe("ThemeSwitcher persistence", () => {
  it("persists selected theme to localStorage", async () => {
    const user = userEvent.setup();
    localStorage.clear();
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBeTruthy();
    });

    await user.selectOptions(screen.getByLabelText(/thème/i), "ocean");
    await waitFor(() => {
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("ocean");
      expect(document.documentElement.dataset.theme).toBe("ocean");
    });
  });
});
