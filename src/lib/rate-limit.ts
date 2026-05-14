import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

type Options = {
  limit: number;
  windowMs: number;
};

const limiterCache = new Map<string, Ratelimit>();

function getLimiter(options: Options): Ratelimit {
  const key = `${options.limit}:${options.windowMs}`;
  if (!limiterCache.has(key)) {
    limiterCache.set(
      key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          options.limit,
          `${options.windowMs} ms`,
        ),
        prefix: "collabspace:rl",
      }),
    );
  }
  return limiterCache.get(key)!;
}

export async function rateLimit(identifier: string, options: Options) {
  const limiter = getLimiter(options);
  const result = await limiter.limit(identifier);
  return { success: result.success, remaining: result.remaining };
}
