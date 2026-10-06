import { createHash } from "node:crypto";

/**
 * Caps how many people the live demo will email, and how many emails any one
 * address can get. Counts are kept in Redis (Upstash) because serverless
 * functions don't share memory. Addresses are stored as SHA-256 hashes, never
 * in plain text.
 */

export interface QuotaStore {
  /** Adds a member; resolves true if it wasn't already there. */
  addToSet(key: string, member: string): Promise<boolean>;
  setSize(key: string): Promise<number>;
  removeFromSet(key: string, member: string): Promise<void>;
  increment(key: string): Promise<number>;
  decrement(key: string): Promise<number>;
}

type Env = Record<string, string | undefined>;

export type QuotaResult = { ok: true } | { ok: false; reason: string };

const RECIPIENTS_KEY = "returndone:email:recipients";
const sentKey = (hash: string) => `returndone:email:sent:${hash}`;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export interface QuotaLimits {
  maxRecipients: number;
  maxPerRecipient: number;
}

export function readLimits(env: Env = process.env): QuotaLimits | null {
  const maxRecipients = Number(env.EMAIL_MAX_RECIPIENTS);
  if (!Number.isFinite(maxRecipients) || maxRecipients <= 0) return null;
  const perRecipient = Number(env.EMAIL_MAX_PER_RECIPIENT);
  return {
    maxRecipients: Math.floor(maxRecipients),
    maxPerRecipient:
      Number.isFinite(perRecipient) && perRecipient > 0 ? Math.floor(perRecipient) : 3,
  };
}

/**
 * Claims one email for this address. A new address takes one of the
 * `maxRecipients` places; an address already on the list can receive up to
 * `maxPerRecipient` emails in total.
 */
export async function claimEmailSlot(
  email: string,
  limits: QuotaLimits,
  store: QuotaStore,
): Promise<QuotaResult> {
  const hash = hashEmail(email);

  const isNew = await store.addToSet(RECIPIENTS_KEY, hash);
  if (isNew && (await store.setSize(RECIPIENTS_KEY)) > limits.maxRecipients) {
    await store.removeFromSet(RECIPIENTS_KEY, hash);
    return {
      ok: false,
      reason: `This demo has already sent confirmation emails to its limit of ${plural(limits.maxRecipients, "person", "people")}`,
    };
  }

  const sent = await store.increment(sentKey(hash));
  if (sent > limits.maxPerRecipient) {
    await store.decrement(sentKey(hash));
    return {
      ok: false,
      reason: `This address has already received ${plural(limits.maxPerRecipient, "demo email", "demo emails")}, the most we send to one address`,
    };
  }
  return { ok: true };
}

/** In-memory store for local development and tests. */
export function createMemoryStore(): QuotaStore {
  const sets = new Map<string, Set<string>>();
  const counters = new Map<string, number>();
  const set = (key: string) => sets.get(key) ?? sets.set(key, new Set()).get(key)!;
  return {
    async addToSet(key, member) {
      const s = set(key);
      if (s.has(member)) return false;
      s.add(member);
      return true;
    },
    async setSize(key) {
      return set(key).size;
    },
    async removeFromSet(key, member) {
      set(key).delete(member);
    },
    async increment(key) {
      const next = (counters.get(key) ?? 0) + 1;
      counters.set(key, next);
      return next;
    },
    async decrement(key) {
      const next = (counters.get(key) ?? 0) - 1;
      counters.set(key, next);
      return next;
    },
  };
}

/**
 * Upstash Redis over its REST API, so no extra dependency is needed. Accepts
 * the variable names set by Vercel's Upstash integration or by Upstash itself.
 */
export function createUpstashStore(env: Env = process.env): QuotaStore | null {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  async function command(...args: (string | number)[]): Promise<unknown> {
    const response = await fetch(url!, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    const body = (await response.json()) as { result?: unknown; error?: string };
    if (!response.ok || body.error)
      throw new Error(`Upstash ${args[0]} failed: ${body.error ?? response.status}`);
    return body.result;
  }

  return {
    addToSet: async (key, member) => Number(await command("SADD", key, member)) === 1,
    setSize: async (key) => Number(await command("SCARD", key)),
    removeFromSet: async (key, member) => void (await command("SREM", key, member)),
    increment: async (key) => Number(await command("INCR", key)),
    decrement: async (key) => Number(await command("DECR", key)),
  };
}
