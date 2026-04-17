import { describe, expect, test } from "bun:test";
import { getInitials } from "./utils";

describe("getInitials", () => {
  test("returns initials from full name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  test("returns first letter only for single name", () => {
    expect(getInitials("Haikal")).toBe("H");
  });

  test("handles extra spaces", () => {
    expect(getInitials("    John   Doe")).toBe("JD");
  });

  test("returns empty string for empty input", () => {
    expect(getInitials("")).toBe("U");
  });
});
