import { createClient } from "redis";
import type { QuotaStore } from "./quota";

type Env = Record<string, string | undefined>;

/**
 * Finds a standard Redis connection string, e.g. KV_REDIS_URL from Vercel's
 * Redis integration (the prefix is chosen at install time) or a plain REDIS_URL.
 */
export function findRedisUrl(env: Env = process.env): string | null {
  const keys = ["REDIS_URL", ...Object.keys(env).filter((k) => k.endsWith("_REDIS_URL"))];
  for (const key of keys) {
    const value = env[key];
    if (value && /^rediss?:\/\//.test(value)) return value;
  }
  return null;
}

function makeClient(url: string) {
  return createClient({
    url,
    socket: { connectTimeout: 3000, reconnectStrategy: false },
    commandsQueueMaxLength: 100,
  });
}

type Client = ReturnType<typeof makeClient>;

// Reused across requests while a serverless instance stays warm.
let client: Promise<Client> | null = null;

function connect(url: string): Promise<Client> {
  if (client) return client;
  const pending = (async () => {
    const c = makeClient(url);
    c.on("error", (error) => {
      console.error("[email] redis error:", error instanceof Error ? error.message : error);
      client = null; // reconnect on the next request
    });
    await c.connect();
    return c;
  })();
  pending.catch(() => (client = null));
  client = pending;
  return pending;
}

function withTimeout<T>(promise: Promise<T>, ms = 3000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Redis timed out")), ms)),
  ]);
}

/** Quota store over a Redis connection string (TCP). */
export function createRedisUrlStore(env: Env = process.env): QuotaStore | null {
  const url = findRedisUrl(env);
  if (!url) return null;
  const run = <T>(fn: (c: Client) => Promise<T>) => withTimeout(connect(url).then(fn));
  return {
    addToSet: async (key, member) => (await run((c) => c.sAdd(key, member))) === 1,
    setSize: (key) => run((c) => c.sCard(key)),
    removeFromSet: async (key, member) => void (await run((c) => c.sRem(key, member))),
    increment: (key) => run((c) => c.incr(key)),
    decrement: (key) => run((c) => c.decr(key)),
  };
}
