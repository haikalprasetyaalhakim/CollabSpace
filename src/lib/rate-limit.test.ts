import { describe, beforeEach, expect, jest, test } from "bun:test";
import { clearRateLimitStore, rateLimit } from "./rate-limit";

beforeEach(() => {
  clearRateLimitStore();
  jest.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
});

const OPTIONS = { limit: 5, windowMs: 10_000 };

describe("rateLimit", () => {
  test("first request always success", () => {
    const result = rateLimit("user1", OPTIONS);
    expect(result.success).toBe(true);
  });

  test("request within in the limits of all success", () => {
    for (let i = 0; i < 5; i++) {
      const result = rateLimit("user1", OPTIONS);
      expect(result.success).toBe(true);
    }
  });

  test("request more than 5 will be blocked", () => {
    for (let i = 0; i < 5; i++) rateLimit("user1", OPTIONS);

    const result = rateLimit("user1", OPTIONS);
    expect(result.success).toBe(false);
  });

  test("after window expired, reset counter", () => {
    for (let i = 0; i < 5; i++) rateLimit("user1", OPTIONS);
    expect(rateLimit("user1", OPTIONS).success).toBe(false);

    jest.setSystemTime(new Date("2024-01-01T00:00:11.000Z"));

    const result = rateLimit("user1", OPTIONS);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  test("user berbeda tidak saling mempengaruhi", () => {
    for (let i = 0; i < 5; i++) rateLimit("user1", OPTIONS);
    expect(rateLimit("user1", OPTIONS).success).toBe(false);
    expect(rateLimit("user2", OPTIONS).success).toBe(true);
  });
});
