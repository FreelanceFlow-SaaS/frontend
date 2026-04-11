import { describe, expect, it } from "vitest";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeSwitcher } from "@/components/theme-switcher";

function DemoForm() {
  const [value, setValue] = useState("draft");
  return (
    <div>
      <label htmlFor="demo-field">Champ test</label>
      <input id="demo-field" value={value} onChange={(e) => setValue(e.target.value)} />
      <ThemeSwitcher />
    </div>
  );
}

describe("ThemeSwitcher form stability", () => {
  it("does not reset uncontrolled sibling input state when theme changes", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <DemoForm />
      </ThemeProvider>,
    );

    const field = screen.getByLabelText(/champ test/i);
    await user.clear(field);
    await user.type(field, "facture brouillon");

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBeTruthy();
    });

    await user.selectOptions(screen.getByLabelText(/thème/i), "forest");
    expect(field).toHaveValue("facture brouillon");
  });
});
