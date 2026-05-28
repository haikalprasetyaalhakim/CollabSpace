import { describe, beforeEach, expect, jest, test, mock } from "bun:test";

// Mock the external packages
mock.module("@upstash/redis", () => {
  return {
    Redis: class {}
  };
});

mock.module("@upstash/ratelimit", () => {
  return {
    Ratelimit: class {
      static slidingWindow() {
        return {};
      }
      limit = async (identifier: string) => {
        return mockLimit(identifier);
      };
    }
  };
});

// Import the rateLimit function after mocking modules
import { rateLimit } from "./rate-limit";

// Local state for rate limiting mock
const mockStore = new Map<string, number[]>();

function mockLimit(identifier: string) {
  const now = Date.now();
  const windowMs = 10_000;
  const limit = 5;
  
  if (!mockStore.has(identifier)) {
    mockStore.set(identifier, []);
  }
  
  const timestamps = mockStore.get(identifier)!;
  // filter out expired timestamps
  const active = timestamps.filter(t => now - t < windowMs);
  
  if (active.length < limit) {
    active.push(now);
    mockStore.set(identifier, active);
    return { success: true, remaining: limit - active.length };
  } else {
    return { success: false, remaining: 0 };
  }
}

function clearRateLimitStore() {
  mockStore.clear();
}

beforeEach(() => {
  clearRateLimitStore();
  jest.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
});

const OPTIONS = { limit: 5, windowMs: 10_000 };

describe("rateLimit", () => {
  test("first request always success", async () => {
    const result = await rateLimit("user1", OPTIONS);
    expect(result.success).toBe(true);
  });

  test("request within in the limits of all success", async () => {
    for (let i = 0; i < 5; i++) {
      const result = await rateLimit("user1", OPTIONS);
      expect(result.success).toBe(true);
    }
  });

  test("request more than 5 will be blocked", async () => {
    for (let i = 0; i < 5; i++) await rateLimit("user1", OPTIONS);

    const result = await rateLimit("user1", OPTIONS);
    expect(result.success).toBe(false);
  });

  test("after window expired, reset counter", async () => {
    for (let i = 0; i < 5; i++) await rateLimit("user1", OPTIONS);
    expect((await rateLimit("user1", OPTIONS)).success).toBe(false);

    jest.setSystemTime(new Date("2024-01-01T00:00:11.000Z"));

    const result = await rateLimit("user1", OPTIONS);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  test("user berbeda tidak saling mempengaruhi", async () => {
    for (let i = 0; i < 5; i++) await rateLimit("user1", OPTIONS);
    expect((await rateLimit("user1", OPTIONS)).success).toBe(false);
    expect((await rateLimit("user2", OPTIONS)).success).toBe(true);
  });
});
