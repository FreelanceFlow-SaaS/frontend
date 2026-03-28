import { describe, expect, it } from "vitest";

describe("CI smoke", () => {
  it("runs the test runner", () => {
    expect(1 + 1).toBe(2);
  });
});
