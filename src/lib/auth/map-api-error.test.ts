import { describe, expect, it } from "vitest";
import { mapApiErrorToMessage } from "@/lib/auth/map-api-error";

describe("mapApiErrorToMessage", () => {
  it("joins validation message arrays", () => {
    expect(mapApiErrorToMessage({ message: ["a", "b"] })).toBe("a b");
  });

  it("returns string message", () => {
    expect(mapApiErrorToMessage({ message: "Email ou mot de passe incorrect" })).toBe(
      "Email ou mot de passe incorrect",
    );
  });

  it("uses fallback for unknown body", () => {
    expect(mapApiErrorToMessage(null)).toBe("Une erreur est survenue. Réessayez.");
  });
});
