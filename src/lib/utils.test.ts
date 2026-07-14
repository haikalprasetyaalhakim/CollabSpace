import { describe, expect, it } from "bun:test";
import { getInitials, formatDuration, cn } from "./utils";

describe("getInitials helper function", () => {
  it("should return initials in uppercase for a two-word name", () => {
    expect(getInitials("Haikal Alhakim")).toBe("HA");
  });

  it("should return single letter for a single-word name", () => {
    expect(getInitials("collabspace")).toBe("C");
  });

  it("should ignore extra spaces", () => {
    expect(getInitials("   John    Doe   ")).toBe("JD");
  });

  it("should return 'U' for empty or whitespace-only name", () => {
    expect(getInitials("")).toBe("U");
    expect(getInitials("   ")).toBe("U");
  });
});

describe("formatDuration helper function", () => {
  it("should format seconds into mm:ss format", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(59)).toBe("00:59");
    expect(formatDuration(60)).toBe("01:00");
    expect(formatDuration(365)).toBe("06:05");
  });
});

describe("cn class merger function", () => {
  it("should merge tailwind classes correctly", () => {
    expect(cn("px-2 py-2", "px-4")).toBe("py-2 px-4");
  });
});
